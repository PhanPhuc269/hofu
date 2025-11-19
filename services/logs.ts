import Constants from "expo-constants";
import { Platform } from "react-native";

type LogEntry = {
  level: "log" | "warn" | "error" | "info" | "debug";
  message: string;
  ts: number;
};

const MAX_ENTRIES = 200;
const logs: LogEntry[] = [];

function formatArg(arg: any): string {
  try {
    if (typeof arg === "string") return arg;
    if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
    return JSON.stringify(arg);
  } catch (e) {
    return String(arg);
  }
}

function pushLog(level: LogEntry["level"], args: any[]) {
  try {
    const message = args.map(formatArg).join(" ");
    logs.push({ level, message, ts: Date.now() });
    if (logs.length > MAX_ENTRIES) logs.shift();
  } catch (e) {
    // ignore errors while logging
  }
}

export function startLogCapture() {
  // Avoid double-wrapping
  if ((global as any).__deviceLogsHooked) return;

  const levels: Array<LogEntry["level"]> = [
    "log",
    "warn",
    "error",
    "info",
    "debug",
  ];

  levels.forEach((level) => {
    const orig = (console as any)[level] || console.log;
    (console as any)[level] = (...args: any[]) => {
      pushLog(level, args);
      try {
        orig.apply(console, args);
      } catch (e) {
        // ignore console apply errors
      }
    };
  });

  (global as any).__deviceLogsHooked = true;
}

export function getLogs(): LogEntry[] {
  return logs.slice();
}

export function clearLogs() {
  logs.length = 0;
}

// Attach logs to headers; encodes and trims payload to ensure headers remain small.
export function attachLogsToHeaders(
  headers: Record<string, string>,
  options?: { maxChars?: number }
): Record<string, string> {
  const maxChars = options?.maxChars ?? 3000; // default trim size

  const info = {
    platform: Platform.OS,
    appVersion:
      // prefer new expoConfig shape then manifest
      (Constants.expoConfig && (Constants.expoConfig as any).version) ||
      (Constants.manifest && (Constants.manifest as any).version) ||
      undefined,
    ts: new Date().toISOString(),
  };

  const payload = {
    info,
    logs: getLogs(),
  };

  let serialized: string;
  try {
    serialized = JSON.stringify(payload);
  } catch (e) {
    // fallback to a small summary
    serialized = JSON.stringify({
      info,
      logs: getLogs().map((l) => ({
        level: l.level,
        message: l.message.slice(0, 200),
      })),
    });
  }

  let trimmed = serialized;
  if (trimmed.length > maxChars) {
    trimmed = trimmed.slice(trimmed.length - maxChars); // keep the tail which often contains most recent logs
  }

  // Use encodeURIComponent to make header safe; avoid Buffer usage which may not be available.
  const encoded = encodeURIComponent(trimmed);

  return {
    ...headers,
    "X-Device-Logs": encoded,
  };
}

export default {
  startLogCapture,
  getLogs,
  clearLogs,
  attachLogsToHeaders,
};
