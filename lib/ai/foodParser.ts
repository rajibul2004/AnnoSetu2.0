import type { Allergen, QuantityUnit } from "@/types/food";

export interface ParsedFoodListing {
  name: string;
  description: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  isDonation: boolean;
  price: number;
  originalPrice: number | null;
  discountPct: number;
  isRaw: boolean;
  isHomeCooked: boolean;
  cuisineType: string | null;
  allergens: Allergen[];
  tags: string[];
  expiresInHours: number;
  expiresAt: string;
  pickupAddressHint: string | null;
  confidence: {
    overall: number;
    name: number;
    quantity: number;
    price: number;
    expiry: number;
  };
  detectedEntities: {
    dishName?: string;
    quantityFound?: string;
    pricingFound?: string;
    expiryFound?: string;
    cuisineFound?: string;
    allergensFound?: string[];
  };
  rawTranscript: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER WORD MAPS — English, Hindi, Bengali
// ─────────────────────────────────────────────────────────────────────────────
const NUMBER_WORDS: Record<string, number> = {
  // English
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, "twenty-five": 25, twentyfive: 25, thirty: 30, "thirty-five": 35,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  // Hindi
  ek: 1, do: 2, teen: 3, chaar: 4, paanch: 5, chhah: 6, saat: 7, aath: 8, nau: 9,
  das: 10, gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15,
  solah: 16, soloh: 16, satrah: 17, atharah: 18, unnis: 19, bees: 20,
  ikees: 21, baees: 22, tees: 30, challis: 40, chaalees: 40, pachaas: 50,
  sau: 100,
  // Bengali / Banglish
  dui: 2, tin: 3, char: 4, char4: 4, panch: 5, choy: 6, sat: 7, ath: 8, noy: 9,
  dosh: 10, egaro: 11, baro: 12, tero: 13, chowddo: 14, ponero: 15,
  sholo: 16, shotro: 17, atharo: 18, unish: 19, bis: 20, kuri: 20,
  ekkush: 21, pochish: 25, trish: 30, chollish: 40, ponchash: 50, sho: 100, eksho: 100,
};

function parseNumberToken(token: string): number | null {
  const t = token.toLowerCase().trim();
  // Pure digits
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  // Word lookup
  if (NUMBER_WORDS[t] !== undefined) return NUMBER_WORDS[t];
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUANTITY UNIT NORMALIZER
// ─────────────────────────────────────────────────────────────────────────────
function normalizeUnit(raw: string): QuantityUnit {
  const u = raw.toLowerCase();
  if (/plate|thali|meal|jon$|jon-er|joner|portion|serve|serving/.test(u)) return "plates";
  if (/pack|packet|box|dabba|dabbe|bata|parcel/.test(u)) return "packets";
  if (/kg|kilo|kilogram/.test(u)) return "kg";
  if (/unit|piece|pcs|pice/.test(u)) return "units";
  return "servings";
}

// ─────────────────────────────────────────────────────────────────────────────
// FILLER PHRASES — stripped BEFORE extraction (order matters: specific first)
// ─────────────────────────────────────────────────────────────────────────────
const FILLER_PATTERNS: RegExp[] = [
  // Bengali intent / conversational
  /amar\s*kache\s*ache|amader\s*kache\s*ache/gi,
  /jeta\s*ami\s*donation\s*hisabe\s*dite\s*chai/gi,
  /jeta\s*ami\s*daan\s*hisabe\s*dite\s*chai/gi,
  /jeta\s*amra\s*donation\s*hisabe\s*dite\s*chai/gi,
  /jeta\s*ami\s*dite\s*chai/gi,
  /jeta\s*amra\s*dite\s*chai/gi,
  /donation\s*hisabe\s*dite\s*chai/gi,
  /daan\s*hisabe\s*dite\s*chai/gi,
  /free\s*hisabe\s*dite\s*chai/gi,
  /donation\s*hisabe/gi,
  /daan\s*hisabe/gi,
  /amar\s*kache|amader\s*kache/gi,
  /kache\s*ache/gi,
  /jeta\s*ami|jeta\s*amra|jeita\s*ami/gi,
  /dite\s*chaichhi|dite\s*chai|dite\s*parbo/gi,
  /ache\s*go|rakha\s*ache|banano\s*ache|banano\s*hoyeche|baniyechi/gi,
  /amar|amader/gi,
  // Hindi intent / conversational
  /mere\s*paas\s*hai|hamare\s*paas\s*hai/gi,
  /mere\s*paas|hamare\s*paas|apne\s*paas/gi,
  /jo\s*main\s*daan\s*me\s*dena\s*chahta\s*hu/gi,
  /jo\s*main\s*donation\s*me\s*dena\s*chahta\s*hu/gi,
  /dena\s*chahta\s*hu|dena\s*chahti\s*hu|dena\s*chahte\s*hai/gi,
  /donation\s*ke\s*roop\s*me|daan\s*me\s*dena|daan\s*ke\s*liye/gi,
  /muft\s*me\s*dena|free\s*me\s*dena|seva\s*me\s*dena/gi,
  /de\s*rahe\s*hai|rakha\s*hai|bana\s*hai|bacha\s*hai/gi,
  /jo\s*main|jo\s*hum|hai\s*jo/gi,
  // English intent
  /i\s*want\s*to\s*(?:list|give|donate|share|add)/gi,
  /we\s*(?:have|want\s*to\s*donate|are\s*giving)/gi,
  /i\s*have\s*(?:leftover|surplus|extra|some)?/gi,
  /(?:listing|donating|sharing|posting|giving\s*away)\s*(?:this|these)?/gi,
  /(?:available\s*now|ready\s*for\s*pickup|please\s*(?:list|add))/gi,
  /(?:as\s*a?\s*donation|for\s*donation|for\s*free|free\s*pickup)/gi,
  /(?:freshly\s*cooked|prepared\s*today|cooked\s*just\s*now)/gi,
  // Pricing fillers (only filler, not the number itself)
  /(?:taka\s*kore|takar|takay|plate\s*pichu|box\s*pichu|khoroch)/gi,
  /(?:rupaye\s*me|per\s*plate|ke\s*hisaab\s*se|daam|keemat)/gi,
];

function stripFillers(text: string): string {
  let clean = text;
  for (const pattern of FILLER_PATTERNS) {
    clean = clean.replace(pattern, " ");
  }
  // Collapse multiple spaces
  return clean.replace(/\s{2,}/g, " ").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN DISHES TAXONOMY — sorted longest-first for specificity
// ─────────────────────────────────────────────────────────────────────────────
const RAW_KNOWN_DISHES = [
  // Biryani / Biriyani variants (cover both spellings)
  "hyderabadi chicken biryani", "hyderabadi mutton biryani", "hyderabadi biryani",
  "kolkata chicken biryani", "kolkata mutton biryani", "kolkata biryani",
  "chicken dum biryani", "mutton dum biryani", "veg dum biryani", "dum biryani",
  "chicken biriyani", "mutton biriyani", "veg biriyani", "egg biriyani",
  "chicken biryani", "mutton biryani", "veg biryani", "egg biryani",
  "biriyani", "biryani",

  // Rice & Pulao
  "basanti polao", "basanti pulao", "kashmiri pulao", "veg pulao", "peas pulao", "jeera rice",
  "ghee rice", "schezwan fried rice", "veg fried rice", "egg fried rice", "chicken fried rice",
  "fried rice", "bhuna khichuri", "khichuri", "khichdi", "dal khichdi",
  "curd rice", "steamed rice", "bhat", "chawal", "pulao", "polao",

  // Paneer & Veg Curries
  "paneer butter masala", "paneer tikka masala", "paneer makhani", "paneer pasanda", "paneer bhurji",
  "shahi paneer", "kadai paneer", "palak paneer", "matar paneer", "paneer do pyaza", "paneer lababdar",
  "paneer tikka", "paneer",
  "dal makhani", "dal tadka", "dal fry", "cholar dal", "chana dal", "moong dal", "tadka dal",
  "chole bhature", "chole", "chana masala", "rajma chawal", "rajma",
  "aloo gobi", "aloo matar", "aloo dum", "dum aloo", "shukto", "dhokar dalna",
  "mix veg", "mixed vegetable", "navratan korma", "malai kofta", "veg kofta",

  // South Indian
  "masala dosa", "mysore masala dosa", "onion rava dosa", "rava dosa", "ghee roast dosa",
  "set dosa", "plain dosa", "dosa",
  "idli sambar", "idli vada", "idli", "medu vada", "sambar vada", "vada",
  "onion uttapam", "uttapam", "ven pongal", "pongal", "rava upma", "upma", "sambar", "rasam",

  // Bengali & Regional Fish/Meat
  "shorshe ilish", "ilish macher jhol", "macher jhol", "katla kalia", "rui macher jhol",
  "chingri malai curry", "fish curry", "fish fry", "fish finger", "macher chop",
  "kosha mangsho", "mutton kosha", "mutton curry", "mutton korma", "rogan josh",
  "chicken kosha", "chicken curry", "chicken chaap", "butter chicken", "chicken tikka",
  "tandoori chicken", "kadhai chicken", "chicken korma", "chicken bharta",
  "dimer dalna", "egg curry", "egg roast", "anda curry", "anda bhurji", "omelette", "dimer chop",

  // Breads
  "butter naan", "garlic naan", "cheese naan", "tandoori roti", "butter roti", "rumali roti",
  "aloo paratha", "gobi paratha", "paneer paratha", "methi thepla", "thepla",
  "lachha paratha", "paratha", "parathas",
  "roti", "rotis", "chapati", "chapatis", "phulka", "luchi", "puri", "poori",
  "bhature", "kulcha", "naan",

  // Rolls, Fast food, Chinese
  "chicken kathi roll", "egg chicken roll", "double egg roll", "paneer roll",
  "veg roll", "chicken roll", "egg roll",
  "veg burger", "chicken burger", "burger",
  "club sandwich", "grilled sandwich", "veg sandwich", "sandwich",
  "veg hakka noodles", "chicken hakka noodles", "schezwan noodles", "hakka noodles",
  "chowmein", "noodles",
  "steamed momos", "fried momos", "chicken momos", "veg momos", "momos", "dimsum",
  "spring rolls", "manchurian", "gobi manchurian", "chilli chicken", "chilli paneer",
  "margherita pizza", "farmhouse pizza", "cheese pizza", "pizza",
  "white sauce pasta", "red sauce pasta", "pasta", "macaroni",

  // Street food & Snacks
  "pav bhaji", "vada pav", "misal pav", "pani puri", "sev puri", "dahi puri",
  "bhel puri", "samosa", "samosas", "kachori", "dhokla", "khandvi",

  // Bakery & Sweets
  "chocolate cake", "fruit cake", "cupcakes", "muffins", "croissants", "pastry",
  "cookies", "biscuits", "bakery bread", "bread",
  "rosogolla", "rasgulla", "gulab jamun", "sandesh", "mishti doi",
  "kheer", "payesh", "gajar halwa", "halwa", "jalebi", "kaju katli", "ladoo", "laddu",
];

const KNOWN_DISHES = [...RAW_KNOWN_DISHES].sort((a, b) => b.length - a.length);

// ─────────────────────────────────────────────────────────────────────────────
// CUISINE KEYWORDS
// ─────────────────────────────────────────────────────────────────────────────
const CUISINE_KEYWORDS: Record<string, string[]> = {
  north_indian: ["dal makhani", "paneer", "rajma", "chole", "naan", "roti", "paratha", "shahi paneer", "butter chicken", "kadai paneer", "north indian"],
  south_indian: ["dosa", "idli", "sambar", "vada", "uttapam", "rasam", "curd rice", "pongal", "south indian", "upma"],
  bengali: ["macher jhol", "kosha mangsho", "shorshe ilish", "luchi", "cholar dal", "khichuri", "rosogolla", "sandesh", "bengali", "bhat", "biriyani", "polao", "mishti doi", "chingri"],
  punjabi: ["sarson ka saag", "makki di roti", "punjabi", "amritsari", "kulcha", "lassi", "dal tadka"],
  gujarati: ["dhokla", "thepla", "khandvi", "undhiyu", "gujarati", "farsan", "khakhra"],
  chinese: ["noodles", "fried rice", "manchurian", "chowmein", "spring roll", "dimsum", "momos", "chinese"],
  italian: ["pizza", "pasta", "lasagna", "garlic bread", "spaghetti", "macaroni", "risotto", "italian"],
  fast_food: ["burger", "sandwich", "fries", "wrap", "roll", "fast food"],
  street_food: ["pani puri", "sev puri", "chaat", "samosa", "kachori", "vada pav", "pav bhaji", "bhel"],
  bakery: ["cake", "muffin", "croissant", "pastry", "bread", "bun", "cookie", "biscuit", "loaf"],
};

// ─────────────────────────────────────────────────────────────────────────────
// ALLERGEN TRIGGERS
// ─────────────────────────────────────────────────────────────────────────────
const ALLERGEN_TRIGGERS: Record<Allergen, string[]> = {
  dairy: ["milk", "paneer", "butter", "cheese", "cream", "ghee", "curd", "dahi", "doi", "yogurt", "lassi", "makhani", "malai", "dairy"],
  nuts: ["nuts", "peanut", "peanuts", "cashew", "kaju", "badam", "almond", "walnut", "pista", "pistachio"],
  gluten: ["wheat", "atta", "maida", "bread", "roti", "naan", "paratha", "luchi", "pizza", "pasta", "noodle", "noodles", "gluten", "flour"],
  eggs: ["egg", "eggs", "anda", "dim", "dimer", "omelette", "custard", "mayo", "mayonnaise"],
  seafood: ["fish", "prawn", "prawns", "shrimp", "crab", "macher", "mach", "chingri", "salmon", "seafood"],
  soy: ["soya", "soy", "tofu", "edamame"],
  sesame: ["sesame", "til", "tahini"],
  shellfish: ["shellfish", "crab", "lobster", "shrimp", "chingri"],
  mustard: ["mustard", "sarson", "shorshe", "rai"],
  sulphites: ["wine", "vinegar", "sulphite"],
  other: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// DONATION SIGNAL PATTERNS — multilingual
// ─────────────────────────────────────────────────────────────────────────────
const DONATION_SIGNALS = [
  // Bengali
  /donation\s*hisabe/i, /daan\s*hisabe/i, /free\s*hisabe/i,
  /binamulle/i, /free\s*te\b/i, /sahajjo/i,
  // Hindi
  /daan\s*me\s*dena/i, /donation\s*ke\s*roop/i, /muft\s*me/i, /free\s*me/i, /seva\s*me/i,
  // English
  /\bfree\b/i, /\bdonate\b/i, /\bdonation\b/i, /\bno\s*charge\b/i,
  /\bzero\s*cost\b/i, /\bfor\s*cause\b/i, /\bfor\s*free\b/i, /\bcharity\b/i,
  // Universal "daan"
  /\bdaan\b/i,
];

function detectDonation(text: string): boolean {
  return DONATION_SIGNALS.some((p) => p.test(text));
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────
function extractPrice(lower: string): number | null {
  // Patterns: ₹80, Rs 80, 80 rs, 80 rupees, 80 taka, 80 takay
  const patterns = [
    /₹\s*(\d+(?:\.\d{1,2})?)/,
    /(?:rs\.?|inr|rupees?|rupaye)\s*(\d+)/i,
    /(\d+)\s*(?:rs\.?|inr|rupees?|rupaye|taka|takay|takar|\/\-)/i,
    /(?:price|cost|dam|daam|at)\s*(\d+)/i,
  ];
  for (const p of patterns) {
    const m = lower.match(p);
    if (m) {
      const v = parseFloat(m[1]);
      if (!isNaN(v) && v > 0) return v;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUANTITY EXTRACTOR — handles "[number] [unit]" and "[unit] [number]"
// ─────────────────────────────────────────────────────────────────────────────
const UNIT_WORDS = [
  // English
  "servings?", "plates?", "meal\\s*boxes?", "boxes?", "packets?", "packs?",
  "kg", "kilograms?", "kilos?", "units?", "pieces?", "portions?", "meals?",
  // Hindi
  "thali", "thalis?", "dabba", "dabbe",
  // Bengali
  "bata", "jon", "jon-er", "joner",
];

const UNIT_PATTERN = new RegExp(UNIT_WORDS.join("|"), "i");

function extractQuantity(lower: string, priceValue: number | null): { quantity: number; unit: QuantityUnit; found: string } | null {
  // Try: "10 plate", "10 plates", "dui bata", "ek jon" etc.
  const numFirst = new RegExp(
    `(\\d+|${Object.keys(NUMBER_WORDS).join("|")})\\s*(?:ta|ti|টা)?\\s*(${UNIT_WORDS.join("|")})`,
    "i"
  );
  const m1 = lower.match(numFirst);
  if (m1) {
    const qty = parseNumberToken(m1[1]);
    if (qty !== null && qty > 0 && qty <= 5000) {
      return { quantity: qty, unit: normalizeUnit(m1[2]), found: `${qty} ${m1[2]}` };
    }
  }

  // Try: "plates 10" (unit before number)
  const unitFirst = new RegExp(
    `(${UNIT_WORDS.join("|")})\\s*(\\d+|${Object.keys(NUMBER_WORDS).join("|")})`,
    "i"
  );
  const m2 = lower.match(unitFirst);
  if (m2) {
    const qty = parseNumberToken(m2[2]);
    if (qty !== null && qty > 0 && qty <= 5000) {
      return { quantity: qty, unit: normalizeUnit(m2[1]), found: `${qty} ${m2[1]}` };
    }
  }

  // Fallback: lone number not equal to price
  const loneNum = lower.match(/\b(\d+)\b/g);
  if (loneNum) {
    for (const raw of loneNum) {
      const n = parseInt(raw, 10);
      if (n > 0 && n <= 5000 && n !== priceValue) {
        return { quantity: n, unit: "servings", found: `${n} servings (inferred)` };
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRY EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────
function extractExpiry(lower: string): { hours: number; found: string } {
  const numWords = Object.keys(NUMBER_WORDS).join("|");

  // "in 3 hours", "within 3 hours", "3 ghante", "3 ghonta"
  const hoursMatch = lower.match(
    new RegExp(`(?:in|within|before|moddhe|ke\\s*andar)?\\s*(\\d+|${numWords})\\s*(?:hours?|hrs?|ghante?|ghonta)`, "i")
  );
  if (hoursMatch) {
    const h = parseNumberToken(hoursMatch[1]) ?? 4;
    const clamped = Math.min(24, Math.max(1, h));
    return { hours: clamped, found: `in ${clamped} hours` };
  }

  // "tonight", "aaj raat"
  if (/\b(tonight|aaj\s*raat|by\s*night|raat\s*\d+)\b/i.test(lower)) {
    const target = new Date();
    target.setHours(22, 0, 0, 0);
    const diff = Math.max(1, Math.round((target.getTime() - Date.now()) / 3_600_000));
    return { hours: Math.min(12, diff), found: `tonight (~${diff}h)` };
  }

  // "urgent", "immediately", "ekhoni"
  if (/\b(urgent|immediately|ekhoni|jaldi|abhi)\b/i.test(lower)) {
    return { hours: 2, found: "urgent (2h)" };
  }

  // "before 10 PM", "before 8 PM"
  const beforeTime = lower.match(/before\s*(\d+)\s*(pm|am)/i);
  if (beforeTime) {
    let h = parseInt(beforeTime[1], 10);
    if (beforeTime[2].toLowerCase() === "pm" && h < 12) h += 12;
    const target = new Date();
    target.setHours(h, 0, 0, 0);
    const diff = Math.max(1, Math.round((target.getTime() - Date.now()) / 3_600_000));
    return { hours: Math.min(24, diff), found: `before ${beforeTime[1]} ${beforeTime[2]}` };
  }

  return { hours: 4, found: "4 hours (default)" };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISH NAME EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────
function extractDishName(lower: string, stripped: string, cuisine: string | null): { name: string; confidence: number } {
  // 1. Try taxonomy match on ORIGINAL lower (before stripping, so we don't miss dish names caught in filler)
  for (const dish of KNOWN_DISHES) {
    // Use word-boundary-aware match
    const escaped = dish.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`(?:^|\\s|,)${escaped}(?:\\s|,|$|।)`, "i");
    if (rx.test(lower)) {
      let title = dish.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      // Append side dishes if mentioned
      if (lower.includes("roti") && !dish.includes("roti")) title += " with Rotis";
      else if (lower.includes("paratha") && !dish.includes("paratha")) title += " with Parathas";
      else if (lower.includes("rice") && !dish.includes("rice") && !dish.includes("biryani") && !dish.includes("biriyani")) title += " with Rice";
      return { name: title, confidence: 0.97 };
    }
  }

  // 2. Scrub and try to recover a clean name from the stripped text
  let clean = stripped
    // Remove quantity/unit patterns
    .replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|dui|tin|char|panch|choy|saat|ath|noy|dosh)\s*(?:ta|ti)?\s*(?:servings?|plates?|boxes?|packets?|kg|units?|portions?|dabba|bata|jon)/gi, "")
    // Remove pricing
    .replace(/(?:at\s*rs\.?\s*\d+|for\s*\d+\s*rupees?|cost\s*\d+|\d+\s*taka|₹\s*\d+|\d+\s*rs\.?)/gi, "")
    // Remove time references
    .replace(/(?:in\s*\d+\s*hours?|tonight|pickup\s*(?:before|in|at)\s*[^,]+)/gi, "")
    // Remove donation/price words
    .replace(/\b(donation|daan|free|muft|charge|binamulle|sahajjo)\b/gi, "")
    // Remove trailing punctuation and conjunctions
    .replace(/^[,.\s]+|[,.\s]+$/g, "")
    .replace(/\b(and|with|of|some|the|a|an)\b\s*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (clean.length >= 3) {
    const titleCased = clean.split(" ").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    return { name: titleCased, confidence: 0.72 };
  }

  // 3. Cuisine-based fallback
  const fallbacks: Record<string, string> = {
    bengali: "Homestyle Bengali Meal",
    north_indian: "Homestyle North Indian Meal",
    south_indian: "Fresh South Indian Combo",
    punjabi: "Punjabi Home Meal",
    gujarati: "Gujarati Thali",
    chinese: "Chinese Rice & Noodles",
    bakery: "Fresh Bakery Items",
    street_food: "Street Food Snacks",
  };
  if (cuisine && fallbacks[cuisine]) {
    return { name: fallbacks[cuisine], confidence: 0.55 };
  }

  return { name: "Fresh Prepared Food", confidence: 0.4 };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDRESS EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────
function extractAddress(text: string): string | null {
  const m = text.match(
    /(?:pickup\s*(?:at|from|near|in)|near|at|location:?)\s*([A-Za-z0-9\s,\-]{4,60})(?:[.,]|$|before|in|moddhe)/i
  );
  if (m && m[1].trim().length > 3) return m[1].trim();
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LOCAL NLP PARSER
// ─────────────────────────────────────────────────────────────────────────────
export function parseFoodWithLocalNLP(transcript: string): ParsedFoodListing {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  // ── Step 1: Detect Donation/Price BEFORE stripping (signals may live inside fillers)
  const isDonation = detectDonation(lower);
  const priceVal = isDonation ? null : extractPrice(lower);
  const price = priceVal ?? 0;
  const pricingFound = isDonation ? "Free Donation" : (price > 0 ? `₹${price}` : "Unknown");

  let originalPrice: number | null = null;
  if (!isDonation && price > 0) {
    const origM = lower.match(/(?:original|actual|menu|worth|was|dam\s*chhilo)\s*(?:rs\.?|inr|₹|rupees?|taka)?\s*(\d+)/i);
    if (origM) {
      const ov = parseInt(origM[1], 10);
      if (!isNaN(ov) && ov > price) originalPrice = ov;
    }
    if (!originalPrice) originalPrice = Math.round(price * 1.6);
  }
  const discountPct = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // ── Step 2: Strip fillers to get a clean context for quantity & name extraction
  const stripped = stripFillers(text);
  const strippedLower = stripped.toLowerCase();

  // ── Step 3: Quantity extraction (from stripped text)
  const qtyResult = extractQuantity(strippedLower, price);
  const quantity = qtyResult?.quantity ?? 5;
  const quantityUnit = qtyResult?.unit ?? "servings";
  const quantityFound = qtyResult?.found ?? `${quantity} ${quantityUnit} (default)`;
  const quantityConfidence = qtyResult
    ? qtyResult.found.includes("inferred") ? 0.75 : 0.97
    : 0.5;

  // ── Step 4: Expiry
  const { hours: expiresInHours, found: expiryFound } = extractExpiry(strippedLower);
  const expiresAt = new Date(Date.now() + expiresInHours * 3_600_000).toISOString();
  const expiryConfidence = expiryFound.includes("default") ? 0.6 : 0.93;

  // ── Step 5: Cuisine
  let detectedCuisine: string | null = null;
  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      detectedCuisine = cuisine;
      break;
    }
  }

  // ── Step 6: Allergens
  const detectedAllergens: Allergen[] = [];
  for (const [allergen, triggers] of Object.entries(ALLERGEN_TRIGGERS)) {
    if (triggers.some((t) => lower.includes(t))) {
      detectedAllergens.push(allergen as Allergen);
    }
  }

  // ── Step 7: Raw vs Home Cooked
  const isRaw = /\b(raw|uncooked|fresh\s*vegetables|fruits|groceries|unpeeled|flour|rice\s*grains|shobji|kacha)\b/i.test(lower);
  const isHomeCooked = !isRaw && /\b(home|homemade|ghar|mom|mummy|prepared\s*at\s*home|freshly\s*cooked|ghorer|baniyechi|bana\s*hai)\b/i.test(lower);

  // ── Step 8: Dish Name (from original lower so dish names aren't stripped)
  const { name: finalName, confidence: nameConfidence } = extractDishName(lower, stripped, detectedCuisine);

  // ── Step 9: Address
  const pickupAddressHint = extractAddress(text);

  // ── Step 10: Build description
  const description = [
    finalName,
    isHomeCooked ? "Wholesome homemade cooking." : "Freshly prepared quality meal.",
    isDonation
      ? "Available as a free community donation."
      : `Available at surplus rate (₹${price}).`,
    `Please pick up within ${expiresInHours} hour${expiresInHours > 1 ? "s" : ""}.`,
  ].join(" ").slice(0, 450);

  // ── Step 11: Tags
  const tags: string[] = [];
  if (isDonation) tags.push("donation");
  if (isHomeCooked) tags.push("homestyle");
  const hasAnimal = detectedAllergens.some((a) => ["dairy", "eggs", "seafood", "shellfish"].includes(a));
  if (!hasAnimal && !lower.includes("chicken") && !lower.includes("mutton") && !lower.includes("fish") && !lower.includes("egg")) {
    tags.push("vegetarian");
  }
  if (expiresInHours <= 2) tags.push("urgent");
  if (detectedCuisine) tags.push(detectedCuisine);

  // ── Step 12: Overall confidence
  const overallConfidence = parseFloat(
    ((nameConfidence + quantityConfidence + expiryConfidence + (isDonation || price > 0 ? 0.95 : 0.6)) / 4).toFixed(2)
  );

  return {
    name: finalName,
    description,
    quantity,
    quantityUnit,
    isDonation,
    price: isDonation ? 0 : price,
    originalPrice,
    discountPct,
    isRaw,
    isHomeCooked,
    cuisineType: detectedCuisine,
    allergens: detectedAllergens,
    tags,
    expiresInHours,
    expiresAt,
    pickupAddressHint,
    confidence: {
      overall: overallConfidence,
      name: nameConfidence,
      quantity: quantityConfidence,
      price: isDonation || price > 0 ? 0.95 : 0.6,
      expiry: expiryConfidence,
    },
    detectedEntities: {
      dishName: finalName,
      quantityFound,
      pricingFound,
      expiryFound,
      cuisineFound: detectedCuisine ?? "general",
      allergensFound: detectedAllergens,
    },
    rawTranscript: text,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-END AI EXTRACTION via Gemini API (falls back to local NLP)
// ─────────────────────────────────────────────────────────────────────────────
export async function parseFoodListingWithAI(
  transcript: string,
  language = "en-IN"
): Promise<ParsedFoodListing> {
  const geminiApiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!geminiApiKey?.trim()) {
    return parseFoodWithLocalNLP(transcript);
  }

  const systemPrompt = `You are AnnoSetu's expert AI Voice-to-Listing Food Extractor.
Your job: extract a structured food surplus listing from a spoken transcript in ANY language or dialect.

Supported languages: English, Bengali, Banglish, Hindi, Hinglish, Tamil, Telugu, and mixed scripts.

CRITICAL RULES:
1. "name" must be ONLY the pure clean dish name (e.g., "Biriyani", "Paneer Butter Masala", "Veg Fried Rice").
   NEVER include conversational filler phrases in the name, such as:
   - Bengali: "Amar kache", "jeta ami donation hisabe dite chai", "ache"
   - Hindi: "Mere paas", "jo main daan me dena chahta hu", "hai"
   - English: "I have", "I want to give", "for donation"

2. Donation detection — set isDonation=true and price=0 when ANY of these appear:
   Bengali: "donation hisabe", "daan hisabe", "free hisabe", "binamulle", "sahajjo"
   Hindi: "daan me", "muft me", "free me", "seva me"
   English: "free", "donation", "donate", "no charge", "charity"

3. quantity: must be a positive integer. Detect from spoken numbers in any language:
   e.g., "10 plate" → quantity:10, quantityUnit:"plates"
   "dui bata" → quantity:2, quantityUnit:"packets"
   "panch kg" → quantity:5, quantityUnit:"kg"

4. expiresInHours: detect from "in 3 hours", "3 ghante", "tonight", "before 10 PM" etc.

Return ONLY a valid JSON object matching this exact schema:
{
  "name": string,
  "description": string,
  "quantity": number,
  "quantityUnit": "servings"|"plates"|"kg"|"units"|"packets",
  "isDonation": boolean,
  "price": number,
  "originalPrice": number|null,
  "isRaw": boolean,
  "isHomeCooked": boolean,
  "cuisineType": "north_indian"|"south_indian"|"bengali"|"punjabi"|"gujarati"|"chinese"|"italian"|"fast_food"|"street_food"|"bakery"|"other"|null,
  "allergens": array of ("nuts"|"dairy"|"gluten"|"seafood"|"eggs"|"soy"|"sesame"|"mustard"),
  "expiresInHours": number,
  "pickupAddressHint": string|null
}`;

  try {
    const candidateModels = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"];
    let data: any = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: systemPrompt },
                    {
                      text: `Spoken transcript (language hint: ${language}):\n"${transcript}"\n\nExtract and return only the JSON object.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.05,
                responseMimeType: "application/json",
                maxOutputTokens: 1024,
              },
            }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch {
        // Try next model
      }
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return parseFoodWithLocalNLP(transcript);

    let parsed: any;
    try {
      const clean = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      try {
        parsed = JSON.parse(clean);
      } catch {
        const sanitized = clean.replace(/[\n\r\t]+/g, " ");
        const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : sanitized);
      }
    } catch (parseErr) {
      console.warn("JSON parse fallback to local NLP:", parseErr);
      return parseFoodWithLocalNLP(transcript);
    }

    const expiresInHours = Math.min(24, Math.max(1, Number(parsed.expiresInHours) || 4));
    const expiresAt = new Date(Date.now() + expiresInHours * 3_600_000).toISOString();
    const price = Number(parsed.price) || 0;
    const isDonation = Boolean(parsed.isDonation ?? price === 0);
    const originalPrice = Number(parsed.originalPrice) || (price > 0 ? Math.round(price * 1.5) : null);
    const discountPct =
      originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    const validUnits = ["servings", "plates", "kg", "units", "packets"];
    const quantityUnit: QuantityUnit = validUnits.includes(parsed.quantityUnit)
      ? (parsed.quantityUnit as QuantityUnit)
      : "servings";

    const finalResult: ParsedFoodListing = {
      name: parsed.name || "Delicious Fresh Food",
      description:
        parsed.description ||
        `${parsed.name}. Freshly prepared meal ready for community pickup.`,
      quantity: Math.max(1, Number(parsed.quantity) || 1),
      quantityUnit,
      isDonation,
      price: isDonation ? 0 : price,
      originalPrice,
      discountPct,
      isRaw: Boolean(parsed.isRaw),
      isHomeCooked: Boolean(parsed.isHomeCooked),
      cuisineType: parsed.cuisineType || null,
      allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
      tags: [
        isDonation ? "donation" : "surplus",
        parsed.isHomeCooked ? "homestyle" : "restaurant",
      ],
      expiresInHours,
      expiresAt,
      pickupAddressHint: parsed.pickupAddressHint || null,
      confidence: {
        overall: 0.98,
        name: 0.98,
        quantity: 0.97,
        price: 0.98,
        expiry: 0.96,
      },
      detectedEntities: {
        dishName: parsed.name,
        quantityFound: `${parsed.quantity} ${parsed.quantityUnit}`,
        pricingFound: isDonation ? "Free Donation" : `₹${price}`,
        expiryFound: `in ${expiresInHours} hours`,
        cuisineFound: parsed.cuisineType,
        allergensFound: parsed.allergens,
      },
      rawTranscript: transcript,
    };

    // Auto-record to offline learning dataset
    try {
      const { recordLearnedTestCase } = await import("./learningEngine");
      if (transcript.length >= 5 && finalResult.name && finalResult.name !== "Delicious Fresh Food") {
        recordLearnedTestCase(transcript, language, finalResult, "gemini");
      }
    } catch {
      // Ignored
    }

    return finalResult;
  } catch (err) {
    console.error("Gemini parse error, falling back to local NLP:", err);
    return parseFoodWithLocalNLP(transcript);
  }
}
