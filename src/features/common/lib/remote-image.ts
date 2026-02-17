const REMOTE_IMAGE_PROXY_PATH = "/api/public/image";

export const buildRemoteImageProxyUrl = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return `${REMOTE_IMAGE_PROXY_PATH}?url=${encodeURIComponent(raw)}`;
  } catch {
    return null;
  }
};
