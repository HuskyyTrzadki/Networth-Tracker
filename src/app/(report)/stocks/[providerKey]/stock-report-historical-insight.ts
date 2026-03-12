import type {
  HistoricalInsightDataset,
  HistoricalInsightFrequency,
  HistoricalInsightWidget,
  InsightChartPoint,
  InsightWidgetPeriod,
} from "./stock-insights-widget-types";

const PERIOD_YEAR_MAP: Readonly<Record<Exclude<InsightWidgetPeriod, "ALL">, number>> = {
  "1Y": 1,
  "2Y": 2,
  "3Y": 3,
  "5Y": 5,
  "10Y": 10,
};

const FREQUENCY_RANK: Readonly<Record<HistoricalInsightFrequency, number>> = {
  daily: 3,
  quarterly: 2,
  annual: 1,
};

const DAY_RANGE_GRACE_DAYS = 14;

const parseIsoDate = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(normalized.getTime()) ? null : normalized;
};

const getDatasetByFrequency = (
  widget: HistoricalInsightWidget,
  frequency: HistoricalInsightFrequency
) => widget.datasets.find((dataset) => dataset.frequency === frequency) ?? null;

const getNonEmptyDatasets = (widget: HistoricalInsightWidget) =>
  widget.datasets.filter((dataset) => dataset.points.length > 0);

const getRequiredPointsForPeriod = (
  frequency: HistoricalInsightFrequency,
  period: Exclude<InsightWidgetPeriod, "ALL">
) => {
  const years = PERIOD_YEAR_MAP[period];

  if (frequency === "quarterly") {
    return years * 4;
  }

  if (frequency === "annual") {
    return years;
  }

  return 0;
};

const hasDailyCoverageForPeriod = (
  points: readonly InsightChartPoint[],
  period: Exclude<InsightWidgetPeriod, "ALL">
) => {
  const firstDate = parseIsoDate(points[0]?.date);
  const lastDate = parseIsoDate(points[points.length - 1]?.date);

  if (!firstDate || !lastDate) {
    return false;
  }

  const boundary = new Date(lastDate);
  boundary.setUTCFullYear(boundary.getUTCFullYear() - PERIOD_YEAR_MAP[period]);
  boundary.setUTCDate(boundary.getUTCDate() + DAY_RANGE_GRACE_DAYS);

  return firstDate <= boundary;
};

const datasetSupportsPeriod = (
  dataset: HistoricalInsightDataset,
  period: Exclude<InsightWidgetPeriod, "ALL">
) => {
  if (dataset.points.length === 0) {
    return false;
  }

  if (dataset.frequency === "daily") {
    return hasDailyCoverageForPeriod(dataset.points, period);
  }

  return dataset.points.length >= getRequiredPointsForPeriod(dataset.frequency, period);
};

const getDatasetCoverageSpan = (dataset: HistoricalInsightDataset) => {
  const firstDate = parseIsoDate(dataset.points[0]?.date);
  const lastDate = parseIsoDate(dataset.points[dataset.points.length - 1]?.date);

  if (!firstDate || !lastDate) {
    return 0;
  }

  return lastDate.getTime() - firstDate.getTime();
};

const sortDatasetsByCoverageAndResolution = (
  datasets: readonly HistoricalInsightDataset[]
) =>
  [...datasets].sort((left, right) => {
    const coverageDelta = getDatasetCoverageSpan(right) - getDatasetCoverageSpan(left);
    if (coverageDelta !== 0) {
      return coverageDelta;
    }

    return FREQUENCY_RANK[right.frequency] - FREQUENCY_RANK[left.frequency];
  });

const resolveDatasetForPeriod = (
  widget: HistoricalInsightWidget,
  period: InsightWidgetPeriod,
  preferredFrequency?: HistoricalInsightFrequency
) => {
  if (preferredFrequency) {
    return (
      getDatasetByFrequency(widget, preferredFrequency) ??
      getNonEmptyDatasets(widget)[0] ??
      null
    );
  }

  const datasets = getNonEmptyDatasets(widget);

  if (datasets.length === 0) {
    return null;
  }

  if (period === "ALL") {
    if (widget.frequencyMode === "best-available") {
      return [...datasets].sort(
        (left, right) => FREQUENCY_RANK[right.frequency] - FREQUENCY_RANK[left.frequency]
      )[0]!;
    }

    return sortDatasetsByCoverageAndResolution(datasets)[0] ?? null;
  }

  const supportingDatasets = datasets.filter((dataset) =>
    datasetSupportsPeriod(dataset, period)
  );

  if (supportingDatasets.length > 0) {
    return [...supportingDatasets].sort(
      (left, right) => FREQUENCY_RANK[right.frequency] - FREQUENCY_RANK[left.frequency]
    )[0]!;
  }

  return sortDatasetsByCoverageAndResolution(datasets)[0] ?? null;
};

