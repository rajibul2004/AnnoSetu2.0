// ─── XP-Based Level System ─────────────────────────────────────────

export interface LevelDefinition {
  level: number;
  title: string;
  icon: string;
  minPoints: number;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1,  title: "Seedling",  icon: "🌱", minPoints: 0 },
  { level: 2,  title: "Sprout",    icon: "🌿", minPoints: 50 },
  { level: 3,  title: "Sapling",   icon: "🌳", minPoints: 150 },
  { level: 4,  title: "Bloom",     icon: "🌸", minPoints: 400 },
  { level: 5,  title: "Harvest",   icon: "🌾", minPoints: 800 },
  { level: 6,  title: "Guardian",  icon: "🛡️", minPoints: 1500 },
  { level: 7,  title: "Champion",  icon: "⚔️", minPoints: 3000 },
  { level: 8,  title: "Hero",      icon: "🦸", minPoints: 5000 },
  { level: 9,  title: "Master",    icon: "👑", minPoints: 8000 },
  { level: 10, title: "Legend",    icon: "🏆", minPoints: 12000 },
  { level: 11, title: "Titan",     icon: "⚡", minPoints: 20000 },
  { level: 12, title: "Immortal",  icon: "🌟", minPoints: 35000 },
];

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  currentXP: number;
  xpInLevel: number;
  xpForNextLevel: number;
  progress: number; // 0–1
  isMaxLevel: boolean;
}

export function getLevel(points: number): LevelInfo {
  let current = LEVELS[0];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      current = LEVELS[i];
      break;
    }
  }

  const nextLevel = LEVELS.find(l => l.level === current.level + 1);
  const isMaxLevel = !nextLevel;

  const xpInLevel = points - current.minPoints;
  const xpForNextLevel = nextLevel ? nextLevel.minPoints - current.minPoints : 0;
  const progress = isMaxLevel ? 1 : Math.min(xpInLevel / xpForNextLevel, 1);

  return {
    level: current.level,
    title: current.title,
    icon: current.icon,
    currentXP: points,
    xpInLevel,
    xpForNextLevel,
    progress,
    isMaxLevel,
  };
}
