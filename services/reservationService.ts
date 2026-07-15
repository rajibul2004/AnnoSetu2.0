import { prisma } from "@/lib/prisma";
import {
  resolveSupplierName,
  resolveSupplierPhone,
  resolveSupplierAddress,
  SUPPLIER_NAME_SELECT,
} from "@/lib/supplier";
import { generatePickupCode } from "@/lib/pickupCode";
import { Prisma } from "@/app/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateReservationData {
  foodId: string;
  reserverId: string;
  quantity: number;
  pickupTime: Date;
  acceptedTerms: boolean;
}

export type ReservationSuccessData = {
  id: string;
  status: string;
  pickupCode: string | null;
  [key: string]: unknown;
};

export type CreateReservationResult =
  | { success: false; status: number; message: string }
  | { success: true; data: ReservationSuccessData };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all reservations placed by the given user, with food + supplier info.
 */
export async function getReservationsByReserver(reserverId: string) {
  const reservations = await prisma.reservation.findMany({
    where: { reserverId },
    orderBy: { createdAt: "desc" },
    include: {
      food: {
        select: {
          id: true,
          name: true,
          quantityUnit: true,
          originalPrice: true,
          supplierId: true,
          supplier: { select: SUPPLIER_NAME_SELECT },
        },
      },
    },
  });

  return reservations.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    totalPrice: r.totalPrice,
    status: r.status,
    pickupTime: r.pickupTime,
    pickupAddress: r.pickupAddress,
    pickupCode: r.pickupCode,
    food: {
      id: r.food.id,
      name: r.food.name,
      quantityUnit: r.food.quantityUnit,
      originalPrice: r.food.originalPrice,
      supplierId: r.food.supplierId,
      supplierName: resolveSupplierName(r.food.supplier),
    },
  }));
}

/**
 * Fetch a single reservation with full details, enforcing that the caller
 * is either the reserver or the supplier.
 * Returns null if not found or the user doesn't have access.
 */
export async function getReservationDetail(id: string, userId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      food: {
        select: {
          id: true,
          name: true,
          description: true,
          quantityUnit: true,
          expiresAt: true,
          images: { orderBy: { displayOrder: "asc" } },
        },
      },
      reserver: {
        select: { email: true, ...SUPPLIER_NAME_SELECT },
      },
      supplier: {
        select: { email: true, ...SUPPLIER_NAME_SELECT },
      },
    },
  });

  if (!reservation) return null;

  const isReserver = reservation.reserverId === userId;
  const isSupplier = reservation.supplierId === userId;
  if (!isReserver && !isSupplier) return null;

  const totalOrders = await prisma.reservation.count({
    where: {
      reserverId: reservation.reserverId,
      status: { in: ["confirmed", "picked_up"] },
    },
  });

  return {
    id: reservation.id,
    status: reservation.status,
    quantity: reservation.quantity,
    totalPrice: reservation.totalPrice,
    pickupTime: reservation.pickupTime,
    pickupCode: reservation.pickupCode,
    createdAt: reservation.createdAt,
    supplierId: reservation.supplierId,
    reserverId: reservation.reserverId,
    pickupAddress: reservation.pickupAddress,
    food: reservation.food,
    reserver: {
      name: resolveSupplierName(reservation.reserver),
      phone: resolveSupplierPhone(reservation.reserver),
      email: reservation.reserver.email,
      address: resolveSupplierAddress(reservation.reserver),
    },
    supplierName: resolveSupplierName(reservation.supplier),
    supplierPhone: resolveSupplierPhone(reservation.supplier),
    supplierEmail: reservation.supplier.email,
    totalOrders,
    isSupplierView: isSupplier,
  };
}

/**
 * Create a new reservation for a food item.
 * Validates the food item, the reserver, and the quantity before creating.
 * Runs as a transaction to also decrement availableQty on the Food row.
 */
export async function createReservation(data: CreateReservationData): Promise<
  | { success: false; status: number; message: string }
  | { success: true; data: ReservationSuccessData }
