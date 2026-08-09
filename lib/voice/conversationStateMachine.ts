import { SupportedLanguage } from "./speechRecognition";
import { ParsedFoodListing } from "../ai/foodParser";

export type ConversationStep =
  | "DISH_NAME"
  | "QUANTITY"
  | "PRICING"
  | "EXPIRY"
  | "COMPLETED";

export interface StepPrompt {
  spokenText: string;
  displayTitle: string;
  placeholder: string;
  quickChips: string[];
}

export const STEP_METADATA: Record<
  ConversationStep,
  {
    stepNumber: number;
    title: string;
    description: string;
    icon: string;
  }
> = {
  DISH_NAME: {
    stepNumber: 1,
    title: "Dish Name",
    description: "What food or dish is being shared?",
    icon: "🍲",
  },
  QUANTITY: {
    stepNumber: 2,
    title: "Portions / Quantity",
    description: "How many plates or servings?",
    icon: "📦",
  },
  PRICING: {
    stepNumber: 3,
    title: "Donation or Price",
    description: "Is it free donation or discounted price?",
    icon: "🏷️",
  },
  EXPIRY: {
    stepNumber: 4,
    title: "Pickup Timeframe",
    description: "Within how many hours should it be picked up?",
    icon: "⏳",
  },
  COMPLETED: {
    stepNumber: 5,
    title: "Review & Confirm",
    description: "All details collected! Ready to auto-fill form.",
    icon: "✨",
  },
};

export const STEP_PROMPTS: Partial<
  Record<SupportedLanguage, Record<ConversationStep, StepPrompt>>
