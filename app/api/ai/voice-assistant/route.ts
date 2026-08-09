import { NextRequest, NextResponse } from "next/server";
import { parseFoodWithLocalNLP, ParsedFoodListing } from "@/lib/ai/foodParser";
import {
  ConversationStep,
  getNextStep,
  mergeExtractedFields,
  STEP_PROMPTS,
} from "@/lib/voice/conversationStateMachine";
import { recordLearnedTestCase } from "@/lib/ai/learningEngine";
import { SupportedLanguage } from "@/lib/voice/speechRecognition";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transcript = "",
      language = "en-IN",
      currentStep = "DISH_NAME",
      currentFormData = {},
    }: {
      transcript: string;
      language: SupportedLanguage;
      currentStep: ConversationStep;
      currentFormData: Partial<ParsedFoodListing>;
    } = body;

    const trimmedInput = transcript.trim();
    if (!trimmedInput) {
      const stepPrompt = STEP_PROMPTS[language]?.[currentStep] || STEP_PROMPTS["en-IN"][currentStep];
      return NextResponse.json({
        success: true,
        extracted: currentFormData,
        currentStep,
        nextStep: currentStep,
        aiResponseText: stepPrompt.spokenText,
        displayTitle: stepPrompt.displayTitle,
        isComplete: false,
        source: "prompt",
      });
    }

    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY;

    let incomingExtracted: Partial<ParsedFoodListing> = {};
    let usedSource: "gemini" | "local_nlp" = "local_nlp";

    // 1. Try Gemini parsing if API key is present
    if (geminiApiKey) {
      try {
        const systemPrompt = `You are AnnoSetu AI Voice-to-Listing Assistant.
Analyze the user's spoken input in the context of listing food surplus/donations.
Language Hint: ${language}
Current Conversation Step: ${currentStep}
Current Data Collected So Far: ${JSON.stringify(currentFormData)}

User Spoken Input: "${trimmedInput}"

TASK:
Extract any food fields mentioned. If the user answered the current step OR provided all listing info at once, extract:
- name: (dish name only, e.g. "Chicken Biryani", "Khichuri", "Paneer Butter Masala" - NO filler words)
- quantity: number (e.g. 10)
- quantityUnit: "plates" | "servings" | "kg" | "packets" | "units"
- isDonation: boolean (true if user says "donation", "free", "muft", "daan", "binamulle")
- price: number (price in INR if paid, 0 if donation)
- expiresInHours: number (expiry/pickup hours e.g. 2, 3, 4)
- isHomeCooked: boolean
- cuisineType: string

Return ONLY a valid JSON object matching these extracted keys.`;

        const candidateModels = [
          "gemini-flash-latest",
          "gemini-2.0-flash",
          "gemini-1.5-flash",
        ];

        let geminiData: any = null;
        for (const model of candidateModels) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
                  generationConfig: {
                    temperature: 0.05,
                    responseMimeType: "application/json",
                    maxOutputTokens: 1024,
                  },
                }),
                signal: AbortSignal.timeout(8000),
              }
            );

            if (res.ok) {
              geminiData = await res.json();
              break;
            }
          } catch {
            // Try next model
          }
        }

        if (geminiData) {
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            let clean = rawText
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/\s*```$/i, "")
              .trim();
            try {
              incomingExtracted = JSON.parse(clean);
              usedSource = "gemini";
            } catch {
              const sanitized = clean.replace(/[\n\r\t]+/g, " ");
              const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                incomingExtracted = JSON.parse(jsonMatch[0]);
                usedSource = "gemini";
              }
            }
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini route error, falling back to local NLP:", geminiErr);
      }
    }

    // 2. If Gemini didn't extract or wasn't available, use local rule-based NLP
    if (!incomingExtracted.name && !incomingExtracted.quantity && incomingExtracted.isDonation === undefined) {
      const localResult = parseFoodWithLocalNLP(trimmedInput);

      // Map step-specific single values if user only spoke a single word / number
      if (currentStep === "DISH_NAME" && trimmedInput.length >= 2 && !localResult.name) {
        incomingExtracted.name = trimmedInput;
      } else if (currentStep === "QUANTITY" && !incomingExtracted.quantity) {
        const numMatch = trimmedInput.match(/(\d+)/);
        if (numMatch) {
          incomingExtracted.quantity = parseInt(numMatch[1], 10);
        }
      } else if (currentStep === "PRICING") {
        if (/free|donation|daan|muft|binamulle/i.test(trimmedInput)) {
          incomingExtracted.isDonation = true;
          incomingExtracted.price = 0;
        } else {
          const priceMatch = trimmedInput.match(/(\d+)/);
          if (priceMatch) {
            incomingExtracted.isDonation = false;
            incomingExtracted.price = parseInt(priceMatch[1], 10);
          }
        }
      } else if (currentStep === "EXPIRY") {
        const hrMatch = trimmedInput.match(/(\d+)/);
        if (hrMatch) {
          incomingExtracted.expiresInHours = Math.min(24, Math.max(1, parseInt(hrMatch[1], 10)));
        }
      }

      // Merge local NLP result
      if (localResult.name && localResult.name !== "Delicious Fresh Food") {
        incomingExtracted.name = localResult.name;
      }
      if (localResult.quantity > 0) {
        incomingExtracted.quantity = localResult.quantity;
        incomingExtracted.quantityUnit = localResult.quantityUnit;
      }
      if (localResult.isDonation !== undefined) {
        incomingExtracted.isDonation = localResult.isDonation;
        incomingExtracted.price = localResult.price;
      }
      if (localResult.expiresInHours > 0) {
        incomingExtracted.expiresInHours = localResult.expiresInHours;
      }
    }

    // 3. Merge newly extracted fields with state
    const updatedFormData = mergeExtractedFields(currentFormData, incomingExtracted);

    // 4. Calculate next conversation step
    const nextStep = getNextStep(updatedFormData);
    const isComplete = nextStep === "COMPLETED";

    // 5. Get spoken audio prompt and display title for next step
    const nextStepPrompt =
      STEP_PROMPTS[language]?.[nextStep] || STEP_PROMPTS["en-IN"][nextStep];

    // 6. Record to offline learning dataset if Gemini extraction succeeded
    if (usedSource === "gemini" && trimmedInput.length >= 4 && updatedFormData.name) {
      try {
        recordLearnedTestCase(
          trimmedInput,
          language,
          updatedFormData as ParsedFoodListing,
          "gemini"
        );
      } catch {
        // Ignored
      }
    }

    return NextResponse.json({
      success: true,
      extracted: updatedFormData,
      currentStep,
      nextStep,
      aiResponseText: nextStepPrompt.spokenText,
      displayTitle: nextStepPrompt.displayTitle,
      placeholder: nextStepPrompt.placeholder,
      quickChips: nextStepPrompt.quickChips,
      isComplete,
      source: usedSource,
    });
  } catch (error: any) {
    console.error("Voice assistant API route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process voice input",
      },
      { status: 500 }
    );
  }
}
