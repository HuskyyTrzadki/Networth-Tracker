import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "../../server/transaction-actions";
import type { TransactionSubmitIntent } from "./submit-intent";

const resolveErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error ? error.message : fallbackMessage;

export type ExecuteTransactionSubmitIntentResult =
  | Readonly<{
      ok: true;
      kind: "edit";
      portfolioId: string;
    }>
  | Readonly<{
      ok: true;
      kind: "create";
      portfolioId: string;
      transactionId: string;
    }>
  | Readonly<{
      ok: false;
      message: string;
    }>;

export const executeTransactionSubmitIntent = async (
  intent: TransactionSubmitIntent
): Promise<ExecuteTransactionSubmitIntentResult> => {
  if (intent.kind === "edit") {
    const updated = await updateTransactionAction(
      intent.transactionId,
      intent.payload
    ).catch((error: unknown) => {
      return {
        errorMessage: resolveErrorMessage(
          error,
          "Nie udało się zaktualizować transakcji."
        ),
      } as const;
    });

    if ("errorMessage" in updated) {
      return {
        ok: false,
        message: updated.errorMessage,
      };
    }

    return {
      ok: true,
      kind: "edit",
      portfolioId: updated.portfolioId,
    };
  }

  const created = await createTransactionAction(intent.payload).catch((error: unknown) => {
    return {
      errorMessage: resolveErrorMessage(error, "Nie udało się zapisać transakcji."),
    } as const;
  });

  if ("errorMessage" in created) {
    return {
      ok: false,
      message: created.errorMessage,
    };
  }

  return {
    ok: true,
    kind: "create",
    portfolioId: intent.portfolioId,
    transactionId: created.transactionId,
  };
};

export type UndoTransactionCreateResult =
  | Readonly<{
      ok: true;
      portfolioId: string;
    }>
  | Readonly<{
      ok: false;
      message: string;
    }>;

export const undoCreatedTransaction = async (
  transactionId: string
): Promise<UndoTransactionCreateResult> => {
  const deleted = await deleteTransactionAction(transactionId).catch((error: unknown) => {
    return {
      errorMessage: resolveErrorMessage(error, "Nie udało się cofnąć transakcji."),
    } as const;
  });

  if ("errorMessage" in deleted) {
    return {
      ok: false,
      message: deleted.errorMessage,
    };
  }

  return {
    ok: true,
    portfolioId: deleted.portfolioId,
  };
};
