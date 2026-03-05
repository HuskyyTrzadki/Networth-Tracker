"use client";

import { useState } from "react";

import { runAuthAction } from "./auth-action-runner";

export type AuthNotice = Readonly<{
  kind: "error" | "success";
  message: string;
}>;

type RunWithPendingParams<TPendingAction extends string, TResult> = Readonly<{
  pendingAction: TPendingAction;
  run: () => Promise<TResult>;
  onSuccess?: (result: TResult) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}>;

export function useAuthActionState<TPendingAction extends string>() {
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [pendingAction, setPendingAction] = useState<TPendingAction | null>(null);

  const clearNotice = () => setNotice(null);
  const setErrorNotice = (message: string) => setNotice({ kind: "error", message });
  const setSuccessNotice = (message: string) =>
    setNotice({ kind: "success", message });

  const runWithPending = async <TResult>({
    pendingAction: nextPendingAction,
    run,
    onSuccess,
    onError,
  }: RunWithPendingParams<TPendingAction, TResult>) => {
    await runAuthAction({
      before: () => {
        clearNotice();
        setPendingAction(nextPendingAction);
      },
      run,
      onSuccess,
      onError,
      after: () => setPendingAction(null),
    });
  };

  return {
    notice,
    pendingAction,
    clearNotice,
    setNotice,
    setErrorNotice,
    setSuccessNotice,
    runWithPending,
  };
}
