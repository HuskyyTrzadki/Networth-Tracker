import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ComponentPropsWithoutRef,
  PropsWithChildren,
  ReactNode,
} from "react";
import { startTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AppSidebar,
  reduceOptimisticHiddenPortfolioIds,
} from "./AppSidebar";

const { replaceMock, pushMock, prefetchMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
  prefetchMock: vi.fn(),
}));
const pathnameState = vi.hoisted(() => ({
  value: "/portfolio",
}));

type MockLinkProps = ComponentPropsWithoutRef<"a"> & {
  href: string;
  prefetch?: boolean;
  scroll?: boolean;
};

type WrapperProps = PropsWithChildren<Record<string, unknown>>;

function createWrapper(Tag: "aside" | "div" | "section") {
  return function Wrapper({ children, ...props }: WrapperProps) {
    const {
      asChild,
      isActive,
      collapsible,
      showOnHover,
      ...domProps
    } = props as WrapperProps & {
      asChild?: boolean;
      collapsible?: string;
      isActive?: boolean;
      showOnHover?: boolean;
    };
    void asChild;
    void collapsible;
    void isActive;
    void showOnHover;

    return <Tag {...domProps}>{children}</Tag>;
  };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
    prefetch: prefetchMock,
  }),
}));

vi.mock("next/link", () => ({
  default: (props: MockLinkProps) => {
    const { href, children, prefetch, scroll, ...rest } = props;
    void prefetch;
    void scroll;

    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
  useLinkStatus: () => ({ pending: false }),
}));

vi.mock("../hooks/useAppPathname", () => ({
  useAppPathname: () => pathnameState.value,
}));

vi.mock("@/features/design-system/components/ui/sidebar", () => ({
  Sidebar: createWrapper("aside"),
  SidebarContent: createWrapper("div"),
  SidebarFooter: createWrapper("div"),
  SidebarGroup: createWrapper("section"),
  SidebarGroupContent: createWrapper("div"),
  SidebarGroupLabel: createWrapper("div"),
  SidebarHeader: createWrapper("div"),
  SidebarMenu: createWrapper("div"),
  SidebarMenuButton: createWrapper("div"),
  SidebarMenuItem: createWrapper("div"),
  SidebarMenuSub: createWrapper("div"),
  SidebarMenuSubItem: createWrapper("div"),
}));

vi.mock("@/features/portfolio/components/CreatePortfolioDialog", () => ({
  CreatePortfolioDialog: ({
    trigger,
  }: {
    trigger: (controls: { open: () => void; disabled: boolean }) => ReactNode;
  }) => <>{trigger({ open: vi.fn(), disabled: false })}</>,
}));

vi.mock("@/features/portfolio/components/DemoPortfolioBadge", () => ({
  DemoPortfolioBadge: ({ className }: { className?: string }) => (
    <span className={className}>DEMO</span>
  ),
}));

vi.mock("./ThemeSwitch", () => ({
  ThemeSwitch: () => <div>Theme switch</div>,
}));

vi.mock("./PortfolioSidebarItem", () => ({
  PortfolioSidebarItem: ({
    isActive,
    onDeleteOptimistic,
    portfolio,
  }: {
    isActive: boolean;
    onDeleteOptimistic: (portfolioId: string) => void;
    portfolio: { id: string; name: string };
  }) => (
    <div data-active={String(isActive)} data-testid={`portfolio-${portfolio.id}`}>
      <span>{portfolio.name}</span>
      <button
        onClick={() => {
          startTransition(() => {
            onDeleteOptimistic(portfolio.id);
          });
        }}
        type="button"
      >
        Hide {portfolio.name}
      </button>
    </div>
  ),
}));

const portfolios = [
  {
    id: "portfolio-alpha",
    name: "Alpha",
    baseCurrency: "PLN",
    isDemo: false,
  },
  {
    id: "portfolio-beta",
    name: "Beta",
    baseCurrency: "USD",
    isDemo: false,
  },
] as const;

describe("reduceOptimisticHiddenPortfolioIds", () => {
  it("hides and restores portfolio ids", () => {
    const hidden = reduceOptimisticHiddenPortfolioIds(new Set<string>(), {
      type: "hide",
      portfolioId: "portfolio-alpha",
    });
    expect(hidden.has("portfolio-alpha")).toBe(true);

    const restored = reduceOptimisticHiddenPortfolioIds(hidden, {
      type: "show",
      portfolioId: "portfolio-alpha",
    });
    expect(restored.has("portfolio-alpha")).toBe(false);
  });
});

describe("AppSidebar", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    prefetchMock.mockReset();
    pathnameState.value = "/portfolio";
  });

  it("does not navigate away when deleting an inactive portfolio", async () => {
    const user = userEvent.setup();

    render(<AppSidebar portfolios={portfolios} />);

    await user.click(screen.getByRole("button", { name: "Hide Beta" }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(prefetchMock).not.toHaveBeenCalledWith("/portfolio");
  });

  it("navigates to overview immediately when deleting the active portfolio", async () => {
    pathnameState.value = "/portfolio/portfolio-alpha";
    const user = userEvent.setup();

    render(<AppSidebar portfolios={portfolios} />);

    await user.click(screen.getByRole("button", { name: "Hide Alpha" }));

    expect(prefetchMock).toHaveBeenCalledWith("/portfolio");
    expect(replaceMock).toHaveBeenCalledWith("/portfolio", { scroll: false });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
