type EmailPasswordPayload = Readonly<{
  email: string;
  password: string;
}>;

const looksLikeEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function parseEmailPasswordPayload(value: unknown): {
  ok: true;
  data: EmailPasswordPayload;
} | {
  ok: false;
} {
  // Small runtime check to keep route handlers thin and safe.
  if (!value || typeof value !== "object") {
    return { ok: false };
  }

  if (!("email" in value) || !("password" in value)) {
    return { ok: false };
  }

  if (typeof value.email !== "string" || typeof value.password !== "string") {
    return { ok: false };
  }

  if (!looksLikeEmail(value.email) || value.password.length < 8) {
    return { ok: false };
  }

  return { ok: true, data: { email: value.email, password: value.password } };
}
