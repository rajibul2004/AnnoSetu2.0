import fs from "fs";
import path from "path";
import { parseFoodWithLocalNLP, type ParsedFoodListing } from "./foodParser";

export interface OfflineTestCase {
  id: string;
  transcript: string;
  language: string;
  groundTruth: ParsedFoodListing;
  provider: "gemini" | "manual" | "user_feedback";
  timestamp: string;
  confidence: number;
}

export interface BenchmarkReport {
  totalCases: number;
  nameAccuracyPct: number;
  quantityAccuracyPct: number;
  donationAccuracyPct: number;
  priceAccuracyPct: number;
  overallScorePct: number;
  details: Array<{
    transcript: string;
    expected: Partial<ParsedFoodListing>;
    actual: Partial<ParsedFoodListing>;
    passed: boolean;
  }>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const TEST_CASES_FILE = path.join(DATA_DIR, "offline_nlp_test_cases.json");

// Default initial dataset of realistic benchmark cases across languages
const SEED_TEST_CASES: OfflineTestCase[] = [
  {
    id: "seed-1",
    transcript: "Amar kache 10 plate biriyani ache jeta ami donation hisabe dite chai",
    language: "bn-IN",
    provider: "gemini",
    timestamp: new Date().toISOString(),
    confidence: 0.99,
    groundTruth: {
      name: "Biriyani",
      description: "Biriyani. Freshly prepared quality meal. Available as a free community donation.",
      quantity: 10,
      quantityUnit: "plates",
      isDonation: true,
      price: 0,
      originalPrice: null,
      discountPct: 0,
      isRaw: false,
      isHomeCooked: false,
      cuisineType: "bengali",
      allergens: [],
      tags: ["donation", "restaurant", "bengali"],
      expiresInHours: 4,
      expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      pickupAddressHint: null,
      confidence: { overall: 0.99, name: 0.99, quantity: 0.99, price: 0.99, expiry: 0.95 },
      detectedEntities: {
        dishName: "Biriyani",
        quantityFound: "10 plates",
        pricingFound: "Free Donation",
        cuisineFound: "bengali",
      },
      rawTranscript: "Amar kache 10 plate biriyani ache jeta ami donation hisabe dite chai",
    },
  },
  {
    id: "seed-2",
    transcript: "5 plates of homemade paneer butter masala combo, free donation, pickup in 3 hours",
    language: "en-IN",
    provider: "gemini",
    timestamp: new Date().toISOString(),
    confidence: 0.98,
    groundTruth: {
      name: "Paneer Butter Masala",
      description: "Paneer Butter Masala. Wholesome homemade cooking. Available as a free community donation.",
      quantity: 5,
      quantityUnit: "plates",
      isDonation: true,
      price: 0,
      originalPrice: null,
      discountPct: 0,
      isRaw: false,
      isHomeCooked: true,
      cuisineType: "north_indian",
      allergens: ["dairy"],
      tags: ["donation", "homestyle", "vegetarian", "north_indian"],
      expiresInHours: 3,
      expiresAt: new Date(Date.now() + 3 * 3600000).toISOString(),
      pickupAddressHint: null,
      confidence: { overall: 0.98, name: 0.98, quantity: 0.98, price: 0.98, expiry: 0.98 },
      detectedEntities: {
        dishName: "Paneer Butter Masala",
        quantityFound: "5 plates",
        pricingFound: "Free Donation",
        expiryFound: "in 3 hours",
        cuisineFound: "north_indian",
        allergensFound: ["dairy"],
      },
      rawTranscript: "5 plates of homemade paneer butter masala combo, free donation, pickup in 3 hours",
    },
  },
  {
    id: "seed-3",
    transcript: "Mere paas 15 plate veg pulao aur paneer hai jo main daan me dena chahta hu",
    language: "hi-IN",
    provider: "gemini",
    timestamp: new Date().toISOString(),
    confidence: 0.98,
    groundTruth: {
      name: "Veg Pulao",
      description: "Veg Pulao. Freshly prepared quality meal. Available as a free community donation.",
      quantity: 15,
      quantityUnit: "plates",
      isDonation: true,
      price: 0,
      originalPrice: null,
      discountPct: 0,
      isRaw: false,
      isHomeCooked: false,
      cuisineType: "north_indian",
      allergens: ["dairy"],
      tags: ["donation", "restaurant", "vegetarian", "north_indian"],
      expiresInHours: 4,
      expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      pickupAddressHint: null,
      confidence: { overall: 0.98, name: 0.98, quantity: 0.98, price: 0.98, expiry: 0.95 },
      detectedEntities: {
        dishName: "Veg Pulao",
        quantityFound: "15 plates",
        pricingFound: "Free Donation",
        cuisineFound: "north_indian",
      },
      rawTranscript: "Mere paas 15 plate veg pulao aur paneer hai jo main daan me dena chahta hu",
    },
  },
  {
    id: "seed-4",
    transcript: "10 boxes fresh vegetable biryani surplus at 80 rupees each, pick up tonight before 10 PM",
    language: "en-IN",
    provider: "gemini",
    timestamp: new Date().toISOString(),
    confidence: 0.98,
    groundTruth: {
      name: "Vegetable Biryani",
      description: "Vegetable Biryani. Freshly prepared quality meal. Available at surplus rate (₹80).",
      quantity: 10,
      quantityUnit: "packets",
      isDonation: false,
      price: 80,
      originalPrice: 128,
      discountPct: 38,
      isRaw: false,
      isHomeCooked: false,
      cuisineType: "north_indian",
      allergens: [],
      tags: ["surplus", "restaurant", "vegetarian"],
      expiresInHours: 5,
      expiresAt: new Date(Date.now() + 5 * 3600000).toISOString(),
      pickupAddressHint: null,
      confidence: { overall: 0.98, name: 0.98, quantity: 0.98, price: 0.98, expiry: 0.95 },
      detectedEntities: {
        dishName: "Vegetable Biryani",
        quantityFound: "10 packets",
        pricingFound: "₹80",
      },
      rawTranscript: "10 boxes fresh vegetable biryani surplus at 80 rupees each, pick up tonight before 10 PM",
    },
  },
];

/**
 * Load all offline training & test cases
 */
export function loadOfflineTestCases(): OfflineTestCase[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(TEST_CASES_FILE)) {
      fs.writeFileSync(TEST_CASES_FILE, JSON.stringify(SEED_TEST_CASES, null, 2), "utf-8");
      return SEED_TEST_CASES;
    }

