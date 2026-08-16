import { useQuery } from "@tanstack/react-query";
import { LevelInfo } from "@/lib/levels";

interface UserImpact {
  points: number;
  mealsRescued: number;
  mealsDonated: number;
  carbonSavedKg: number;
}

interface UserAchievement {
  id: string;
  badgeId: string;
  unlockedAt: string;
}

interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface ImpactData {
  impact: UserImpact;
  achievements: UserAchievement[];
  communityRank: number;
  streak: UserStreak;
  level: LevelInfo;
}

export function useImpact() {
  return useQuery({
    queryKey: ["userImpact"],
    queryFn: async () => {
      const res = await fetch("/api/impact");
      if (!res.ok) throw new Error("Failed to fetch impact");
      const data = await res.json();
      return data.data as ImpactData;
    },
  });
}
