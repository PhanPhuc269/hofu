import Constants from "expo-constants";
import Logs from "./logs";

let authToken: string | null = null;
let overrideBaseUrl: string | null = null;
// A single in-flight refresh promise to avoid multiple simultaneous refreshes
let refreshingTokenPromise: Promise<string | null> | null = null;

function getExtra(): any {
  // Support different Expo SDK shapes
  // prefer expoConfig.extra, fallback to manifest.extra
  // If neither exists, return empty object
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (
    (Constants.expoConfig && (Constants.expoConfig as any).extra) ||
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (Constants.manifest && Constants.manifest.extra) ||
    {}
  );
}

// Start capturing console logs early so we can attach them to outgoing requests.
try {
  Logs.startLogCapture();
} catch (e) {
  // ignore if start fails for any reason
}

function defaultBaseUrl(): string {
  const extra = getExtra();
  // Look for API_BASE_URL in expo config extra
  if (extra && extra.API_BASE_URL) return extra.API_BASE_URL;

  // Common fallback for local development. On Android emulator use 10.0.2.2.
  // Let the developer override at runtime via setBaseUrl.
  return "http://localhost:3000";
}

export function setBaseUrl(url: string | null) {
  overrideBaseUrl = url;
}

export function getBaseUrl(): string {
  return overrideBaseUrl || defaultBaseUrl();
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function apiRequest<T = any>(
  path: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    // If true, body will not be JSON.stringified (useful for FormData)
    rawBody?: boolean;
  }
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${getBaseUrl().replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const method = (options && options.method) || "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options && options.headers),
  };

  // Verbose API logging (dev by default). Use setter below to toggle at runtime.
  // We avoid logging the Authorization value to prevent leaking tokens.
  let verboseApiLogging =
    typeof __DEV__ !== "undefined" ? Boolean(__DEV__) : false;

  // Allow runtime toggling via attached property. If previously set, respect it.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof (apiRequest as any).verboseEnabled !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    verboseApiLogging = Boolean((apiRequest as any).verboseEnabled);
  }

  let body: any = undefined;
  if (options && Object.prototype.hasOwnProperty.call(options, "body")) {
    if (options.rawBody) {
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Attach device logs in development to outgoing requests (header is trimmed/encoded)
  const shouldAttachLogs = typeof __DEV__ !== "undefined" ? __DEV__ : false;
  const requestHeaders = shouldAttachLogs
    ? Logs.attachLogsToHeaders(headers, { maxChars: 3000 })
    : headers;

  // Prepare a request id and timestamp for correlating logs
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  // Log outgoing request (sanitized) when verbose logging enabled
  if (verboseApiLogging) {
    const sanitizedHeaders = { ...requestHeaders } as Record<string, any>;
    if (sanitizedHeaders.Authorization) sanitizedHeaders.Authorization = "***";
    try {
      // Attempt to parse JSON bodies for nicer output, but fall back to raw/truncated string
      let loggedBody: any = body;
      if (typeof body === "string") {
        try {
          loggedBody = JSON.parse(body);
        } catch (_e) {
          loggedBody =
            body.length > 2000 ? `${body.slice(0, 2000)}... (truncated)` : body;
        }
      }
      // eslint-disable-next-line no-console
      console.debug("[api] request:start", {
        id: requestId,
        timestamp: new Date(startTime).toISOString(),
        method,
        url,
        headers: sanitizedHeaders,
        body: loggedBody,
      });
    } catch (e) {
      // ignore logging failures
    }
  }

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body,
  });

  const text = await res.text();
  // try parse JSON, but fall back to text
  let data: any = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // leave as text
  }

  const duration = Date.now() - startTime;

  // User-friendly summary response log when verbose logging enabled
  if (verboseApiLogging) {
    try {
      // Short summary line
      // eslint-disable-next-line no-console
      console.log(
        `[api] ${method} ${url} -> ${res.status} (${duration}ms) [id=${requestId}]`
      );

      // Pretty-print parsed JSON if it's an object, otherwise print text
      let pretty: string;
      if (data && typeof data === "object") {
        try {
          pretty = JSON.stringify(data, null, 2);
        } catch (_e) {
          pretty = String(data);
        }
      } else {
        pretty = typeof data === "string" ? data : String(data);
      }

      const max = 2000;
      if (pretty.length > max) {
        // eslint-disable-next-line no-console
        console.log(pretty.slice(0, max) + "\n... (truncated)");
      } else {
        // eslint-disable-next-line no-console
        console.log(pretty);
      }
    } catch (e) {
      // ignore logging failures
    }
  }

  // If unauthorized, try to refresh Firebase ID token (if available) and retry once
  if (!res.ok) {
    // Attempt refresh only on 401 Unauthorized
    if (res.status === 401) {
      try {
        // Ensure only one refresh runs concurrently
        if (!refreshingTokenPromise) {
          refreshingTokenPromise = (async () => {
            try {
              // Dynamically import firebase to avoid static circular imports
              const fb = await import("./firebase");
              const auth = (fb as any).auth;
              if (!auth || !auth.currentUser) return null;
              // Force refresh the token
              const newToken = await auth.currentUser.getIdToken(true);
              // Update local token store so future requests use it
              setAuthToken(newToken);
              return newToken;
            } catch (e) {
              return null;
            }
          })();
        }

        const newToken = await refreshingTokenPromise;

        // If we obtained a new token, retry the request once
        if (newToken) {
          // rebuild headers for retry (clone to avoid mutating original shared headers)
          const retryHeaders: Record<string, string> = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };

          const retryRequestHeaders = shouldAttachLogs
            ? Logs.attachLogsToHeaders(retryHeaders, { maxChars: 3000 })
            : retryHeaders;

          const retryRes = await fetch(url, {
            method,
            headers: retryRequestHeaders,
            body,
          });

          const retryText = await retryRes.text();
          let retryData: any = retryText;
          try {
            retryData = retryText ? JSON.parse(retryText) : null;
          } catch (e) {
            // leave as text
          }

          if (!retryRes.ok) {
            const message =
              (retryData && (retryData.error || retryData.message)) ||
              retryText ||
              retryRes.statusText;
            const err: any = new Error(message || "Request failed");
            err.status = retryRes.status;
            err.data = retryData;
            // log failed retry
            if (
              (apiRequest as any).verboseEnabled ||
              (typeof __DEV__ !== "undefined" ? __DEV__ : false)
            ) {
              // eslint-disable-next-line no-console
              console.warn("[api] retry failed", {
                id: requestId,
                url,
                status: retryRes.status,
                data: retryData,
              });
            }
            throw err;
          }

          return retryData as T;
        }
      } catch (e) {
        // If refresh attempt fails, fall through to throw original error below
      } finally {
        // clear the refresh promise so future refreshes can run
        refreshingTokenPromise = null;
      }
    }

    const message =
      (data && (data.error || data.message)) || text || res.statusText;
    const err: any = new Error(message || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

// Attach simple setter on the function so callers can toggle verbose logging at runtime
// without changing the module's exports shape. Usage: (apiRequest as any).setVerboseLogging(true)
// or import api and call: api.request.setVerboseLogging?.(true)
(apiRequest as any).setVerboseLogging = (enabled: boolean) => {
  (apiRequest as any).verboseEnabled = Boolean(enabled);
};

export default {
  getBaseUrl,
  setBaseUrl,
  setAuthToken,
  request: apiRequest,
};