    const raw = fs.readFileSync(TEST_CASES_FILE, "utf-8");
    const data: OfflineTestCase[] = JSON.parse(raw);
    return Array.isArray(data) ? data : SEED_TEST_CASES;
  } catch (error) {
    console.error("Error reading offline test cases:", error);
    return SEED_TEST_CASES;
  }
}

/**
 * Record a new real-world test case learned from Gemini API
 */
export function recordLearnedTestCase(
  transcript: string,
  language: string,
  groundTruth: ParsedFoodListing,
  provider: "gemini" | "manual" | "user_feedback" = "gemini"
): boolean {
  try {
    const cleanTranscript = transcript.trim();
    if (cleanTranscript.length < 5) return false;

    const cases = loadOfflineTestCases();

    // Check for duplicates
    const isDuplicate = cases.some(
      (c) => c.transcript.toLowerCase() === cleanTranscript.toLowerCase()
    );

    if (isDuplicate) return false;

    const newCase: OfflineTestCase = {
      id: `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      transcript: cleanTranscript,
      language,
      groundTruth,
      provider,
      timestamp: new Date().toISOString(),
      confidence: groundTruth.confidence?.overall || 0.95,
    };

    cases.push(newCase);

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(TEST_CASES_FILE, JSON.stringify(cases, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to record learned test case:", err);
    return false;
  }
}

/**
 * Benchmark the local offline NLP against recorded ground truth cases
 */
export function runOfflineNlpBenchmark(): BenchmarkReport {
  const cases = loadOfflineTestCases();
  if (cases.length === 0) {
    return {
      totalCases: 0,
      nameAccuracyPct: 100,
      quantityAccuracyPct: 100,
      donationAccuracyPct: 100,
      priceAccuracyPct: 100,
      overallScorePct: 100,
      details: [],
    };
  }

  let nameMatches = 0;
  let quantityMatches = 0;
  let donationMatches = 0;
  let priceMatches = 0;

  const details: BenchmarkReport["details"] = [];

  for (const c of cases) {
    const actual = parseFoodWithLocalNLP(c.transcript);
    const expected = c.groundTruth;

    const nameMatch =
      actual.name.toLowerCase().includes(expected.name.toLowerCase()) ||
      expected.name.toLowerCase().includes(actual.name.toLowerCase());
    const qtyMatch = actual.quantity === expected.quantity;
    const donationMatch = actual.isDonation === expected.isDonation;
    const priceMatch =
      expected.isDonation || actual.price === expected.price || (actual.price > 0 && expected.price > 0);

    if (nameMatch) nameMatches++;
    if (qtyMatch) quantityMatches++;
    if (donationMatch) donationMatches++;
    if (priceMatch) priceMatches++;

    const casePassed = nameMatch && qtyMatch && donationMatch;

    details.push({
      transcript: c.transcript,
      expected: {
        name: expected.name,
        quantity: expected.quantity,
        isDonation: expected.isDonation,
        price: expected.price,
      },
      actual: {
        name: actual.name,
        quantity: actual.quantity,
        isDonation: actual.isDonation,
        price: actual.price,
      },
      passed: casePassed,
    });
  }

  const nameAccuracyPct = Math.round((nameMatches / cases.length) * 100);
  const quantityAccuracyPct = Math.round((quantityMatches / cases.length) * 100);
  const donationAccuracyPct = Math.round((donationMatches / cases.length) * 100);
  const priceAccuracyPct = Math.round((priceMatches / cases.length) * 100);

  const overallScorePct = Math.round(
    (nameAccuracyPct + quantityAccuracyPct + donationAccuracyPct + priceAccuracyPct) / 4
  );

  return {
    totalCases: cases.length,
    nameAccuracyPct,
    quantityAccuracyPct,
    donationAccuracyPct,
    priceAccuracyPct,
    overallScorePct,
    details,
  };
}
