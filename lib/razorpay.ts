import Razorpay from "razorpay";

// Lazily instantiated so import doesn't fail if env vars are missing at build time
let _client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!_client) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables",
      );
    }

    _client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _client;
}
