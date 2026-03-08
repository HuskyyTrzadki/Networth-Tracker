import type { CashCurrency } from "../../lib/system-currencies";
import type { CashflowType } from "../../lib/cashflow-types";
import { divideDecimals, multiplyDecimals, parseDecimalString } from "@/lib/decimal";

export type ParsedWorkbookRow = Readonly<{
  previewId: string;
  xtbRowId: string;
  sourceFileName: string;
  sourceType: string;
  executedAtUtc: string | null;
  sourceOrder: number;
  kind:
    | "TRADE_BUY"
    | "TRADE_SELL"
    | "CASH_DEPOSIT"
    | "CASH_WITHDRAWAL"
    | "DIVIDEND"
    | "INTEREST"
    | "TAX";
  tradeDate: string;
  accountCurrency: CashCurrency;
  accountNumber: string;
  amount: string;
  instrumentLabel: string | null;
  comment: string | null;
  quantity: string;
  price: string;
  fee: string;
  cashflowType: CashflowType | null;
  side: "BUY" | "SELL";
  requiresInstrument: boolean;
  commentTicker: string | null;
}>;

const TRADE_COMMENT_REGEX =
  /(?:OPEN|CLOSE)\s+BUY\s+([0-9.,]+)(?:\/[0-9.,]+)?\s+@\s+([0-9.,]+)/i;
const COMMENT_TICKER_REGEX = /^([A-Z0-9._-]+)/;
const RESERVED_COMMENT_TICKERS = new Set(["OPEN", "CLOSE", "BUY", "SELL", "PLN", "USD", "EUR", "WHT"]);
const MAX_INFERRED_FEE_RATIO = parseDecimalString("0.05");

const parseTradeComment = (comment: string) => {
  const match = comment.match(TRADE_COMMENT_REGEX);
  if (!match) {
    return null;
  }

  const quantity = parseDecimalString(match[1]);
  const displayPrice = parseDecimalString(match[2]);
  if (!quantity || !displayPrice || quantity.lte(0) || displayPrice.lt(0)) {
    return null;
  }

  return {
    quantity,
    displayPrice,
  };
};

const parseCommentTicker = (comment: string) => {
  const match = comment.trim().toUpperCase().match(COMMENT_TICKER_REGEX);
  const ticker = match?.[1] ?? null;

  if (!ticker || RESERVED_COMMENT_TICKERS.has(ticker)) {
    return null;
  }

  return ticker;
};

const resolveTradeMoney = (amount: string, quantityText: string, priceText: string) => {
  const quantity = parseDecimalString(quantityText);
  const displayedPrice = parseDecimalString(priceText);
  const absoluteAmount = parseDecimalString(amount)?.abs();

  if (!quantity || !displayedPrice || !absoluteAmount || quantity.lte(0)) {
    return null;
  }

  const gross = multiplyDecimals(quantity, displayedPrice);
  if (absoluteAmount.gte(gross)) {
    const inferredFee = absoluteAmount.minus(gross);
    const maxReasonableFee =
      MAX_INFERRED_FEE_RATIO ? multiplyDecimals(gross, MAX_INFERRED_FEE_RATIO) : null;

    if (inferredFee.gt(0) && maxReasonableFee && inferredFee.lte(maxReasonableFee)) {
      return {
        price: displayedPrice.toString(),
        fee: inferredFee.toString(),
      };
    }

    return {
      price: displayedPrice.toString(),
      fee: "0",
    };
  }

  return {
    price: divideDecimals(absoluteAmount, quantity).toString(),
    fee: "0",
  };
};

const buildCashRow = (input: Readonly<{
  previewId: string;
  xtbRowId: string;
  fileName: string;
  accountCurrency: CashCurrency;
  accountNumber: string;
  sourceType: string;
  executedAtUtc: string | null;
  sourceOrder: number;
  tradeDate: string;
  amount: string;
  instrumentLabel: string | null;
  comment: string | null;
  kind: "CASH_DEPOSIT" | "CASH_WITHDRAWAL" | "DIVIDEND" | "INTEREST" | "TAX";
  cashflowType: CashflowType;
  side: "BUY" | "SELL";
}>): ParsedWorkbookRow => ({
  previewId: input.previewId,
  xtbRowId: input.xtbRowId,
  sourceFileName: input.fileName,
  sourceType: input.sourceType,
  executedAtUtc: input.executedAtUtc,
  sourceOrder: input.sourceOrder,
  kind: input.kind,
  tradeDate: input.tradeDate,
  accountCurrency: input.accountCurrency,
  accountNumber: input.accountNumber,
  amount: input.amount,
  instrumentLabel: input.instrumentLabel,
  comment: input.comment,
  quantity: parseDecimalString(input.amount)?.abs().toString() ?? "0",
  price: "1",
  fee: "0",
  cashflowType: input.cashflowType,
  side: input.side,
  requiresInstrument: false,
  commentTicker: parseCommentTicker(input.comment ?? ""),
});