const sliceDailyPointsForPeriod = (
  points: readonly InsightChartPoint[],
  period: Exclude<InsightWidgetPeriod, "ALL">
) => {
  const lastDate = parseIsoDate(points[points.length - 1]?.date);

  if (!lastDate) {
    return points;
  }

  const boundary = new Date(lastDate);
  boundary.setUTCFullYear(boundary.getUTCFullYear() - PERIOD_YEAR_MAP[period]);

  const visiblePoints = points.filter((point) => {
    const pointDate = parseIsoDate(point.date);
    return pointDate ? pointDate >= boundary : false;
  });

  return visiblePoints.length > 0 ? visiblePoints : points;
};

const slicePointsForPeriod = (
  dataset: HistoricalInsightDataset,
  period: InsightWidgetPeriod
) => {
  if (dataset.points.length === 0 || period === "ALL") {
    return dataset.points;
  }

  if (dataset.frequency === "daily") {
    return sliceDailyPointsForPeriod(dataset.points, period);
  }

  const requiredPoints = getRequiredPointsForPeriod(dataset.frequency, period);
  const visiblePoints = dataset.points.slice(-requiredPoints);

  return visiblePoints.length > 0 ? visiblePoints : dataset.points;
};

export function resolveDefaultHistoricalInsightFrequency(
  widget: HistoricalInsightWidget
): HistoricalInsightFrequency {
  return (
    getNonEmptyDatasets(widget)
      .sort((left, right) => FREQUENCY_RANK[right.frequency] - FREQUENCY_RANK[left.frequency])[0]
      ?.frequency ?? "annual"
  );
}

export function getHistoricalInsightAvailablePeriods(
  widget: HistoricalInsightWidget,
  frequency?: HistoricalInsightFrequency
): InsightWidgetPeriod[] {
  const datasets = frequency
    ? [getDatasetByFrequency(widget, frequency)].filter(
        (dataset): dataset is HistoricalInsightDataset =>
          dataset !== null && dataset.points.length > 0
      )
    : getNonEmptyDatasets(widget);

  if (datasets.length === 0) {
    return [];
  }

  const periods = (
    Object.keys(PERIOD_YEAR_MAP) as Exclude<InsightWidgetPeriod, "ALL">[]
  ).filter((period) => datasets.some((dataset) => datasetSupportsPeriod(dataset, period)));

  return [...periods, "ALL"];
}

export function hasHistoricalInsightFrequencyToggle(
  widget: HistoricalInsightWidget
) {
  if (widget.frequencyMode === "best-available") {
    return false;
  }

  return getNonEmptyDatasets(widget).length > 1;
}

export function resolveDefaultHistoricalInsightPeriod(
  widget: HistoricalInsightWidget,
  frequency?: HistoricalInsightFrequency
): InsightWidgetPeriod {
  const defaultFrequency =
    frequency ??
    (widget.frequencyMode === "best-available"
      ? resolveDefaultHistoricalInsightFrequency(widget)
      : undefined);
  const availablePeriods = getHistoricalInsightAvailablePeriods(widget, defaultFrequency);
  const longestBoundedPeriod = [...availablePeriods]
    .reverse()
    .find((period) => period !== "ALL");

  return longestBoundedPeriod ?? availablePeriods[0] ?? "ALL";
}

export function resolveVisibleHistoricalInsightPoints(
  widget: HistoricalInsightWidget,
  frequency: HistoricalInsightFrequency | undefined,
  period: InsightWidgetPeriod
): readonly InsightChartPoint[] {
  const dataset = resolveDatasetForPeriod(widget, period, frequency);

  if (!dataset) {
    return [];
  }

  return slicePointsForPeriod(dataset, period);
}

export function resolveHistoricalInsightFrequencyForPeriod(
  widget: HistoricalInsightWidget,
  period: InsightWidgetPeriod,
  preferredFrequency?: HistoricalInsightFrequency
): HistoricalInsightFrequency | null {
  return resolveDatasetForPeriod(widget, period, preferredFrequency)?.frequency ?? null;
}
