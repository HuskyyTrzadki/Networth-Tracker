"use client";

import { useEffect, useRef, useState } from "react";

type AsyncStatus = "idle" | "loading" | "success" | "error";

type AsyncState<TData> = Readonly<{
  requestKey: string | null;
  data: TData | null;
  errorMessage: string | null;
  status: AsyncStatus;
}>;

type Result<TData> = Readonly<{
  requestKey: string | null;
  data: TData | null;
  errorMessage: string | null;
  status: AsyncStatus;
  isLoading: boolean;
}>;

type Params<TData> = Readonly<{
  requestKey: string | null;
  load: (signal: AbortSignal) => Promise<TData>;
  getErrorMessage?: (error: unknown) => string;
}>;

const initialState = <TData>(): AsyncState<TData> => ({
  requestKey: null,
  data: null,
  errorMessage: null,
  status: "idle",
});

const defaultErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Request failed.";

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

export function useKeyedAsyncResource<TData>({
  requestKey,
  load,
  getErrorMessage,
}: Params<TData>): Result<TData> {
  const [state, setState] = useState<AsyncState<TData>>(initialState<TData>());
  const loadRef = useRef(load);
  const getErrorMessageRef = useRef(getErrorMessage);

  useEffect(() => {
    loadRef.current = load;
    getErrorMessageRef.current = getErrorMessage;
  }, [getErrorMessage, load]);

  useEffect(() => {
    if (!requestKey) {
      return;
    }

    const controller = new AbortController();

    void loadRef.current(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          requestKey,
          data,
          errorMessage: null,
          status: "success",
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        const message = getErrorMessageRef.current
          ? getErrorMessageRef.current(error)
          : defaultErrorMessage(error);

        setState({
          requestKey,
          data: null,
          errorMessage: message,
          status: "error",
        });
      });

    return () => {
      controller.abort();
    };
  }, [requestKey]);

  if (!requestKey) {
    return {
      requestKey: null,
      data: null,
      errorMessage: null,
      status: "idle",
      isLoading: false,
    };
  }

  if (state.requestKey !== requestKey) {
    return {
      requestKey,
      data: null,
      errorMessage: null,
      status: "loading",
      isLoading: true,
    };
  }

  return {
    requestKey,
    data: state.data,
    errorMessage: state.errorMessage,
    status: state.status,
    isLoading: state.status === "loading",
  };
}
