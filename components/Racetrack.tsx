"use client";

import type { PlayerState, RaceConfig } from "@/lib/types";

interface RacetrackProps {
  players: Record<string, PlayerState>;
  config: RaceConfig;
}

export default function Racetrack({ players, config }: RacetrackProps) {
  const cx = 300;
  const cy = 100;
  const rx = 260;
  const ry = 70;

  const getPlayerPosition = (player: PlayerState) => {
    const totalContent = config.files.reduce(
      (sum, f) => sum + f.content.length,
      0
    );
    const completedContent = config.files
      .slice(0, player.currentFileIndex)
      .reduce((sum, f) => sum + f.content.length, 0);
    const currentProgress =
      player.currentFileIndex < config.files.length
        ? player.charIndex
        : 0;
    const overallProgress = (completedContent + currentProgress) / totalContent;

    // Start from top, go clockwise
    const angle = -Math.PI / 2 + overallProgress * 2 * Math.PI;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="w-full flex justify-center">
      <svg viewBox="0 0 600 200" className="w-full max-w-2xl">
        {/* Track */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="#45475a"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="#585b70"
          strokeWidth="2"
          strokeDasharray="8 4"
        />

        {/* Start/finish line */}
        <line
          x1={cx}
          y1={cy - ry - 12}
          x2={cx}
          y2={cy - ry + 12}
          stroke="#e8a317"
          strokeWidth="3"
        />

        {/* Players */}
        {Object.values(players).map((player) => {
          const pos = getPlayerPosition(player);
          return (
            <g
              key={player.uid}
              style={{
                transition: "transform 300ms ease-out",
                transform: `translate(${pos.x}px, ${pos.y}px)`,
              }}
            >
              <circle
                cx={0}
                cy={0}
                r={12}
                fill={player.avatarColor}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={0}
                y={1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
              >
                {player.username[0].toUpperCase()}
              </text>
              <text
                x={0}
                y={-18}
                textAnchor="middle"
                fill="#cdd6f4"
                fontSize="9"
              >
                {player.username}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
