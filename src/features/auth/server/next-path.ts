export const DEFAULT_POST_AUTH_PATH = "/settings";

export function getSafeNextPath(
  nextPath: string | null | undefined,
  fallback: string = DEFAULT_POST_AUTH_PATH
) {
  // Only allow same-origin relative paths to avoid open redirect issues.
  if (!nextPath) return fallback;

  try {
    // Decode to handle OAuth-style `next=%2Fpath` values safely.
    const decoded = decodeURIComponent(nextPath);
    if (!decoded.startsWith("/")) return fallback;
    if (decoded.startsWith("//")) return fallback;
    if (decoded.includes("\\")) return fallback;

    return decoded;
  } catch {
    // Malformed values fall back to a safe path.
    return fallback;
  }
}
