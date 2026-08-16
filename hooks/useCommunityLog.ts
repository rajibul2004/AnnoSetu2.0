import { useQuery } from "@tanstack/react-query";

export interface LogEvent {
  id: string;
  type: "food_shared" | "food_reserved" | "badge_unlocked" | "social_follow";
  userName: string;
  action: string;
  foodName: string;
  timestamp: string;
  quantity: number;
  points: number;
  userId: string;
}

export function useCommunityLog() {
  return useQuery({
    queryKey: ["communityLog"],
    queryFn: async () => {
      const res = await fetch("/api/community-log");
      if (!res.ok) throw new Error("Failed to fetch community log");
      const data = await res.json();
      return data.data as LogEvent[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });
}
