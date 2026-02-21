import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { UserProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = [
  "#e8a317",
  "#2ecc71",
  "#3498db",
  "#e74c3c",
  "#9b59b6",
  "#1abc9c",
  "#f39c12",
  "#e67e22",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, username } = body;

    if (!uid || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const existing = await getAdminDb()
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!existing.empty) {
      const existingUser = existing.docs[0];
      if (existingUser.id !== uid) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    const profile: UserProfile = {
      uid,
      username,
      avatarColor:
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      createdAt: Date.now(),
      totalRaces: 0,
      averageCPM: 0,
      recentAverageCPM: 0,
    };

    await getAdminDb().collection("users").doc(uid).set(profile);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const userSnap = await getAdminDb().collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compute recentAverageCPM from last 10 races
    const recentRacesSnap = await getAdminDb()
      .collection("raceHistory")
      .where("uid", "==", uid)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    let recentAverageCPM = 0;
    if (!recentRacesSnap.empty) {
      const totalCPM = recentRacesSnap.docs.reduce(
        (sum, doc) => sum + (doc.data().cpm || 0),
        0
      );
      recentAverageCPM = totalCPM / recentRacesSnap.docs.length;
    }

    return NextResponse.json({
      profile: { ...userSnap.data(), recentAverageCPM },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
