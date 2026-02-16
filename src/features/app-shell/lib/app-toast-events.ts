export const APP_TOAST_EVENT = "app:toast";

export type AppToastAction = Readonly<{
  label: string;
  onClick: () => void | Promise<void>;
}>;

export type AppToastPayload = Readonly<{
  id?: string;
  title: string;
  description?: string;
  durationMs?: number;
  tone?: "default" | "success" | "destructive";
  action?: AppToastAction;
}>;

export const dispatchAppToast = (payload: AppToastPayload) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppToastPayload>(APP_TOAST_EVENT, { detail: payload }));
};
