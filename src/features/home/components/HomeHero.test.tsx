import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeHero } from "./HomeHero";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe("HomeHero", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts a guest session and redirects", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => ({ ok: true }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<HomeHero />);

    await user.click(
      screen.getByRole("button", { name: "Wypróbuj jako gość" })
    );

    expect(fetch).toHaveBeenCalledWith("/api/auth/anonymous", { method: "POST" });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/search");
    });
  });

  it("shows an error notice when guest session fails", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => ({ ok: false }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<HomeHero />);

    await user.click(
      screen.getByRole("button", { name: "Wypróbuj jako gość" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się uruchomić sesji gościa. Spróbuj ponownie."
    );
  });
});
