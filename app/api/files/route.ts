import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const SOURCES_DIR: Record<string, string> = {
  kactl: path.join(process.cwd(), "kactl"),
  arena: path.join(process.cwd(), "arena"),
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const subfolder = searchParams.get("subfolder");
  const file = searchParams.get("file");
  const random = searchParams.get("random");

  // List available sources
  if (!source) {
    return NextResponse.json({ sources: Object.keys(SOURCES_DIR) });
  }

  const sourceDir = SOURCES_DIR[source];
  if (!sourceDir || !fs.existsSync(sourceDir)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  // List subfolders
  if (!subfolder) {
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    const subfolders = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    return NextResponse.json({ source, subfolders });
  }

  const subfolderDir = path.join(sourceDir, subfolder);
  if (!fs.existsSync(subfolderDir)) {
    return NextResponse.json({ error: "Invalid subfolder" }, { status: 400 });
  }

  // Return specific file content
  if (file) {
    const filePath = path.join(subfolderDir, file);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ source, subfolder, filename: file, content });
  }

  // List files in subfolder
  const entries = fs.readdirSync(subfolderDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();

  // Pick N random files
  if (random) {
    const n = Math.min(parseInt(random, 10) || 1, files.length);
    const shuffled = [...files].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, n);
    const results = picked.map((filename) => ({
      source,
      subfolder,
      filename,
      content: fs.readFileSync(path.join(subfolderDir, filename), "utf-8"),
    }));
    return NextResponse.json({ files: results });
  }

  return NextResponse.json({ source, subfolder, files });
}
