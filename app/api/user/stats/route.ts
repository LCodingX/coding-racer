import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { RaceHistoryEntry, UserStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Get user profile
    const userSnap = await getAdminDb().collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = userSnap.data()!;

    // Get all races for this user (single-field index, no composite needed)
    const allRacesSnap = await getAdminDb()
      .collection("raceHistory")
      .where("uid", "==", uid)
      .get();

    const allRaces: RaceHistoryEntry[] = allRacesSnap.docs.map(
      (doc) => doc.data() as RaceHistoryEntry
    );

    // Sort by timestamp desc and take last 10
    allRaces.sort((a, b) => b.timestamp - a.timestamp);
    const recentRaces = allRaces.slice(0, 10);

    // Calculate fastest/slowest subfolder
    const subfolderCPM: Record<string, { total: number; count: number }> = {};
    allRaces.forEach((race) => {
      const key = `${race.source}/${race.subfolder}`;
      if (!subfolderCPM[key]) {
        subfolderCPM[key] = { total: 0, count: 0 };
      }
      subfolderCPM[key].total += race.cpm;
      subfolderCPM[key].count += 1;
    });

    let fastestSubfolder: { name: string; cpm: number } | null = null;
    let slowestSubfolder: { name: string; cpm: number } | null = null;

    Object.entries(subfolderCPM).forEach(([name, { total, count }]) => {
      const avg = total / count;
      if (!fastestSubfolder || avg > fastestSubfolder.cpm) {
        fastestSubfolder = { name, cpm: Math.round(avg) };
      }
      if (!slowestSubfolder || avg < slowestSubfolder.cpm) {
        slowestSubfolder = { name, cpm: Math.round(avg) };
      }
    });

    const stats: UserStats = {
      averageCPM: user.averageCPM || 0,
      totalRaces: user.totalRaces || 0,
      recentRaces,
      fastestSubfolder,
      slowestSubfolder,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
