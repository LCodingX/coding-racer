"use client";

import type { PlayerState } from "@/lib/types";

interface ResultsPanelProps {
  players: Record<string, PlayerState>;
  myUid: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  isSolo: boolean;
}

export default function ResultsPanel({
  players,
  myUid,
  onPlayAgain,
  onMainMenu,
  isSolo,
}: ResultsPanelProps) {
  const sorted = Object.values(players).sort((a, b) => {
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    if (a.finished && b.finished) return (a.finishedAt || 0) - (b.finishedAt || 0);
    return b.cpm - a.cpm;
  });

  const myPlayer = players[myUid];

  return (
    <div className="bg-navy/60 rounded-lg p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center text-orange mb-6">
        Race Complete!
      </h2>

      {!isSolo && (
        <div className="space-y-3 mb-6">
          {sorted.map((player, index) => (
            <div
              key={player.uid}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.uid === myUid
                  ? "bg-orange/10 border border-orange/30"
                  : "bg-navy-light/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-lg font-bold ${
                    index === 0
                      ? "text-yellow-400"
                      : index === 1
                      ? "text-gray-300"
                      : index === 2
                      ? "text-amber-600"
                      : "text-editor-comment"
                  }`}
                >
                  #{index + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.username[0].toUpperCase()}
                </div>
                <span className="text-editor-text">{player.username}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-orange">{player.cpm} CPM</span>
                <span className="text-teal">{player.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isSolo && myPlayer && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-navy-light/50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-orange">{myPlayer.cpm}</div>
            <div className="text-sm text-editor-comment">CPM</div>
          </div>
          <div className="bg-navy-light/50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-teal">{myPlayer.accuracy}%</div>
            <div className="text-sm text-editor-comment">Accuracy</div>
          </div>
          <div className="bg-navy-light/50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-editor-text">{myPlayer.errors}</div>
            <div className="text-sm text-editor-comment">Errors</div>
          </div>
          <div className="bg-navy-light/50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-editor-text">{myPlayer.correctChars}</div>
            <div className="text-sm text-editor-comment">Correct Chars</div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button
          onClick={onPlayAgain}
          className="bg-orange hover:bg-orange-light text-navy font-bold px-6 py-2 rounded-lg transition-colors"
        >
          Race Again
        </button>
        <button
          onClick={onMainMenu}
          className="bg-navy-light hover:bg-navy text-editor-text font-bold px-6 py-2 rounded-lg transition-colors border border-navy"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
