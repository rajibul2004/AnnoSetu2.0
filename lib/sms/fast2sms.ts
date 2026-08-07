interface SendSmsOptions {
  phone: string;
  otp: string;
}

interface Fast2SmsResponse {
  return: boolean;
  request_id?: string;
  message?: string[];
}

export async function sendOtpSms({ phone, otp }: SendSmsOptions): Promise<{ success: boolean; message?: string }> {
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
    return { success: false, message: "Invalid 10-digit Indian phone number." };
  }

  try {
    // Fast2SMS Quick OTP route
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

    // Fallback to quick SMS route if OTP route has issues
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

    console.error("Fast2SMS error:", data.message || fallbackData.message);
    return {
      success: false,
      message: fallbackData.message?.[0] || data.message?.[0] || "Failed to deliver SMS.",
    };
  } catch (error) {
    console.error("Fast2SMS network error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "SMS dispatch failed.",
    };
  }
}
