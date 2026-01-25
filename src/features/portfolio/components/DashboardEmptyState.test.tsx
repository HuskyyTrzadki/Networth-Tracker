import { render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { DashboardEmptyState } from "./DashboardEmptyState";

type MockLinkProps = ComponentPropsWithoutRef<"a"> & {
  href: string;
  scroll?: boolean;
};

vi.mock("next/link", () => ({
  default: (props: MockLinkProps) => {
    const { href, children, scroll, ...rest } = props;
    void scroll;

    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

const defaultProps = {
  title: "Twój portfel jest pusty.",
  subtitle: "Dodaj swoje pierwsze aktywo, aby zobaczyć analizę.",
  primaryAction: {
    label: "Dodaj transakcję",
    href: "/transactions/new",
  },
  secondaryAction: {
    label: "Importuj CSV",
    href: "/transactions/import",
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
