interface SendSmsOptions {
  phone: string;
  otp: string;
}

interface Fast2SmsResponse {
  return?: boolean;
  status_code?: number;
  request_id?: string;
  message?: string | string[];
}

function parseFast2SmsMessage(data: Fast2SmsResponse): string {
  if (data.status_code === 996) {
    return "Fast2SMS requires website verification in your Fast2SMS dashboard (OTP Message menu) to activate this route.";
  }
  if (data.status_code === 999) {
    return "Fast2SMS requires a minimum wallet recharge of ₹100 on your account to activate API delivery.";
  }
  if (typeof data.message === "string") {
    return data.message;
  }
  if (Array.isArray(data.message) && data.message.length > 0 && typeof data.message[0] === "string") {
    return data.message[0];
  }
  return "Failed to deliver SMS OTP. Please check your Fast2SMS account.";
}

export async function sendOtpSms({
  phone,
  otp,
}: SendSmsOptions): Promise<{ success: boolean; message?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ FAST2SMS_API_KEY is not configured in environment variables.");
    return { success: false, message: "SMS service not configured." };
  }

  // Ensure clean 10-digit Indian phone number
  const cleanPhone = phone.replace(/\D/g, "");
  const normalizedPhone =
    cleanPhone.length === 12 && cleanPhone.startsWith("91")
      ? cleanPhone.slice(2)
      : cleanPhone;

  if (normalizedPhone.length !== 10) {
    return { success: false, message: "Please enter a valid 10-digit Indian mobile number." };
  }

  try {
    // Attempt 1: Fast2SMS Quick OTP route
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variables_values: otp,
        route: "otp",
        numbers: normalizedPhone,
      }),
    });

    const data: Fast2SmsResponse = await response.json();

    if (data.return === true) {
      return { success: true };
    }

    // Attempt 2: Fast2SMS Quick SMS route fallback
    const fallbackResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: `Your AnnoSetu verification code is: ${otp}. Valid for 10 minutes.`,
        language: "english",
        flash: 0,
        numbers: normalizedPhone,
      }),
    });

    const fallbackData: Fast2SmsResponse = await fallbackResponse.json();

    if (fallbackData.return === true) {
      return { success: true };
    }

    const humanReadableError = parseFast2SmsMessage(data.status_code ? data : fallbackData);
    console.error(`[Fast2SMS Error] (${data.status_code || fallbackData.status_code}):`, humanReadableError);

    // In local development, log the OTP so you are never blocked during testing
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n📱 [DEV SMS OTP FALLBACK] Phone: +91-${normalizedPhone} | Code: ${otp}\n`);
    }

    return {
      success: false,
      message: humanReadableError,
    };
  } catch (error) {
    console.error("Fast2SMS network error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "SMS dispatch failed.",
    };
  }
}
