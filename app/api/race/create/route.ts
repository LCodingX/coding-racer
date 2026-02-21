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

const HEADER_PATTERNS = [
  // Python
  /^(def |class )/,
  // C++ / KACTL style
  /^(void |int |bool |ll |ld |string |auto |template|struct |pair|vector|vi |vl |typedef)/,
];

function extractSnippet(content: string): string {
  const lines = content.split("\n");

  // Find all lines matching function/class headers
  const headerIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (HEADER_PATTERNS.some((pat) => pat.test(lines[i]))) {
      headerIndices.push(i);
    }
  }

  let startLine: number;
  if (headerIndices.length > 0) {
    startLine = headerIndices[Math.floor(Math.random() * headerIndices.length)];
  } else {
    // Fallback: first 10 lines
    startLine = 0;
  }

  const snippet = lines.slice(startLine, startLine + 10);

  // Trim trailing blank lines
  while (snippet.length > 0 && snippet[snippet.length - 1].trim() === "") {
    snippet.pop();
  }

  return snippet.join("\n");
}

const SOURCES_DIR: Record<string, string> = {
  kactl: path.join(process.cwd(), "kactl"),
  arena: path.join(process.cwd(), "arena"),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, source, subfolder, totalRounds, mode = "snippet" } = body;

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

    const files: RaceFile[] = picked.map((filename) => {
      let content = fs
        .readFileSync(path.join(subfolderDir, filename), "utf-8")
        .replace(/\r/g, "");
      if (mode === "snippet") {
        content = extractSnippet(content);
      }
      return {
        source: source as "kactl" | "arena",
        subfolder,
        filename,
        content,
      };
    });

    const roomCode = generateRoomCode();

    const config: RaceConfig = {
      roomCode,
      hostUid: uid,
      source,
      subfolder,
      files,
      totalRounds: rounds,
      currentRound: 0,
      mode: mode as "snippet" | "full",
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
