"use client";

import { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step");

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      router.push("/");
    }
  }, [user, profile, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleCheckUsername = async (value: string) => {
    setUsername(value);
    setUsernameError("");

    if (value.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Only letters, numbers, and underscores");
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(
        `/api/user/check-username?username=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      if (!data.available) {
        setUsernameError("Username already taken");
      }
    } catch {
      setUsernameError("Error checking username");
    } finally {
      setChecking(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!user || usernameError || username.length < 3) return;

    setCreating(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, username }),
      });

      if (res.ok) {
        await refreshProfile();
        router.push("/");
      } else {
        const data = await res.json();
        setUsernameError(data.error || "Failed to create profile");
      }
    } catch {
      setUsernameError("Error creating profile");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange"></div>
      </div>
    );
  }

  // Username selection step
  if (user && !profile && (step === "username" || !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-navy/60 rounded-xl p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-center mb-2">
            <span className="text-orange">{"</>"}</span> Choose Your Name
          </h1>
          <p className="text-editor-comment text-center mb-8">
            Pick a username for the leaderboard
          </p>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => handleCheckUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-editor-bg border border-navy-light rounded-lg px-4 py-3 text-editor-text outline-none focus:border-orange transition-colors"
                maxLength={20}
              />
              {usernameError && (
                <p className="text-red-400 text-sm mt-1">{usernameError}</p>
              )}
              {username.length >= 3 && !usernameError && !checking && (
                <p className="text-teal text-sm mt-1">Username available!</p>
              )}
            </div>

            <button
              onClick={handleCreateProfile}
              disabled={
                creating || checking || !!usernameError || username.length < 3
              }
              className="w-full bg-orange hover:bg-orange-light disabled:opacity-50 disabled:cursor-not-allowed text-navy font-bold py-3 rounded-lg transition-colors"
            >
              {creating ? "Creating..." : "Start Racing"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sign in step
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-navy/60 rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-orange">{"</>"}</span> Coding Racer
        </h1>
        <p className="text-editor-comment mb-8">
          Race by typing competitive programming code
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
