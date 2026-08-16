import { prisma } from "@/lib/prisma";
import { BADGE_REGISTRY, BadgeCategory } from "@/lib/badges";

export const POINTS_PER_MEAL = 10;
export const CARBON_KG_PER_MEAL = 2.5;

export async function updateStreak(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let streak = await prisma.userStreak.findUnique({
    where: { userId }
  });

  if (!streak) {
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
      }
    });
  } else {
    if (streak.lastActiveDate) {
      const lastActive = new Date(streak.lastActiveDate);
      const lastActiveDateOnly = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
      
      const diffTime = today.getTime() - lastActiveDateOnly.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays === 0) {
        // no-op
      } else if (diffDays === 1) {
        streak = await prisma.userStreak.update({
          where: { userId },
          data: {
            currentStreak: streak.currentStreak + 1,
            longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
            lastActiveDate: today,
          }
        });
      } else {
        streak = await prisma.userStreak.update({
          where: { userId },
          data: {
            currentStreak: 1,
            lastActiveDate: today,
          }
        });
      }
    } else {
       streak = await prisma.userStreak.update({
          where: { userId },
          data: {
            currentStreak: 1,
            longestStreak: Math.max(streak.longestStreak, 1),
            lastActiveDate: today,
          }
        });
    }
  }

  const newBadges = await evaluateBadges(userId, streak.currentStreak, "streak");
  return { streak, newBadges };
}

export async function evaluateBadges(userId: string, count: number, category: BadgeCategory) {
  const newBadges: string[] = [];
  const relevantBadges = BADGE_REGISTRY.filter(b => b.category === category);

  for (const badge of relevantBadges) {
    if (count >= badge.threshold) {
      try {
        await prisma.userAchievement.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });
        newBadges.push(badge.id);
      } catch (e: any) {
        if (e.code !== "P2002") {
          console.error(`Failed to award badge ${badge.id} to user ${userId}:`, e);
        }
      }
    }
  }

  return newBadges;
}

export async function processPickupImpact(
  reservationId: string,
  quantity: number,
  reserverId: string,
  supplierId: string
) {
  const pointsEarned = quantity * POINTS_PER_MEAL;
  const carbonSaved = quantity * CARBON_KG_PER_MEAL;
  const allNewBadges: string[] = [];

  try {
    const consumerStreakResult = await updateStreak(reserverId);
    if (consumerStreakResult.newBadges.length > 0) allNewBadges.push(...consumerStreakResult.newBadges);
    
    const supplierStreakResult = await updateStreak(supplierId);
    if (supplierStreakResult.newBadges.length > 0) allNewBadges.push(...supplierStreakResult.newBadges);

    // 1. Update Consumer Impact
    const consumerImpact = await prisma.userImpact.upsert({
      where: { userId: reserverId },
      update: {
        points: { increment: pointsEarned },
        mealsRescued: { increment: quantity },
        carbonSavedKg: { increment: carbonSaved },
      },
      create: {
        userId: reserverId,
        points: pointsEarned,
        mealsRescued: quantity,
        carbonSavedKg: carbonSaved,
      },
    });

    // 2. Update Supplier Impact
    const supplierImpact = await prisma.userImpact.upsert({
      where: { userId: supplierId },
      update: {
        points: { increment: pointsEarned },
        mealsDonated: { increment: quantity },
        carbonSavedKg: { increment: carbonSaved },
      },
      create: {
        userId: supplierId,
        points: pointsEarned,
        mealsDonated: quantity,
        carbonSavedKg: carbonSaved,
      },
    });

    // 3. Evaluate Badges for Consumer
    const consumerMealsBadges = await evaluateBadges(reserverId, consumerImpact.mealsRescued, "meals_rescued");
    const consumerCarbonBadges = await evaluateBadges(reserverId, consumerImpact.carbonSavedKg, "carbon");
    const consumerPointsBadges = await evaluateBadges(reserverId, consumerImpact.points, "points");
    allNewBadges.push(...consumerMealsBadges, ...consumerCarbonBadges, ...consumerPointsBadges);

    // 4. Evaluate Badges for Supplier
    const supplierMealsBadges = await evaluateBadges(supplierId, supplierImpact.mealsDonated, "meals_shared");
    const supplierCarbonBadges = await evaluateBadges(supplierId, supplierImpact.carbonSavedKg, "carbon");
    const supplierPointsBadges = await evaluateBadges(supplierId, supplierImpact.points, "points");
    allNewBadges.push(...supplierMealsBadges, ...supplierCarbonBadges, ...supplierPointsBadges);

    return { 
      success: true, 
      consumerImpact, 
      supplierImpact,
      newBadges: allNewBadges 
    };
  } catch (error) {
    console.error("Failed to process pickup impact:", error);
    return { success: false, error };
  }
}
