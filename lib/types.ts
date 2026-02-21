export interface UserProfile {
  uid: string;
  username: string;
  avatarColor: string;
  createdAt: number;
  totalRaces: number;
  averageCPM: number;
  recentAverageCPM: number;
}

export interface RaceFile {
  source: "kactl" | "arena";
  subfolder: string;
  filename: string;
  content: string;
}

export interface RaceConfig {
  roomCode: string;
  hostUid: string;
  source: "kactl" | "arena";
  subfolder: string;
  files: RaceFile[];
  totalRounds: number;
  currentRound: number;
  mode: "snippet" | "full";
  status: "waiting" | "countdown" | "racing" | "between_rounds" | "finished";
  createdAt: number;
}

export interface PlayerState {
  uid: string;
  username: string;
  avatarColor: string;
  currentFileIndex: number;
  charIndex: number;
  correctChars: number;
  totalChars: number;
  errors: number;
  cpm: number;
  accuracy: number;
  finished: boolean;
  finishedAt: number | null;
  connected: boolean;
}

export interface RaceHistoryEntry {
  raceId: string;
  uid: string;
  roomCode: string;
  source: "kactl" | "arena";
  subfolder: string;
  cpm: number;
  accuracy: number;
  placement: number;
  totalPlayers: number;
  timestamp: number;
}

export interface UserStats {
  averageCPM: number;
  totalRaces: number;
  recentRaces: RaceHistoryEntry[];
  fastestSubfolder: { name: string; cpm: number } | null;
  slowestSubfolder: { name: string; cpm: number } | null;
}
