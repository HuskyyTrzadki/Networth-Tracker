export type Domain = readonly [number, number];

type DomainOptions = Readonly<{
  paddingRatio?: number;
  minAbsolutePadding?: number;
}>;

const defaultOptions: Required<DomainOptions> = {
  paddingRatio: 0.12,
  minAbsolutePadding: 1,
};

export const buildPaddedDomain = (
  values: readonly (number | null | undefined)[],
  options?: DomainOptions
): Domain | null => {
  const { paddingRatio, minAbsolutePadding } = {
    ...defaultOptions,
    ...options,
  };

  const finiteValues = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value)
  );

  if (finiteValues.length === 0) {
    return null;
  }

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const span = max - min;

  if (span === 0) {
    const zeroSpanPadding = Math.max(
      Math.abs(max) * paddingRatio,
      minAbsolutePadding
    );
    return [min - zeroSpanPadding, max + zeroSpanPadding];
  }

  const padding = Math.max(span * paddingRatio, minAbsolutePadding);
  return [min - padding, max + padding];
};
