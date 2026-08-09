import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }

    const [total, reports] = await Promise.all([
      prisma.foodReport.count({ where }),
      prisma.foodReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          food: {
            include: {
              supplier: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  individualProfile: { select: { name: true } },
                  restaurantProfile: { select: { restaurantName: true } },
                },
              },
            },
          },
          reporter: {
            select: {
              id: true,
              email: true,
              role: true,
              individualProfile: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Admin reports GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reportId,
      status,
      actionNotes,
    }: {
      reportId: string;
      status: "pending" | "reviewed" | "actioned" | "dismissed";
      actionNotes?: string;
    } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing reportId or status" },
        { status: 400 }
      );
    }

    const updated = await prisma.foodReport.update({
      where: { id: reportId },
      data: {
        status,
        ...(actionNotes ? { notes: actionNotes } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Report marked as ${status}`,
    });
  } catch (error: any) {
    console.error("Admin reports PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update report" },
      { status: 500 }
    );
  }
}
