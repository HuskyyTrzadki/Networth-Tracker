# Yahoo: Executive Compensation (CEO Pay)

This note explains how to fetch CEO compensation from Yahoo data used in this project.

## Which endpoint to use

Use `quoteSummary` with module `assetProfile`:

- `v10/finance/quoteSummary/<SYMBOL>?modules=assetProfile`

Do **not** use `ws/insights/v1/finance/insights` for this use case.  
`insights` is a different feed and does not provide `companyOfficers[].totalPay`.

## Expected fields

Look at:

- `assetProfile.companyOfficers[]`
- `assetProfile.companyOfficers[].title`
- `assetProfile.companyOfficers[].totalPay`
- `assetProfile.companyOfficers[].fiscalYear`

Notes:

- `totalPay` can be missing for some officers/tickers.
- `totalPay` is compensation (not always pure base salary).

## Recommended CLI (handles crumb/cookies for you)

```bash
npx yahoo-finance2 quoteSummary GOOGL '{"modules":["assetProfile"]}'
```

Extract CEO-only fields:

```bash
npx yahoo-finance2 quoteSummary GOOGL '{"modules":["assetProfile"]}' \
| jq '.assetProfile.companyOfficers[] | select((.title|ascii_downcase|test("ceo|chief executive officer"))) | {name,title,totalPay,fiscalYear}'
```

ORLEN example:

```bash
npx yahoo-finance2 quoteSummary PKN.WA '{"modules":["assetProfile"]}'
```

## Postman flow (if needed)

Direct call can fail with `Invalid Crumb`.

1. Get crumb (keep Yahoo cookies in Postman cookie jar):
   - `GET https://query1.finance.yahoo.com/v1/test/getcrumb`
2. Use crumb in quoteSummary call:
   - `GET https://query1.finance.yahoo.com/v10/finance/quoteSummary/GOOGL?modules=assetProfile&crumb=<CRUMB>`

Suggested headers:

- `User-Agent: Mozilla/5.0`
- `Accept: application/json`

## In-code mapping

In this repo, `yahoo-finance2` maps this to:

```ts
yahooFinance.quoteSummary("GOOGL", { modules: ["assetProfile"] }, { validateResult: false });
```