> {
  const { foodId, reserverId, quantity, pickupTime, acceptedTerms } = data;

  if (!acceptedTerms) {
    return { success: false, status: 400, message: "You must accept the pickup terms" };
  }

  const food = await prisma.food.findUnique({ where: { id: foodId } });

  if (!food || !food.isActive || food.deletedAt || new Date(food.expiresAt) <= new Date()) {
    return { success: false, status: 404, message: "Food not found" };
  }

  if (food.supplierId === reserverId) {
    return { success: false, status: 400, message: "You can't reserve your own listing" };
  }

  if (quantity > food.availableQty) {
    return {
      success: false,
      status: 400,
      message: `Only ${food.availableQty} ${food.quantityUnit} available`,
    };
  }

  if (!food.pickupAddress) {
    return {
      success: false,
      status: 400,
      message: "This listing has no pickup address set",
    };
  }

  const totalPrice = food.isDonation ? 0 : food.price * quantity;

  const [reservation] = await prisma.$transaction([
    prisma.reservation.create({
      data: {
        foodId: food.id,
        reserverId,
        supplierId: food.supplierId,
        quantity,
        pricePerUnit: food.price,
        totalPrice,
        discountApplied: food.discountPct,
        status: "pending",
        pickupTime,
        pickupAddress: food.pickupAddress,
        acceptedTerms: true,
      },
    }),
    prisma.food.update({
      where: { id: food.id },
      data: {
        availableQty: { decrement: quantity },
        reservationCount: { increment: 1 },
      },
    }),
  ]);

  return { success: true, data: reservation as unknown as ReservationSuccessData };
}

/**
 * Cancel a reservation, restoring the food's available quantity.
 * Either the reserver or the supplier may cancel.
 */
export async function cancelReservation(
  id: string,
  userId: string,
): Promise<
  | { success: false; status: number; message: string }
  | { success: true; data: unknown }
> {
  const existing = await prisma.reservation.findUnique({ where: { id } });

  const isReserver = existing?.reserverId === userId;
  const isSupplier = existing?.supplierId === userId;

  if (!existing || (!isReserver && !isSupplier)) {
    return { success: false, status: 404, message: "Reservation not found" };
  }

  if (existing.status !== "pending" && existing.status !== "confirmed") {
    return {
      success: false,
      status: 400,
      message: `A reservation that is already ${existing.status} can't be cancelled`,
    };
  }

  const [reservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: isSupplier ? "supplier_cancelled" : "user_cancelled",
      },
    }),
    prisma.food.update({
      where: { id: existing.foodId },
      data: { availableQty: { increment: existing.quantity } },
    }),
  ]);

  return { success: true, data: reservation };
}

/**
 * Confirm a pending reservation (supplier only).
 * Generates a unique pickup code, retrying up to 5 times on collision.
 */
export async function confirmReservation(
  id: string,
  supplierId: string,
): Promise<
  | { success: false; status: number; message: string }
  | { success: true; data: unknown }
> {
  const existing = await prisma.reservation.findUnique({ where: { id } });

  if (!existing) {
    return { success: false, status: 404, message: "Reservation not found" };
  }

  if (existing.supplierId !== supplierId) {
    return {
      success: false,
      status: 403,
      message: "Only the supplier can confirm this reservation",
    };
  }

  if (existing.status !== "pending") {
    return {
      success: false,
      status: 400,
      message: `This reservation is already ${existing.status}`,
    };
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: "confirmed",
          pickupCode: generatePickupCode(),
          readyAt: new Date(),
        },
      });
      return { success: true, data: reservation };
    } catch (error) {
      const isUniqueClash =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";
      if (!isUniqueClash || attempt === 4) throw error;
    }
  }

  return {
    success: false,
    status: 500,
    message: "Failed to generate a unique pickup code, please try again",
  };
}

/**
 * Verify a pickup code submitted by the supplier and mark the reservation
 * as picked_up.
 */
export async function verifyPickup(
  pickupCode: string,
  supplierId: string,
): Promise<
  | { success: false; status: number; message: string }
  | { success: true; data: { id: string; foodName: string; quantity: number } }
> {
  const reservation = await prisma.reservation.findUnique({
    where: { pickupCode: pickupCode.trim().toUpperCase() },
    include: { food: { select: { name: true } } },
  });

  if (!reservation) {
    return { success: false, status: 404, message: "Invalid pickup code" };
  }

  if (reservation.supplierId !== supplierId) {
    return {
      success: false,
      status: 403,
      message: "This reservation doesn't belong to your listings",
    };
  }

  if (reservation.status !== "confirmed") {
    return {
      success: false,
      status: 400,
      message: `This reservation is ${reservation.status}, not ready for pickup`,
    };
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "picked_up", actualPickupTime: new Date() },
  });

  return {
    success: true,
    data: {
      id: updated.id,
      foodName: reservation.food.name,
      quantity: reservation.quantity,
    },
  };
}

/**
 * Fetch the 5 most recent pickups handled by the given supplier.
 */
export async function getRecentPickupsBySupplier(supplierId: string) {
  const pickups = await prisma.reservation.findMany({
    where: { supplierId, status: "picked_up" },
    orderBy: { actualPickupTime: "desc" },
    take: 5,
    select: {
      id: true,
      pickupCode: true,
      actualPickupTime: true,
      food: { select: { name: true } },
    },
  });

  return pickups.map((p) => ({
    id: p.id,
    pickupCode: p.pickupCode,
    foodName: p.food.name,
    pickedUpAt: p.actualPickupTime,
  }));
}
