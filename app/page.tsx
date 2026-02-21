"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

function HomeContent() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [source, setSource] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  const [subfolder, setSubfolder] = useState<string>("");
  const [subfolders, setSubfolders] = useState<string[]>([]);
  const [rounds, setRounds] = useState(3);
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Fetch available sources
  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => setSources(data.sources || []))
      .catch(console.error);
  }, []);

  // Fetch subfolders when source changes
  useEffect(() => {
    if (!source) {
      setSubfolders([]);
      setSubfolder("");
      return;
    }
    fetch(`/api/files?source=${source}`)
      .then((res) => res.json())
      .then((data) => {
        setSubfolders(data.subfolders || []);
        setSubfolder("");
      })
      .catch(console.error);
  }, [source]);

  const handleSoloRace = async () => {
    if (!source || !subfolder || !user || !profile) return;
    setCreating(true);
    setError("");

    try {
      // Create room
      const createRes = await fetch("/api/race/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          source,
          subfolder,
          totalRounds: rounds,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Failed to create race");
      }

      const { roomCode } = await createRes.json();

      // Join room
      await fetch("/api/race/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          uid: user.uid,
          username: profile.username,
          avatarColor: profile.avatarColor,
        }),
      });

      router.push(`/race/${roomCode}?solo=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create race");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!source || !subfolder || !user || !profile) return;
    setCreating(true);
    setError("");

    try {
      const createRes = await fetch("/api/race/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          source,
          subfolder,
          totalRounds: rounds,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Failed to create race");
      }

      const { roomCode } = await createRes.json();

      await fetch("/api/race/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          uid: user.uid,
          username: profile.username,
          avatarColor: profile.avatarColor,
        }),
      });

      router.push(`/race/${roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create race");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode || !user || !profile) return;
    setJoining(true);
    setError("");

    try {
      const res = await fetch("/api/race/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: joinCode.toUpperCase(),
          uid: user.uid,
          username: profile.username,
          avatarColor: profile.avatarColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join room");
      }

      router.push(`/race/${joinCode.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-2">
          <span className="text-orange">{"</>"}</span> Race Setup
        </h1>
        <p className="text-editor-comment text-center mb-10">
          Choose your code and start racing
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-400/30 text-red-400 px-4 py-2 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Source & Subfolder Selection */}
        <div className="bg-navy/60 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-editor-comment mb-2">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-editor-bg border border-navy-light rounded-lg px-4 py-2.5 text-editor-text outline-none focus:border-orange transition-colors"
              >
                <option value="">Select source...</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-editor-comment mb-2">
                Subfolder
              </label>
              <select
                value={subfolder}
                onChange={(e) => setSubfolder(e.target.value)}
                className="w-full bg-editor-bg border border-navy-light rounded-lg px-4 py-2.5 text-editor-text outline-none focus:border-orange transition-colors"
                disabled={!source}
              >
                <option value="">Select subfolder...</option>
                {subfolders.map((sf) => (
                  <option key={sf} value={sf}>
                    {sf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-editor-comment mb-2">
              Rounds (1-6)
            </label>
            <input
              type="number"
              min={1}
              max={6}
              value={rounds}
              onChange={(e) =>
                setRounds(
                  Math.max(1, Math.min(6, parseInt(e.target.value) || 1))
                )
              }
              className="w-24 bg-editor-bg border border-navy-light rounded-lg px-4 py-2.5 text-editor-text outline-none focus:border-orange transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSoloRace}
              disabled={!source || !subfolder || creating}
              className="flex-1 bg-teal hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
            >
              {creating ? "Creating..." : "Solo Race"}
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={!source || !subfolder || creating}
              className="flex-1 bg-orange hover:bg-orange-light disabled:opacity-50 disabled:cursor-not-allowed text-navy font-bold py-3 rounded-lg transition-colors"
            >
              {creating ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>

        {/* Join Room */}
        <div className="bg-navy/60 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-editor-text mb-4">
            Join a Room
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={6}
              className="flex-1 bg-editor-bg border border-navy-light rounded-lg px-4 py-3 text-editor-text outline-none focus:border-orange transition-colors uppercase tracking-widest text-center font-bold"
            />
            <button
              onClick={handleJoinRoom}
              disabled={joinCode.length !== 6 || joining}
              className="bg-orange hover:bg-orange-light disabled:opacity-50 disabled:cursor-not-allowed text-navy font-bold px-6 py-3 rounded-lg transition-colors"
            >
              {joining ? "Joining..." : "Join"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
