import { NextRequest, NextResponse } from "next/server";
import { adminRtdb } from "@/lib/firebase-admin";
import type { PlayerState } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, uid, username, avatarColor } = body;

    if (!roomCode || !uid || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const configSnap = await adminRtdb
      .ref(`races/${roomCode}/config`)
      .get();

    if (!configSnap.exists()) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const config = configSnap.val();
    if (config.status !== "waiting") {
      return NextResponse.json(
        { error: "Race already started" },
        { status: 400 }
      );
    }

    const playerState: PlayerState = {
      uid,
      username,
      avatarColor: avatarColor || "#e8a317",
      currentFileIndex: 0,
      charIndex: 0,
      correctChars: 0,
      totalChars: 0,
      errors: 0,
      cpm: 0,
      accuracy: 100,
      finished: false,
      finishedAt: null,
      connected: true,
    };

    await adminRtdb
      .ref(`races/${roomCode}/players/${uid}`)
      .set(playerState);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error joining race:", error);
    return NextResponse.json(
      { error: "Failed to join race" },
      { status: 500 }
    );
  }
}
