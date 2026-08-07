import { NextRequest, NextResponse } from "next/server";
import { parseFoodListingWithAI } from "@/lib/ai/foodParser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transcript = body?.transcript?.trim();
    const language = body?.language || "en-IN";

    if (!transcript || transcript.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid spoken transcript to analyze.",
        },
        { status: 400 }
      );
    }

    const parsedData = await parseFoodListingWithAI(transcript, language);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/voice-parse:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to parse voice listing.",
      },
      { status: 500 }
    );
  }
}
