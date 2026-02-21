import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { RaceHistoryEntry } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      uid,
      roomCode,
      source,
      subfolder,
      cpm,
      accuracy,
      placement,
      totalPlayers,
    } = body;

    if (!uid || !roomCode || cpm === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const entry: RaceHistoryEntry = {
      raceId: `${roomCode}_${uid}_${Date.now()}`,
      uid,
      roomCode,
      source,
      subfolder,
      cpm,
      accuracy,
      placement: placement || 1,
      totalPlayers: totalPlayers || 1,
      timestamp: Date.now(),
    };

    // Save race history
    await adminDb.collection("raceHistory").add(entry);

    // Update user stats
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const userData = userSnap.data()!;
      const totalRaces = (userData.totalRaces || 0) + 1;
      const prevAvg = userData.averageCPM || 0;
      const averageCPM = (prevAvg * (totalRaces - 1) + cpm) / totalRaces;

      await userRef.update({ totalRaces, averageCPM });
    }

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Error finishing race:", error);
    return NextResponse.json(
      { error: "Failed to save race result" },
      { status: 500 }
    );
  }
}
