export type PortfolioPoint = Readonly<{
  label: string;
  value: number;
}>;

export type PnlPoint = Readonly<{
  label: string;
  pnl: number;
}>;

export const mockPortfolioValue30d: readonly PortfolioPoint[] = [
  { label: "D1", value: 100_000 },
  { label: "D2", value: 100_850 },
  { label: "D3", value: 100_420 },
  { label: "D4", value: 101_140 },
  { label: "D5", value: 102_210 },
  { label: "D6", value: 101_980 },
  { label: "D7", value: 102_760 },
  { label: "D8", value: 103_110 },
  { label: "D9", value: 102_540 },
  { label: "D10", value: 103_980 },
  { label: "D11", value: 104_220 },
  { label: "D12", value: 104_050 },
  { label: "D13", value: 104_870 },
  { label: "D14", value: 105_610 },
  { label: "D15", value: 105_240 },
  { label: "D16", value: 106_380 },
  { label: "D17", value: 106_120 },
  { label: "D18", value: 106_950 },
  { label: "D19", value: 107_340 },
  { label: "D20", value: 107_020 },
  { label: "D21", value: 107_860 },
  { label: "D22", value: 108_440 },
  { label: "D23", value: 108_120 },
  { label: "D24", value: 109_020 },
  { label: "D25", value: 109_380 },
  { label: "D26", value: 109_010 },
  { label: "D27", value: 109_940 },
  { label: "D28", value: 110_420 },
  { label: "D29", value: 110_180 },
  { label: "D30", value: 111_060 },
];

export const mockPnl14d: readonly PnlPoint[] = [
  { label: "D1", pnl: 420 },
  { label: "D2", pnl: -180 },
  { label: "D3", pnl: 260 },
  { label: "D4", pnl: 980 },
  { label: "D5", pnl: -760 },
  { label: "D6", pnl: 340 },
  { label: "D7", pnl: 620 },
  { label: "D8", pnl: -220 },
  { label: "D9", pnl: 410 },
  { label: "D10", pnl: -520 },
  { label: "D11", pnl: 880 },
  { label: "D12", pnl: 240 },
  { label: "D13", pnl: -310 },
  { label: "D14", pnl: 570 },
];

