import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CreatePortfolioDialog } from "./CreatePortfolioDialog";

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
    expect(screen.getAllByText("Nowy portfel")[0]).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nazwa portfela"), "Test");
    await user.click(
      screen.getByRole("button", { name: "Utwórz portfel" })
    );

    expect(createPortfolioFn).toHaveBeenCalledWith({
      name: "Test",
      baseCurrency: "PLN",
    });
    expect(onCreated).toHaveBeenCalledWith("new-id");
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
    await user.type(screen.getByLabelText("Nazwa portfela"), "Test");
    await user.click(
      screen.getByRole("button", { name: "Utwórz portfel" })
    );

    expect(await screen.findByText("Błąd")).toBeInTheDocument();
  });
});
