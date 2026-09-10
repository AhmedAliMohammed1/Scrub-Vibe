type LogLevel = "info" | "warn" | "error";

export type OperationalLog = {
  event: string;
  requestId?: string | null;
  route?: string;
  durationMs?: number;
  outcome?: string;
  errorCode?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

function write(level: LogLevel, entry: OperationalLog) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "scrub-vibe",
    ...entry,
  });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

export const operationsLogger = {
  info: (entry: OperationalLog) => write("info", entry),
  warn: (entry: OperationalLog) => write("warn", entry),
  error: (entry: OperationalLog) => write("error", entry),
};

export function requestId(request: Request) {
  return (
    request.headers.get("x-vercel-id") ??
    request.headers.get("x-request-id") ??
    crypto.randomUUID()
  );
}
