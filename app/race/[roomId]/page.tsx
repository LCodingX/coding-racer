"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { rtdb } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Racetrack from "@/components/Racetrack";
import CodeTypingArea from "@/components/CodeTypingArea";
import RaceStatsBar from "@/components/RaceStatsBar";
import CountdownOverlay from "@/components/CountdownOverlay";
import ResultsPanel from "@/components/ResultsPanel";
import { throttle } from "@/lib/throttle";
import type { RaceConfig, PlayerState } from "@/lib/types";

export default function RacePage() {
  return (
    <AuthGuard>
      <RaceContent />
    </AuthGuard>
  );
}

function RaceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const roomId = params.roomId as string;
  const isSolo = searchParams.get("solo") === "true";

  const [config, setConfig] = useState<RaceConfig | null>(null);
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [showCountdown, setShowCountdown] = useState(false);
  const [raceActive, setRaceActive] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [myStats, setMyStats] = useState({ cpm: 0, accuracy: 100 });

  const startTimeRef = useRef<number>(0);

  // Subscribe to RTDB for config + players
  useEffect(() => {
    const configRef = ref(rtdb, `races/${roomId}/config`);
    const playersRef = ref(rtdb, `races/${roomId}/players`);

    const unsubConfig = onValue(configRef, (snap) => {
      if (snap.exists()) {
        setConfig(snap.val());
      }
    });

    const unsubPlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) {
        setPlayers(snap.val());
      }
    });

    // Set onDisconnect to mark player as disconnected
    if (user) {
      const playerConnRef = ref(
        rtdb,
        `races/${roomId}/players/${user.uid}/connected`
      );
      onDisconnect(playerConnRef).set(false);
    }

    return () => {
      unsubConfig();
      unsubPlayers();
    };
  }, [roomId, user]);

  // Auto-start solo races or when host starts
  useEffect(() => {
    if (!config) return;

    if (config.status === "countdown") {
      setShowCountdown(true);
    } else if (config.status === "racing") {
      setRaceActive(true);
      setShowCountdown(false);
    } else if (config.status === "finished") {
      setRaceActive(false);
      setRaceFinished(true);
    }

    setCurrentRound(config.currentRound || 0);
  }, [config]);

  // Throttled progress writer
  const writeProgress = useCallback(
    throttle((data: Partial<PlayerState>) => {
      if (!user) return;
      const playerRef = ref(rtdb, `races/${roomId}/players/${user.uid}`);
      set(playerRef, {
        ...players[user.uid],
        ...data,
      });
    }, 200),
    [user, roomId, players]
  );

  const handleStartRace = async () => {
    const configRef = ref(rtdb, `races/${roomId}/config`);
    await set(configRef, { ...config, status: "countdown" });
  };

  const handleCountdownComplete = useCallback(async () => {
    setShowCountdown(false);
    setRaceActive(true);
    startTimeRef.current = Date.now();

    const configRef = ref(rtdb, `races/${roomId}/config`);
    await set(configRef, { ...config, status: "racing" });
  }, [config, roomId]);

  const handleProgress = useCallback(
    (data: {
      charIndex: number;
      correctChars: number;
      totalChars: number;
      errors: number;
      cpm: number;
      accuracy: number;
    }) => {
      if (!user) return;
      setMyStats({ cpm: data.cpm, accuracy: data.accuracy });

      writeProgress({
        charIndex: data.charIndex,
        correctChars: data.correctChars,
        totalChars: data.totalChars,
        errors: data.errors,
        cpm: data.cpm,
        accuracy: data.accuracy,
        currentFileIndex: currentRound,
      });
    },
    [user, writeProgress, currentRound]
  );

  const handleFileComplete = useCallback(async () => {
    if (!config || !user || !profile) return;

    const nextRound = currentRound + 1;

    if (nextRound >= config.totalRounds) {
      // Race complete
      const myPlayer = players[user.uid];
      const finishData: Partial<PlayerState> = {
        finished: true,
        finishedAt: Date.now(),
        currentFileIndex: nextRound,
      };

      const playerRef = ref(rtdb, `races/${roomId}/players/${user.uid}`);
      await set(playerRef, { ...myPlayer, ...finishData });

      // Save results
      const sortedPlayers = Object.values({
        ...players,
        [user.uid]: { ...myPlayer, ...finishData },
      }).sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        return (a.finishedAt || Infinity) - (b.finishedAt || Infinity);
      });

      const placement =
        sortedPlayers.findIndex((p) => p.uid === user.uid) + 1;

      await fetch("/api/race/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          roomCode: roomId,
          source: config.source,
          subfolder: config.subfolder,
          cpm: myStats.cpm,
          accuracy: myStats.accuracy,
          placement,
          totalPlayers: Object.keys(players).length,
        }),
      });

      // Check if all players finished
      const allFinished = Object.values(players).every(
        (p) => p.finished || p.uid === user.uid
      );
      if (allFinished || isSolo) {
        const configRef = ref(rtdb, `races/${roomId}/config`);
        await set(configRef, { ...config, status: "finished" });
      }

      setRaceActive(false);
      setRaceFinished(true);
    } else {
      // Next round
      setCurrentRound(nextRound);
      const configRef = ref(rtdb, `races/${roomId}/config`);
      await set(configRef, {
        ...config,
        currentRound: nextRound,
        status: "between_rounds",
      });

      // Brief pause, then continue
      setTimeout(async () => {
        await set(configRef, { ...config, currentRound: nextRound, status: "racing" });
        setRaceActive(true);
      }, 2000);
    }
  }, [config, currentRound, isSolo, myStats, players, profile, roomId, user]);

  const handlePlayAgain = () => {
    router.push("/");
  };

  const handleMainMenu = () => {
    router.push("/");
  };

  if (!config) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange"></div>
        </div>
      </div>
    );
  }

  const currentFile = config.files[currentRound];
  const isHost = user?.uid === config.hostUid;

  return (
    <div className="min-h-screen">
      <Navbar />

      {showCountdown && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Racetrack */}
        <Racetrack players={players} config={config} />

        {/* Waiting lobby */}
        {config.status === "waiting" && (
          <div className="bg-navy/60 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-editor-text mb-2">
              Room: <span className="text-orange tracking-widest">{roomId}</span>
            </h2>
            <p className="text-editor-comment mb-4">
              {Object.keys(players).length} player(s) in lobby
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {Object.values(players).map((p) => (
                <div
                  key={p.uid}
                  className="flex items-center gap-2 bg-navy-light/50 px-3 py-2 rounded-lg"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-editor-text">
                    {p.username}
                  </span>
                </div>
              ))}
            </div>
            {(isHost || isSolo) && (
              <button
                onClick={handleStartRace}
                className="bg-teal hover:bg-teal-dark text-white font-bold px-8 py-3 rounded-lg transition-colors"
              >
                {isSolo ? "Start Race" : "Start Race for All"}
              </button>
            )}
            {!isHost && !isSolo && (
              <p className="text-editor-comment">Waiting for host to start...</p>
            )}
          </div>
        )}

        {/* Between rounds */}
        {config.status === "between_rounds" && (
          <div className="bg-navy/60 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-orange animate-pulse">
              Next Round...
            </h2>
          </div>
        )}

        {/* Active race */}
        {(config.status === "racing" || config.status === "between_rounds") &&
          currentFile &&
          !raceFinished && (
            <>
              <RaceStatsBar
                cpm={myStats.cpm}
                accuracy={myStats.accuracy}
                filename={currentFile.filename}
                currentRound={currentRound}
                totalRounds={config.totalRounds}
              />
              <CodeTypingArea
                code={currentFile.content}
                filename={currentFile.filename}
                onProgress={handleProgress}
                onComplete={handleFileComplete}
                disabled={config.status !== "racing"}
              />
            </>
          )}

        {/* Results */}
        {raceFinished && user && (
          <ResultsPanel
            players={players}
            myUid={user.uid}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
            isSolo={isSolo}
          />
        )}
      </main>
    </div>
  );
}
