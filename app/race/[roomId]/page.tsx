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
  const { user, profile, refreshProfile } = useAuth();

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
  // Refs to avoid stale closures in callbacks
  const configRef = useRef<RaceConfig | null>(null);
  const currentRoundRef = useRef(0);
  const playersRef = useRef<Record<string, PlayerState>>({});
  const myStatsRef = useRef({ cpm: 0, accuracy: 100 });

  // Keep refs in sync with state
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { myStatsRef.current = myStats; }, [myStats]);

  // Subscribe to RTDB for config + players
  useEffect(() => {
    const configPath = ref(rtdb, `races/${roomId}/config`);
    const playersPath = ref(rtdb, `races/${roomId}/players`);

    const unsubConfig = onValue(configPath, (snap) => {
      if (snap.exists()) {
        setConfig(snap.val());
      }
    });

    const unsubPlayers = onValue(playersPath, (snap) => {
      if (snap.exists()) {
        setPlayers(snap.val());
      }
    });

    // Set onDisconnect to mark player as disconnected
    if (user) {
      const playerConnPath = ref(
        rtdb,
        `races/${roomId}/players/${user.uid}/connected`
      );
      onDisconnect(playerConnPath).set(false);
    }

    return () => {
      unsubConfig();
      unsubPlayers();
    };
  }, [roomId, user]);

  // Sync local state from RTDB config changes
  useEffect(() => {
    if (!config) return;

    if (config.status === "countdown") {
      setShowCountdown(true);
      setRaceActive(false);
    } else if (config.status === "racing") {
      setRaceActive(true);
      setShowCountdown(false);
    } else if (config.status === "between_rounds") {
      setRaceActive(false);
      setShowCountdown(false);
    } else if (config.status === "finished") {
      setRaceActive(false);
      setRaceFinished(true);
    }

    setCurrentRound(config.currentRound || 0);
  }, [config]);

  // Auto-start solo races (skip lobby)
  useEffect(() => {
    if (
      isSolo &&
      config?.status === "waiting" &&
      user &&
      players[user.uid]
    ) {
      handleStartRace();
    }
  }, [isSolo, config?.status, user, players]);

  // Throttled progress writer
  const writeProgress = useCallback(
    throttle((data: Partial<PlayerState>) => {
      if (!user) return;
      const playerPath = ref(rtdb, `races/${roomId}/players/${user.uid}`);
      set(playerPath, {
        ...playersRef.current[user.uid],
        ...data,
      });
    }, 200),
    [user, roomId]
  );

  const handleStartRace = async () => {
    const cfg = configRef.current;
    if (!cfg) return;
    const path = ref(rtdb, `races/${roomId}/config`);
    await set(path, { ...cfg, status: "countdown" });
  };

  const handleCountdownComplete = useCallback(async () => {
    setShowCountdown(false);
    setRaceActive(true);
    startTimeRef.current = Date.now();

    const cfg = configRef.current;
    if (!cfg) return;
    const path = ref(rtdb, `races/${roomId}/config`);
    await set(path, { ...cfg, status: "racing" });
  }, [roomId]);

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
        currentFileIndex: currentRoundRef.current,
      });
    },
    [user, writeProgress]
  );

  const handleFileComplete = useCallback(async () => {
    const cfg = configRef.current;
    const round = currentRoundRef.current;
    const currentPlayers = playersRef.current;
    const stats = myStatsRef.current;

    console.log("[Race] handleFileComplete called. round:", round, "totalRounds:", cfg?.totalRounds, "cfg:", !!cfg, "user:", !!user, "profile:", !!profile);

    if (!cfg || !user || !profile) return;

    const nextRound = round + 1;
    const path = ref(rtdb, `races/${roomId}/config`);
    console.log("[Race] nextRound:", nextRound, ">=", cfg.totalRounds, "?", nextRound >= cfg.totalRounds);

    if (nextRound >= cfg.totalRounds) {
      // Race complete
      const myPlayer = currentPlayers[user.uid];
      const finishData: Partial<PlayerState> = {
        finished: true,
        finishedAt: Date.now(),
        currentFileIndex: nextRound,
      };

      const playerPath = ref(rtdb, `races/${roomId}/players/${user.uid}`);
      await set(playerPath, { ...myPlayer, ...finishData });

      // Save results
      const sortedPlayers = Object.values({
        ...currentPlayers,
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
          source: cfg.source,
          subfolder: cfg.subfolder,
          cpm: stats.cpm,
          accuracy: stats.accuracy,
          placement,
          totalPlayers: Object.keys(currentPlayers).length,
        }),
      });

      // Check if all players finished
      const allFinished = Object.values(currentPlayers).every(
        (p) => p.finished || p.uid === user.uid
      );
      if (allFinished || isSolo) {
        await set(path, { ...cfg, status: "finished" });
      }

      setRaceActive(false);
      setRaceFinished(true);

      // Refresh profile so navbar CPM updates
      refreshProfile();
    } else {
      // Next round — update local state immediately, sync RTDB in background
      setConfig((prev) =>
        prev ? { ...prev, currentRound: nextRound, status: "between_rounds" } : null
      );

      // Write to RTDB in background for multiplayer sync
      set(path, { ...cfg, currentRound: nextRound, status: "between_rounds" }).catch(
        console.error
      );

      // After 2s, advance to racing
      setTimeout(() => {
        setConfig((prev) =>
          prev ? { ...prev, currentRound: nextRound, status: "racing" } : null
        );

        // Sync to RTDB in background
        const latestCfg = configRef.current;
        if (latestCfg) {
          set(path, { ...latestCfg, currentRound: nextRound, status: "racing" }).catch(
            console.error
          );
        }
      }, 2000);
    }
  }, [isSolo, profile, refreshProfile, roomId, user]);

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
                key={`round-${currentRound}`}
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
