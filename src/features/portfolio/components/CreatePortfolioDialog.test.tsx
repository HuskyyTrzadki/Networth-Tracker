import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CreatePortfolioDialog } from "./CreatePortfolioDialog";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in window)) {
  // Radix Select/Switch use ResizeObserver in jsdom tests.
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
    ResizeObserverMock;
}

describe("CreatePortfolioDialog", () => {
  it("opens and submits successfully", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const createPortfolioFn = vi.fn().mockResolvedValue({ id: "new-id" });

    render(
      <CreatePortfolioDialog
        onCreated={onCreated}
        createPortfolioFn={createPortfolioFn}
        trigger={({ open }) => (
          <button type="button" onClick={open}>
            Open
          </button>
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Nowy portfel")).toBeInTheDocument();

    await user.type(await screen.findByLabelText("Nazwa portfela"), "Test");
    await user.click(
      screen.getByRole("button", { name: "Utwórz portfel" })
    );

    expect(createPortfolioFn).toHaveBeenCalledWith({
      name: "Test",
      baseCurrency: "PLN",
      isTaxAdvantaged: false,
    });
    expect(onCreated).toHaveBeenCalledWith("new-id");
  });

  it("submits with tax-advantaged flag when toggled", async () => {
    const user = userEvent.setup();
    const createPortfolioFn = vi.fn().mockResolvedValue({ id: "new-id" });

    render(
      <CreatePortfolioDialog
        onCreated={vi.fn()}
        createPortfolioFn={createPortfolioFn}
        trigger={({ open }) => (
          <button type="button" onClick={open}>
            Open
          </button>
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.type(await screen.findByLabelText("Nazwa portfela"), "IKE");
    await user.click(
      screen.getByRole("switch", { name: "Konto emerytalne IKE lub IKZE" })
    );
    await user.click(screen.getByRole("button", { name: "Utwórz portfel" }));

    expect(createPortfolioFn).toHaveBeenCalledWith({
      name: "IKE",
      baseCurrency: "PLN",
      isTaxAdvantaged: true,
    });
  });

  it("shows an error when creation fails", async () => {
    const user = userEvent.setup();
    const createPortfolioFn = vi
      .fn()
      .mockRejectedValue(new Error("Błąd"));

    render(
      <CreatePortfolioDialog
        onCreated={vi.fn()}
        createPortfolioFn={createPortfolioFn}
        trigger={({ open }) => (
          <button type="button" onClick={open}>
            Open
          </button>
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.type(await screen.findByLabelText("Nazwa portfela"), "Test");
    await user.click(
      screen.getByRole("button", { name: "Utwórz portfel" })
    );

    expect(await screen.findByText("Błąd")).toBeInTheDocument();
  });
});