> & { "en-IN": Record<ConversationStep, StepPrompt> } = {
  "bn-IN": {
    DISH_NAME: {
      spokenText: "Hello sir! Apni kon khabar share ba donation korte chan?",
      displayTitle: "আপনি কোন খাবার দান বা শেয়ার করতে চান?",
      placeholder: "যেমন: বিরিয়ানি, খিচুড়ি, রুটি তরকারি...",
      quickChips: ["চিকেন বিরিয়ানি", "ভেজ খিচুড়ি", "রুটি ও ডাল", "ফ্রায়েড রাইস"],
    },
    QUANTITY: {
      spokenText: "Shundor! Apnar kache koy plate ba portion khabar ache?",
      displayTitle: "আপনার কাছে কত প্লেট বা প্যাকেট খাবার আছে?",
      placeholder: "যেমন: ১০ প্লেট, ৫ প্যাকেট, ৩ কেজি...",
      quickChips: ["৫ প্লেট", "১০ প্লেট", "১৫ প্যাকেট", "২ কেজি"],
    },
    PRICING: {
      spokenText: "Eta ki free donation, naki kono dam rakhte chan?",
      displayTitle: "এটা কি ফ্রি দান নাকি প্রতি প্লেটের কোনো দাম আছে?",
      placeholder: "যেমন: ফ্রি ডোনেশন, অথবা ৫০ টাকা...",
      quickChips: ["ফ্রি ডোনেশন (Free)", "₹৩০ প্রতি প্লেট", "₹৫০ প্রতি প্লেট"],
    },
    EXPIRY: {
      spokenText: "Khabar-ti koy ghontar moddhe pickup korte hobe?",
      displayTitle: "খাবারটি কয় ঘণ্টার মধ্যে পিকআপ করতে হবে?",
      placeholder: "যেমন: ৩ ঘণ্টার মধ্যে, আজ রাতে...",
      quickChips: ["২ ঘণ্টার মধ্যে", "৩ ঘণ্টার মধ্যে", "৪ ঘণ্টার মধ্যে", "আজ রাত ১০টার আগে"],
    },
    COMPLETED: {
      spokenText: "Darun! Sob tothyo peye gechi. Ekhon auto-fill korun.",
      displayTitle: "সব তথ্য তৈরি! ফর্ম পূরণ করতে নিচের বাটনে চাপ দিন।",
      placeholder: "ফর্ম প্রস্তুত...",
      quickChips: ["ফর্ম পূরণ করুন ✨", "পুনরায় শুরু করুন 🔄"],
    },
  },
  "hi-IN": {
    DISH_NAME: {
      spokenText: "Namaste sir! Aap kaun sa khana share ya donate karna chahte hain?",
      displayTitle: "आप कौन सा खाना शेयर या दान करना चाहते हैं?",
      placeholder: "जैसे: पनीर बटर मसाला, दाल चावल, बिरयानी...",
      quickChips: ["पनीर बटर मसाला", "दाल चावल", "वेज बिरयानी", "रोटी सब्जी"],
    },
    QUANTITY: {
      spokenText: "Badhiya! Kitne plates ya portions uplabdh hain?",
      displayTitle: "कितने प्लेट या पैकेट खाना उपलब्ध है?",
      placeholder: "जैसे: 10 प्लेट, 5 पैकेट, 2 किलो...",
      quickChips: ["5 प्लेट", "10 प्लेट", "20 पैकेट", "2 किलो"],
    },
    PRICING: {
      spokenText: "Kya yeh muft daan hai, ya per plate koi keemat hai?",
      displayTitle: "क्या यह मुफ्त दान है या कोई कीमत है?",
      placeholder: "जैसे: फ्री दान, या ₹40 प्रति प्लेट...",
      quickChips: ["मुफ्त दान (Free)", "₹30 प्रति प्लेट", "₹50 प्रति प्लेट"],
    },
    EXPIRY: {
      spokenText: "Khana kitne ghante ke andar pickup karna hoga?",
      displayTitle: "खाना कितने घंटे के अंदर पिकअप होना चाहिए?",
      placeholder: "जैसे: 3 घंटे में, आज रात तक...",
      quickChips: ["2 घंटे में", "3 घंटे में", "4 घंटे में", "आज रात तक"],
    },
    COMPLETED: {
      spokenText: "Bahut badhiya! Saari jankari mil gayi hai. Ab form fill kijiye.",
      displayTitle: "सारी जानकारी तैयार है! फॉर्म भरने के लिए बटन दबाएं।",
      placeholder: "फॉर्म तैयार है...",
      quickChips: ["फॉर्म भरें ✨", "फिर से शुरू करें 🔄"],
    },
  },
  "en-IN": {
    DISH_NAME: {
      spokenText: "Hello sir! Which food item do you want to donate or share?",
      displayTitle: "Which food or dish do you want to list?",
      placeholder: "e.g., Chicken Biryani, Veg Pulao, Paneer Masala...",
      quickChips: ["Chicken Biryani", "Veg Pulao", "Paneer Masala", "Sandwiches"],
    },
    QUANTITY: {
      spokenText: "Great! How many plates or portions do you have?",
      displayTitle: "How many plates or servings are available?",
      placeholder: "e.g., 10 plates, 5 boxes, 2 kg...",
      quickChips: ["5 plates", "10 plates", "15 boxes", "2 kg"],
    },
    PRICING: {
      spokenText: "Is this a free donation or what is the price per portion?",
      displayTitle: "Is this a free donation or discounted listing?",
      placeholder: "e.g., Free donation, or ₹40 per plate...",
      quickChips: ["Free Donation", "₹30 per portion", "₹50 per portion"],
    },
    EXPIRY: {
      spokenText: "Within how many hours should it be picked up?",
      displayTitle: "Within how many hours must it be picked up?",
      placeholder: "e.g., Within 3 hours, before 10 PM...",
      quickChips: ["Within 2 hours", "Within 3 hours", "Within 4 hours", "Tonight"],
    },
    COMPLETED: {
      spokenText: "Awesome! All details collected. Click auto-fill to populate the form.",
      displayTitle: "All set! Click below to auto-fill the listing form.",
      placeholder: "Form ready...",
      quickChips: ["Auto-Fill Form ✨", "Start Over 🔄"],
    },
  },
  "ta-IN": {
    DISH_NAME: {
      spokenText: "Vanakkam! Eentha unavai thaanam seiya virumbukireerkal?",
      displayTitle: "நீங்கள் எந்த உணவை பகிர விரும்புகிறீர்கள்?",
      placeholder: "எ.கா: பிரியாணி, சாம்பார் சாதம்...",
      quickChips: ["சிக்கன் பிரியாணி", "சாம்பார் சாதம்", "தயிர் சாதம்"],
    },
    QUANTITY: {
      spokenText: "Nandraga ullathu! Eththanai portion ullathu?",
      displayTitle: "எத்தனை தட்டுகள் அல்லது பொட்டலங்கள் உள்ளன?",
      placeholder: "எ.கா: 10 தட்டுகள், 5 பாக்கெட்டுகள்...",
      quickChips: ["5 தட்டுகள்", "10 தட்டுகள்", "20 பாக்கெட்டுகள்"],
    },
    PRICING: {
      spokenText: "Idhu ilavasamaaga thaanaamaa alladhu vilai ullathaa?",
      displayTitle: "இது இலவச தானமா அல்லது விலை உள்ளதா?",
      placeholder: "எ.கா: இலவசம், அல்லது ₹40...",
      quickChips: ["இலவச தானம்", "₹30", "₹50"],
    },
    EXPIRY: {
      spokenText: "Eththanai manineraththukkul pickup seiya vendum?",
      displayTitle: "எத்தனை மணி நேரத்திற்குள் எடுக்க வேண்டும்?",
      placeholder: "எ.கா: 3 மணி நேரத்திற்குள்...",
      quickChips: ["2 மணி நேரத்திற்குள்", "3 மணி நேரத்திற்குள்", "4 மணி நேரத்திற்குள்"],
    },
    COMPLETED: {
      spokenText: "Arumai! Anaiththu vivarangalum kidaiththana.",
      displayTitle: "அனைத்து விவரங்களும் தயார்!",
      placeholder: "தயார்...",
      quickChips: ["படிவத்தை நிரப்பவும் ✨"],
    },
  },
  "te-IN": {
    DISH_NAME: {
      spokenText: "Namaskaram! Meeru ae aaharanni daanam cheyalani anukuntunnaru?",
      displayTitle: "మీరు ఏ ఆహారాన్ని పంచుకోవాలనుకుంటున్నారు?",
      placeholder: "ఉదా: బిర్యానీ, పులావ్, రోటీ...",
      quickChips: ["చికెన్ బిర్యానీ", "వెజ్ పులావ్", "రోటీ కూర"],
    },
    QUANTITY: {
      spokenText: "Chala baagundi! Enni portions unnayi?",
      displayTitle: "ఎన్ని ప్లేట్లు లేదా ప్యాకెట్లు ఉన్నాయి?",
      placeholder: "ఉదా: 10 ప్లేట్లు, 5 ప్యాకెట్లు...",
      quickChips: ["5 ప్లేట్లు", "10 ప్లేట్లు", "20 ప్యాకెట్లు"],
    },
    PRICING: {
      spokenText: "Idi free daanama leda edaina dharana?",
      displayTitle: "ఇది ఉచిత దానమా లేక ధర ఉందా?",
      placeholder: "ఉదా: ఉచితం, లేదా ₹40...",
      quickChips: ["ఉచిత దానం", "₹30", "₹50"],
    },
    EXPIRY: {
      spokenText: "Enni gantallo pickup cheskovaali?",
      displayTitle: "ఎన్ని గంటలలోపు పికప్ చేసుకోవాలి?",
      placeholder: "ఉదా: 3 గంటలలోపు...",
      quickChips: ["2 గంటలలోపు", "3 గంటలలోపు", "4 గంటలలోపు"],
    },
    COMPLETED: {
      spokenText: "Chala baagundi! Vivaralu poorthi ayyayi.",
      displayTitle: "అన్ని వివరాలు సిద్ధంగా ఉన్నాయి!",
      placeholder: "సిద్ధం...",
      quickChips: ["ఫారమ్ పూరించండి ✨"],
    },
  },
};

