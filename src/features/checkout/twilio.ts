import "server-only";

function configuration() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) return null;
  return { accountSid, authToken, serviceSid };
}

async function verifyRequest(path: string, body: URLSearchParams) {
  const config = configuration();
  if (!config) throw new Error("OTP_NOT_CONFIGURED");
  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${config.serviceSid}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    },
  );
  const data = await response.json() as { sid?: string; status?: string; message?: string };
  if (!response.ok) throw new Error(data.message ?? "OTP_PROVIDER_ERROR");
  return data;
}

export async function sendCheckoutOtp(phone: string) {
  if (process.env.NODE_ENV !== "production" && process.env.CHECKOUT_TEST_OTP) {
    return { sid: "local-test", status: "pending" };
  }
  return verifyRequest("Verifications", new URLSearchParams({ To: phone, Channel: "sms" }));
}

export async function checkCheckoutOtp(phone: string, code: string) {
  if (process.env.NODE_ENV !== "production" && process.env.CHECKOUT_TEST_OTP) {
    return code === process.env.CHECKOUT_TEST_OTP;
  }
  const result = await verifyRequest(
    "VerificationCheck",
    new URLSearchParams({ To: phone, Code: code }),
  );
  return result.status === "approved";
}
