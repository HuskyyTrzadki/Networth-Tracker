import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeHero } from "./HomeHero";

const replaceMock = vi.fn();

const useLocaleMock = vi.fn(() => "pl");
const useTranslationsMock = vi.fn((namespace?: string) => {
  return (key: string) => (namespace ? `${namespace}.${key}` : key);
});

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => useLocaleMock(),
  useTranslations: (namespace?: string) => useTranslationsMock(namespace),
}));

describe("HomeHero", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    useLocaleMock.mockReset();
    useTranslationsMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts a guest session and redirects (pl)", async () => {
    useLocaleMock.mockReturnValue("pl");
    const fetchMock = vi.fn<typeof fetch>(async () => ({ ok: true }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<HomeHero />);

    await user.click(
      screen.getByRole("button", { name: "HomePage.cta.guest" })
    );

    expect(fetch).toHaveBeenCalledWith("/api/auth/anonymous", { method: "POST" });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/search", { locale: "pl" });
    });
  });

  it("redirects to the locale-prefixed search (en)", async () => {
    useLocaleMock.mockReturnValue("en");
    const fetchMock = vi.fn<typeof fetch>(async () => ({ ok: true }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<HomeHero />);

    await user.click(
      screen.getByRole("button", { name: "HomePage.cta.guest" })
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/search", { locale: "en" });
    });
  });

  it("shows an error notice when guest session fails", async () => {
    useLocaleMock.mockReturnValue("pl");
    const fetchMock = vi.fn<typeof fetch>(async () => ({ ok: false }) as Response);
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<HomeHero />);

    await user.click(
      screen.getByRole("button", { name: "HomePage.cta.guest" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "HomePage.cta.error"
    );
  });
});
