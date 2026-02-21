import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { RaceHistoryEntry, UserStats } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Get user profile
    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = userSnap.data()!;

    // Get last 10 races
    const racesSnap = await adminDb
      .collection("raceHistory")
      .where("uid", "==", uid)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const recentRaces: RaceHistoryEntry[] = racesSnap.docs.map(
      (doc) => doc.data() as RaceHistoryEntry
    );

    // Calculate fastest/slowest subfolder from all races
    const allRacesSnap = await adminDb
      .collection("raceHistory")
      .where("uid", "==", uid)
      .get();

    const subfolderCPM: Record<string, { total: number; count: number }> = {};
    allRacesSnap.docs.forEach((doc) => {
      const race = doc.data() as RaceHistoryEntry;
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