const buildSignedTransferLikeRow = (input: Readonly<{
  previewId: string;
  xtbRowId: string;
  fileName: string;
  accountCurrency: CashCurrency;
  accountNumber: string;
  sourceType: string;
  executedAtUtc: string | null;
  sourceOrder: number;
  tradeDate: string;
  amount: string;
  instrumentLabel: string | null;
  comment: string | null;
}>) => {
  const amount = parseDecimalString(input.amount);
  if (!amount || amount.eq(0)) {
    return { reason: `${input.sourceType} XTB nie zawiera poprawnej kwoty.` } as const;
  }

  const isDeposit = amount.gt(0);
  return buildCashRow({
    ...input,
    instrumentLabel: null,
    kind: isDeposit ? "CASH_DEPOSIT" : "CASH_WITHDRAWAL",
    cashflowType: isDeposit ? "DEPOSIT" : "WITHDRAWAL",
    side: isDeposit ? "BUY" : "SELL",
  });
};

export function mapXtbSupportedRow(input: Readonly<{
  previewId: string;
  xtbRowId: string;
  fileName: string;
  accountCurrency: CashCurrency;
  accountNumber: string;
  sourceType: string;
  executedAtUtc: string | null;
  sourceOrder: number;
  instrumentLabel: string | null;
  tickerHint?: string | null;
  tradeDate: string;
  amount: string;
  comment: string | null;
}>): ParsedWorkbookRow | { reason: string } {
  const comment = input.comment ?? "";

  switch (input.sourceType) {
    case "Stock purchase":
    case "Stock sell": {
      const trade = parseTradeComment(comment);
      if (!trade) {
        return { reason: "Nie udało się odczytać ilości i ceny z komentarza transakcji." };
      }

      const resolvedMoney = resolveTradeMoney(
        input.amount,
        trade.quantity.toString(),
        trade.displayPrice.toString()
      );

      if (!resolvedMoney) {
        return { reason: "Nie udało się wyliczyć ceny lub prowizji z wiersza transakcji." };
      }

      return {
        previewId: input.previewId,
        xtbRowId: input.xtbRowId,
        sourceFileName: input.fileName,
        sourceType: input.sourceType,
        executedAtUtc: input.executedAtUtc,
        sourceOrder: input.sourceOrder,
        kind: input.sourceType === "Stock purchase" ? "TRADE_BUY" : "TRADE_SELL",
        tradeDate: input.tradeDate,
        accountCurrency: input.accountCurrency,
        accountNumber: input.accountNumber,
        amount: input.amount,
        instrumentLabel: input.instrumentLabel,
        comment: input.comment,
        quantity: trade.quantity.toString(),
        price: resolvedMoney.price,
        fee: resolvedMoney.fee,
        cashflowType: null,
        side: input.sourceType === "Stock purchase" ? "BUY" : "SELL",
        requiresInstrument: true,
        commentTicker: input.tickerHint ?? parseCommentTicker(comment) ?? null,
      };
    }
    case "Deposit":
      return buildCashRow({
        ...input,
        instrumentLabel: null,
        kind: "CASH_DEPOSIT",
        cashflowType: "DEPOSIT",
        side: "BUY",
      });
    case "Withdrawal":
      return buildCashRow({
        ...input,
        instrumentLabel: null,
        kind: "CASH_WITHDRAWAL",
        cashflowType: "WITHDRAWAL",
        side: "SELL",
      });
    case "IKE deposit":
      return buildSignedTransferLikeRow(input);
    case "IKE return partial":
      return buildSignedTransferLikeRow(input);
    case "Transfer": {
      return buildSignedTransferLikeRow(input);
    }
    case "Dividend":
      return buildCashRow({
        ...input,
        kind: "DIVIDEND",
        cashflowType: "DIVIDEND",
        side: "BUY",
      });
    case "Free funds interest":
      return buildCashRow({
        ...input,
        instrumentLabel: null,
        kind: "INTEREST",
        cashflowType: "INTEREST",
        side: "BUY",
      });
    case "Withholding tax":
    case "Free funds interest tax":
      return buildCashRow({
        ...input,
        kind: "TAX",
        cashflowType: "TAX",
        side: "SELL",
      });
    case "Total":
      return { reason: "Wiersz podsumowania XTB nie jest transakcją." };
    default:
      return { reason: "Typ operacji z XTB nie jest jeszcze obsługiwany." };
  }
}
