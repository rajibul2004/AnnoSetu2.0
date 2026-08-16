import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PublicActivity {
  id: string;
  type: 'RESCUE' | 'SHARE';
  title: string;
  quantity: number;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  points: number;
  mealsRescued: number;
  mealsShared: number;
  carbonSaved: number;
  currentStreak: number;
  longestStreak: number;
  level: {
    number: number;
    title: string;
    icon: string;
  };
  badges: string[];
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  recentActivity: PublicActivity[];
}

export function usePublicProfile(userId: string) {
  return useQuery<PublicProfile>({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/public-profile`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useFollowUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to follow user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', userId] });
    },
  });
}

export function useUnfollowUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unfollow user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', userId] });
    },
  });
}
