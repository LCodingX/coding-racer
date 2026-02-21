import { NextRequest, NextResponse } from "next/server";
import { getAdminRtdb } from "@/lib/firebase-admin";
import type { RaceConfig, RaceFile } from "@/lib/types";
import fs from "fs";
import path from "path";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const SOURCES_DIR: Record<string, string> = {
  kactl: path.join(process.cwd(), "kactl"),
  arena: path.join(process.cwd(), "arena"),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, source, subfolder, totalRounds } = body;

    if (!uid || !source || !subfolder || !totalRounds) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sourceDir = SOURCES_DIR[source];
    if (!sourceDir) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const subfolderDir = path.join(sourceDir, subfolder);
    if (!fs.existsSync(subfolderDir)) {
      return NextResponse.json(
        { error: "Invalid subfolder" },
        { status: 400 }
      );
    }

    const allFiles = fs
      .readdirSync(subfolderDir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);

    const rounds = Math.min(totalRounds, allFiles.length);
    const shuffled = [...allFiles].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, rounds);

    const files: RaceFile[] = picked.map((filename) => ({
      source: source as "kactl" | "arena",
      subfolder,
      filename,
      content: fs.readFileSync(path.join(subfolderDir, filename), "utf-8").replace(/\r/g, ""),
    }));

    const roomCode = generateRoomCode();

    const config: RaceConfig = {
      roomCode,
      hostUid: uid,
      source,
      subfolder,
      files,
      totalRounds: rounds,
      currentRound: 0,
      status: "waiting",
      createdAt: Date.now(),
    };

    await getAdminRtdb().ref(`races/${roomCode}/config`).set(config);

    return NextResponse.json({ roomCode, files });
  } catch (error) {
    console.error("Error creating race:", error);
    return NextResponse.json(
      { error: "Failed to create race" },
      { status: 500 }
    );
  }
}
