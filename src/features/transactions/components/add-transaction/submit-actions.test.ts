import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TransactionSubmitIntent } from "./submit-intent";
import {
  executeTransactionSubmitIntent,
  undoCreatedTransaction,
} from "./submit-actions";
import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "../../server/transaction-actions";

vi.mock("../../server/transaction-actions", () => ({
  createTransactionAction: vi.fn(),
  updateTransactionAction: vi.fn(),
  deleteTransactionAction: vi.fn(),
}));

const createIntent: TransactionSubmitIntent = {
  kind: "create",
  portfolioId: "portfolio-1",
  payload: {
    type: "BUY",
    date: "2026-03-05",
    quantity: "10",
    price: "100",
    fee: "0",
    notes: "",
    consumeCash: false,
    customAnnualRatePct: undefined,
    portfolioId: "portfolio-1",
    clientRequestId: "request-id",
    instrument: {
      provider: "yahoo",
      providerKey: "AAPL",
      symbol: "AAPL",
      name: "Apple",
      currency: "USD",
    },
  },
};

const editIntent: TransactionSubmitIntent = {
  kind: "edit",
  transactionId: "tx-1",
  payload: {
    type: "BUY",
    date: "2026-03-05",
    quantity: "10",
    price: "100",
    fee: "0",
    notes: "",
    consumeCash: false,
    customAnnualRatePct: undefined,
  },
};

describe("submit-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes create intent and returns transaction id", async () => {
    vi.mocked(createTransactionAction).mockResolvedValueOnce({
      portfolioId: "portfolio-1",
      transactionId: "tx-created",
    } as never);

    const result = await executeTransactionSubmitIntent(createIntent);

    expect(result).toEqual({
      ok: true,
      kind: "create",
      portfolioId: "portfolio-1",
      transactionId: "tx-created",
    });
  });

  it("returns fallback message on edit failure", async () => {
    vi.mocked(updateTransactionAction).mockRejectedValueOnce("bad");

    const result = await executeTransactionSubmitIntent(editIntent);

    expect(result).toEqual({
      ok: false,
      message: "Nie udało się zaktualizować transakcji.",
    });
  });

  it("undoes created transaction and returns portfolio id", async () => {
    vi.mocked(deleteTransactionAction).mockResolvedValueOnce({
      portfolioId: "portfolio-1",
    } as never);

    const result = await undoCreatedTransaction("tx-created");

    expect(result).toEqual({
      ok: true,
      portfolioId: "portfolio-1",
    });
  });
});