/**
 * Determine the next missing step given current collected form fields
 */
export function getNextStep(data: Partial<ParsedFoodListing>): ConversationStep {
  if (!data.name || data.name.trim().length < 2) {
    return "DISH_NAME";
  }
  if (!data.quantity || Number(data.quantity) <= 0) {
    return "QUANTITY";
  }
  if (data.isDonation === undefined && (data.price === undefined || data.price === null)) {
    return "PRICING";
  }
  if (!data.expiresInHours || Number(data.expiresInHours) <= 0) {
    return "EXPIRY";
  }
  return "COMPLETED";
}

/**
 * Merge newly extracted fields into current state
 */
export function mergeExtractedFields(
  current: Partial<ParsedFoodListing>,
  incoming: Partial<ParsedFoodListing>
): Partial<ParsedFoodListing> {
  const merged: Partial<ParsedFoodListing> = { ...current };

  if (incoming.name && incoming.name.trim().length >= 2) {
    merged.name = incoming.name.trim();
  }
  if (incoming.description) {
    merged.description = incoming.description;
  }
  if (incoming.quantity && Number(incoming.quantity) > 0) {
    merged.quantity = Number(incoming.quantity);
  }
  if (incoming.quantityUnit) {
    merged.quantityUnit = incoming.quantityUnit;
  }
  if (typeof incoming.isDonation === "boolean") {
    merged.isDonation = incoming.isDonation;
    if (incoming.isDonation) {
      merged.price = 0;
    }
  }
  if (typeof incoming.price === "number" && !merged.isDonation) {
    merged.price = incoming.price;
    merged.originalPrice = incoming.originalPrice || Math.round(incoming.price * 1.4);
    merged.discountPct =
      merged.originalPrice > merged.price
        ? Math.round(((merged.originalPrice - merged.price) / merged.originalPrice) * 100)
        : 0;
  }
  if (incoming.expiresInHours && Number(incoming.expiresInHours) > 0) {
    merged.expiresInHours = Number(incoming.expiresInHours);
    merged.expiresAt = new Date(
      Date.now() + merged.expiresInHours * 3_600_000
    ).toISOString();
  }
  if (incoming.cuisineType) {
    merged.cuisineType = incoming.cuisineType;
  }
  if (typeof incoming.isHomeCooked === "boolean") {
    merged.isHomeCooked = incoming.isHomeCooked;
  }
  if (Array.isArray(incoming.allergens)) {
    merged.allergens = incoming.allergens;
  }

  return merged;
}
