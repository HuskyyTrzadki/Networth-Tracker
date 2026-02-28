export type GuestUpgradeNudgeStep = 5 | 15;

export type GuestUpgradeBanner = Readonly<{
  step: GuestUpgradeNudgeStep;
  transactionCount: number;
  title: string;
  description: string;
}>;

type ResolveInput = Readonly<{
  transactionCount: number;
  dismissedStep5At: string | null;
  dismissedStep15At: string | null;
}>;

export function resolveGuestUpgradeBanner({
  transactionCount,
  dismissedStep5At,
  dismissedStep15At,
}: ResolveInput): GuestUpgradeBanner | null {
  if (dismissedStep15At) {
    return null;
  }

  if (transactionCount > 15 && !dismissedStep15At) {
    return {
      step: 15,
      transactionCount,
      title: "To konto jest nadal tymczasowe",
      description:
        "Masz juz sporo zapisanej historii. Dodaj e-mail lub Google, aby zachowac portfel na stale.",
    };
  }

  if (transactionCount > 5 && !dismissedStep5At) {
    return {
      step: 5,
      transactionCount,
      title: "Warto zapisac ten portfel na stale",
      description:
        "Masz juz pierwsze transakcje. Uaktualnij konto teraz, aby nie stracic dotychczasowych postepow.",
    };
  }

  return null;
}
