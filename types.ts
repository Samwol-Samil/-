export interface Character {
  id: string;
  name: string;
  role: string; // e.g., "Developer", "Manager", "Intern"
  traits: string[]; // e.g., "Workaholic", "Lazy", "Flirty"
  status: string; // e.g., "Single", "Dating Alice", "Married to Bob"
  relationships: Record<string, number>; // key: otherCharacterId, value: affinity (-100 to 100)
  
  // New Profile Fields
  imageUrl?: string;
  catchphrase?: string; // New field for personality inference
  age: number;
  birthday: string;
  height: number;
  mbti: string;
  likes: string[];
  dislikes: string[];
  isEmployed: boolean;
}

export interface LogEntry {
  id: string;
  day: number;
  text: string;
  type: 'neutral' | 'positive' | 'negative' | 'romantic' | 'drama';
}

export interface SimulationResult {
  logs: { text: string; type: LogEntry['type'] }[];
  relationshipUpdates: {
    sourceId: string;
    targetId: string;
    amount: number;
  }[];
  statusUpdates: {
    characterId: string;
    newStatus: string;
  }[];
  roleUpdates: {
    characterId: string;
    newRole: string;
    isEmployed: boolean;
  }[];
}

export interface SimulationState {
  day: number;
  characters: Character[];
  logs: LogEntry[];
  isProcessing: boolean;
}

export interface SaveData {
  version: number;
  timestamp: number;
  day: number;
  characters: Character[];
  logs: LogEntry[];
}