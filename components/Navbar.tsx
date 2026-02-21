"use client";

import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase-client";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <nav className="bg-navy h-14 flex items-center px-6 justify-between shadow-lg">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-orange font-bold text-xl">{"</>"}</span>
        <span className="text-white font-semibold text-lg">Coding Racer</span>
      </Link>

      {profile && (
        <div className="flex items-center gap-4">
          <span className="bg-navy-light px-3 py-1 rounded text-sm text-editor-text">
            {Math.round(profile.recentAverageCPM || 0)} CPM
          </span>
          <Link
            href="/profile"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {profile.username[0].toUpperCase()}
            </div>
            <span className="text-white text-sm">{profile.username}</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
