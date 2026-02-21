"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import CPMChart from "@/components/CPMChart";
import type { UserStats } from "@/lib/types";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetch(`/api/user/stats?uid=${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* User info card */}
        {profile && (
          <div className="bg-navy/60 rounded-xl p-6 mb-6 flex items-center gap-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {profile.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-editor-text">
                {profile.username}
              </h1>
              <p className="text-editor-comment">
                Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Stats cards */}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Avg CPM"
                value={Math.round(stats.averageCPM)}
                color="text-orange"
              />
              <StatCard
                label="Total Races"
                value={stats.totalRaces}
                color="text-teal"
              />
              <StatCard
                label="Fastest Topic"
                value={stats.fastestSubfolder?.name || "N/A"}
                sub={
                  stats.fastestSubfolder
                    ? `${stats.fastestSubfolder.cpm} CPM`
                    : undefined
                }
                color="text-teal"
                isText
              />
              <StatCard
                label="Slowest Topic"
                value={stats.slowestSubfolder?.name || "N/A"}
                sub={
                  stats.slowestSubfolder
                    ? `${stats.slowestSubfolder.cpm} CPM`
                    : undefined
                }
                color="text-red-400"
                isText
              />
            </div>

            {/* CPM Chart */}
            <CPMChart
              races={stats.recentRaces}
              averageCPM={stats.averageCPM}
            />
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  isText,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-navy/60 rounded-lg p-4 text-center">
      <div
        className={`${isText ? "text-lg" : "text-3xl"} font-bold ${color}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-editor-comment mt-1">{sub}</div>}
      <div className="text-sm text-editor-comment mt-1">{label}</div>
    </div>
  );
}
