"use client";

interface RaceStatsBarProps {
  cpm: number;
  accuracy: number;
  filename: string;
  currentRound: number;
  totalRounds: number;
}

export default function RaceStatsBar({
  cpm,
  accuracy,
  filename,
  currentRound,
  totalRounds,
}: RaceStatsBarProps) {
  return (
    <div className="flex items-center justify-between bg-navy/60 px-4 py-2 rounded-lg text-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-editor-comment">CPM</span>
          <span className="text-orange font-bold text-lg">{cpm}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-editor-comment">Accuracy</span>
          <span
            className={`font-bold text-lg ${
              accuracy >= 95
                ? "text-teal"
                : accuracy >= 80
                ? "text-orange"
                : "text-red-400"
            }`}
          >
            {accuracy}%
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-editor-comment">{filename}</span>
        <span className="text-editor-text">
          Round {currentRound + 1}/{totalRounds}
        </span>
      </div>
    </div>
  );
}
