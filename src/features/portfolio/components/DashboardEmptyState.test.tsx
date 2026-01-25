import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardEmptyState } from "./DashboardEmptyState";

const defaultProps = {
  title: "Twój portfel jest pusty.",
  subtitle: "Dodaj swoje pierwsze aktywo, aby zobaczyć analizę.",
  primaryAction: {
    label: "Dodaj transakcję",
    href: "/transactions/new",
  },
  secondaryAction: {
    label: "Importuj CSV",
    href: "/transactions/new?import=csv",
  },
};

describe("DashboardEmptyState", () => {
  it("renders the empty state content and actions", () => {
    render(<DashboardEmptyState {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.subtitle)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: defaultProps.primaryAction.label })
    ).toHaveAttribute("href", defaultProps.primaryAction.href);
    expect(
      screen.getByRole("link", { name: defaultProps.secondaryAction.label })
    ).toHaveAttribute("href", defaultProps.secondaryAction.href);
  });
});
