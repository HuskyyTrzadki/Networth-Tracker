export type Domain = readonly [number, number];

type DomainOptions = Readonly<{
  paddingRatio?: number;
  minAbsolutePadding?: number;
  includeZero?: boolean;
}>;

const defaultOptions: Required<DomainOptions> = {
  paddingRatio: 0.12,
  minAbsolutePadding: 1,
  includeZero: false,
};

export const buildPaddedDomain = (
  values: readonly (number | null | undefined)[],
  options?: DomainOptions
): Domain | null => {
  const { paddingRatio, minAbsolutePadding, includeZero } = {
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
    const flatDomain: Domain = [min - zeroSpanPadding, max + zeroSpanPadding];
    if (!includeZero) {
      return flatDomain;
    }

    return [Math.min(flatDomain[0], 0), Math.max(flatDomain[1], 0)];
  }

  const padding = Math.max(span * paddingRatio, minAbsolutePadding);
  const paddedDomain: Domain = [min - padding, max + padding];
  if (!includeZero) {
    return paddedDomain;
  }

  return [Math.min(paddedDomain[0], 0), Math.max(paddedDomain[1], 0)];
};
