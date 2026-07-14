import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET() {
  const activeWhere = {
    isActive: true,
    deletedAt: null,
    expiresAt: { gt: new Date() },
  } as const;
 
  const [activeListings, donations, restaurantGroups] = await Promise.all([
    prisma.food.count({ where: activeWhere }),
    prisma.food.count({ where: { ...activeWhere, isDonation: true } }),
    // Prisma has no direct "count distinct" — groupBy is the correct way
    // to get a count of unique suppliers rather than counting listings.
    prisma.food.groupBy({
      by: ["supplierId"],
      where: { ...activeWhere, supplier: { role: "restaurant" } },
    }),
  ]);
 
  return NextResponse.json({
    success: true,
    data: {
      activeListings,
      donations,
      uniqueRestaurants: restaurantGroups.length,
    },
  });
}