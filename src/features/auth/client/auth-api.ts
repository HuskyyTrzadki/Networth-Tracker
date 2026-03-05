import { requestJson } from "@/lib/http/client-request";

type EmailCredentials = Readonly<{
  email: string;
  password: string;
}>;

export type SignUpWithEmailResult = Readonly<{
  hasSession: boolean;
}>;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const toErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallbackMessage;
};

const postAuth = async (
  endpoint: string,
  fallbackMessage: string,
  body?: unknown
) => {
  const { payload } = await requestJson(endpoint, {
    method: "POST",
    json: body,
    fallbackMessage,
  });
  return payload;
};

const readSignUpResult = (payload: unknown): SignUpWithEmailResult => {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord || typeof payloadRecord.hasSession !== "boolean") {
    throw new Error("Brak informacji o sesji po rejestracji.");
  }
  return {
    hasSession: payloadRecord.hasSession,
  };
};

export const readAuthErrorMessage = toErrorMessage;

export const signOutSession = async () => {
  await postAuth("/api/auth/signout", "Coś poszło nie tak. Spróbuj ponownie.");
};

export const signInWithEmail = async (credentials: EmailCredentials) => {
  await postAuth(
    "/api/auth/signin/email",
    "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.",
    credentials
  );
};

export const signUpWithEmail = async (
  credentials: EmailCredentials
): Promise<SignUpWithEmailResult> => {
  const payload = await postAuth(
    "/api/auth/signup/email",
    "Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.",
    credentials
  );
  return readSignUpResult(payload);
};

export const upgradeWithEmail = async (credentials: EmailCredentials) => {
  await postAuth(
    "/api/auth/upgrade/email",
    "Nie udało się uaktualnić przez e-mail. Sprawdź dane i spróbuj ponownie.",
    credentials
  );
};
