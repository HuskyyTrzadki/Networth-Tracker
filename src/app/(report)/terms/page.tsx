import type { Metadata } from "next";

import { LegalDocument } from "@/features/common/components/LegalDocument";

export const metadata: Metadata = {
  title: "Regulamin",
};

const sections = [
  {
    title: "Zakres serwisu",
    paragraphs: [
      "Portfolio Tracker pozwala monitorować portfel, przeglądać raporty spółek i prowadzić historię transakcji. Serwis pokazuje dane informacyjne i edukacyjne, a nie rekomendacje inwestycyjne.",
      "Notowania i część danych rynkowych mogą być opóźnione. Przed podjęciem decyzji inwestycyjnej użytkownik powinien samodzielnie potwierdzić kluczowe informacje w źródłach transakcyjnych lub u brokera.",
    ],
  },
  {
    title: "Konto i korzystanie",
    paragraphs: [
      "Użytkownik odpowiada za poprawność danych wpisanych do portfela, w tym transakcji, kursów ręcznych i opisów własnych aktywów. Login i hasło powinny być chronione tak samo jak dostęp do rachunku maklerskiego.",
      "Korzystanie z serwisu w sposób nadużywający, automatyzujący lub zakłócający działanie aplikacji może skutkować ograniczeniem dostępu, szczególnie w trakcie trwania bety produktu.",
    ],
  },
  {
    title: "Tryb gościa i dane demonstracyjne",
    paragraphs: [
      "Tryb gościa i portfel demonstracyjny służą do testowania produktu. Dane w tych trybach mogą zostać usunięte po dłuższym okresie braku aktywności lub po zmianach technicznych związanych z rozwojem produktu.",
      "Portfel demonstracyjny zawiera dane poglądowe. Nie należy traktować go jako historii rzeczywistego rachunku ani materiału doradczego.",
    ],
  },
  {
    title: "Zmiany i dostępność",
    paragraphs: [
      "Serwis rozwija się iteracyjnie. Funkcje, układ stron, zakres danych i zasady działania mogą się zmieniać wraz z kolejnymi wersjami produktu.",
      "Ta wersja regulaminu opisuje aktualną betę aplikacji i ma charakter operacyjny. Przed publicznym uruchomieniem zostanie zastąpiona pełną wersją prawną.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Informacje prawne"
      title="Regulamin korzystania z Portfolio Tracker"
      summary="Najważniejsze zasady korzystania z aplikacji w obecnej wersji beta: co pokazuje produkt, za co odpowiada użytkownik i jak traktować dane demonstracyjne."
      updatedAt="14 marca 2026"
      note="Wersja robocza dla aktualnej bety produktu."
      sections={sections}
    />
  );
}
