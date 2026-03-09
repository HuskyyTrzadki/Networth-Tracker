"use client";

import { useEffect, useRef, useState } from "react";

import { getBrokerImportJob } from "../client/get-broker-import-job";
import { runBrokerImportJob } from "../client/run-broker-import-job";
import type { BrokerImportProviderId } from "../lib/broker-import-providers";
import type { BrokerImportRunSummary } from "../lib/broker-import-types";

const POLL_INTERVAL_MS = 500;
const RUNNING_STALE_AFTER_MS = 15_000;

const isTerminalStatus = (status: BrokerImportRunSummary["status"]) =>
  status === "completed" || status === "failed" || status === "blocked";

export function useBrokerImportRun(
  provider: BrokerImportProviderId | null,
  runId: string | null
) {
  const [run, setRun] = useState<BrokerImportRunSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(runId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isKickoffInFlightRef = useRef(false);

  useEffect(() => {
    if (!provider || !runId) {
      setRun(null);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();

    const scheduleNextPoll = () => {
      if (!isActive) {
        return;
      }

      timeoutId = setTimeout(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    };

    const maybeKickoffRun = async (currentRun: BrokerImportRunSummary) => {
      const updatedAtMs = Date.parse(currentRun.updatedAt);
      const isRunningStale =
        currentRun.status === "running" &&
        Number.isFinite(updatedAtMs) &&
        Date.now() - updatedAtMs > RUNNING_STALE_AFTER_MS;
      const shouldKickoff = currentRun.status === "queued" || isRunningStale;

      if (!shouldKickoff || isKickoffInFlightRef.current) {
        return;
      }

      isKickoffInFlightRef.current = true;
      try {
        const nextRun = await runBrokerImportJob(provider, runId, controller.signal);
        if (isActive) {
          setRun(nextRun);
        }
      } catch (error) {
        if (isActive && error instanceof Error && error.name !== "AbortError") {
          setErrorMessage(error.message);
        }
      } finally {
        isKickoffInFlightRef.current = false;
      }
    };

    const poll = async () => {
      try {
        const currentRun = await getBrokerImportJob(provider, runId, controller.signal);
        if (!isActive) {
          return;
        }

        setRun(currentRun);
        setIsLoading(false);
        setErrorMessage(null);

        if (!isTerminalStatus(currentRun.status)) {
          await maybeKickoffRun(currentRun);
          scheduleNextPoll();
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setIsLoading(false);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nie udało się odczytać statusu importu brokera."
        );
      }
    };

    void poll();

    return () => {
      isActive = false;
      controller.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [provider, runId]);

  return {
    run,
    isLoading,
    errorMessage,
  };
}
