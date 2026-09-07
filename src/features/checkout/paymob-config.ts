type PaymobEnvironment = {
  PAYMOB_SECRET_KEY?: string;
  PAYMOB_PUBLIC_KEY?: string;
  PAYMOB_INTEGRATION_ID?: string;
  PAYMOB_HMAC_SECRET?: string;
  PAYMOB_ENABLED?: string;
  NEXT_PUBLIC_APP_URL?: string;
};

function enabledFlag(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");
}

export function paymobIntegrationIds(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isSafeInteger(item) && item > 0);
}

function hasValidAppUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname))
    );
  } catch {
    return false;
  }
}

export function getPaymobConfigurationStatus(
  suppliedEnvironment?: PaymobEnvironment,
) {
  const environment = suppliedEnvironment ?? {
    PAYMOB_SECRET_KEY: process.env.PAYMOB_SECRET_KEY,
    PAYMOB_PUBLIC_KEY: process.env.PAYMOB_PUBLIC_KEY,
    PAYMOB_INTEGRATION_ID: process.env.PAYMOB_INTEGRATION_ID,
    PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
    PAYMOB_ENABLED: process.env.PAYMOB_ENABLED,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
  const missing: string[] = [];
  if (!enabledFlag(environment.PAYMOB_ENABLED)) missing.push("PAYMOB_ENABLED");
  if (!environment.PAYMOB_SECRET_KEY) missing.push("PAYMOB_SECRET_KEY");
  if (!environment.PAYMOB_PUBLIC_KEY) missing.push("PAYMOB_PUBLIC_KEY");
  if (!paymobIntegrationIds(environment.PAYMOB_INTEGRATION_ID).length)
    missing.push("PAYMOB_INTEGRATION_ID");
  if (!environment.PAYMOB_HMAC_SECRET)
    missing.push("PAYMOB_HMAC_SECRET");
  if (!hasValidAppUrl(environment.NEXT_PUBLIC_APP_URL))
    missing.push("NEXT_PUBLIC_APP_URL");
  return {
    configured: missing.length === 0,
    enabled: enabledFlag(environment.PAYMOB_ENABLED),
    missing,
  };
}

export function hasPaymobConfiguration() {
  return getPaymobConfigurationStatus().configured;
}

export function isConfiguredPaymobIntegration(value: unknown) {
  const integrationId = Number(value);
  return (
    Number.isSafeInteger(integrationId) &&
    paymobIntegrationIds(process.env.PAYMOB_INTEGRATION_ID).includes(
      integrationId,
    )
  );
}
