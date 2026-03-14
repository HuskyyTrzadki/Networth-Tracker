import type { Metadata } from "next";

import { LegalDocument } from "@/features/common/components/LegalDocument";

export const metadata: Metadata = {
  title: "Prywatność",
};

const sections = [
  {
    title: "Jakie dane zapisujemy",
    paragraphs: [
      "W zależności od sposobu korzystania z aplikacji zapisujemy dane konta potrzebne do logowania, ustawienia profilu, informacje o portfelach i transakcjach oraz podstawowe dane techniczne potrzebne do utrzymania bezpieczeństwa i stabilności serwisu.",
      "Jeżeli użytkownik korzysta z trybu gościa, aplikacja nadal może zapisać niezbędne identyfikatory techniczne i dane portfela, aby utrzymać sesję i pokazać historię działań.",
    ],
  },
  {
    title: "Po co przetwarzamy dane",
    paragraphs: [
      "Dane służą do uwierzytelnienia użytkownika, wyświetlania portfeli, prowadzenia historii transakcji, budowania widoków raportowych oraz diagnozowania błędów i nadużyć.",
      "Nie używamy danych portfelowych do generowania reklam ani do sprzedaży zewnętrznym podmiotom. Dane są wykorzystywane operacyjnie, aby aplikacja działała poprawnie.",
    ],
  },
  {
    title: "Podmioty i usługi zewnętrzne",
    paragraphs: [
      "Do działania produktu korzystamy z usług infrastrukturalnych i rynkowych, w szczególności z Supabase do warstwy danych i logowania, z Google OAuth przy logowaniu kontem Google oraz z dostawców danych rynkowych potrzebnych do notowań i raportów.",
      "Zakres danych przekazywanych do tych usług jest ograniczony do tego, co jest potrzebne do działania konkretnej funkcji.",
    ],
  },
  {
    title: "Sesja, pamięć lokalna i retencja",
    paragraphs: [
      "Aplikacja używa mechanizmów sesyjnych potrzebnych do logowania oraz pamięci lokalnej przeglądarki do ustawień interfejsu, takich jak wybór motywu. Dane gościa i demo mogą zostać usunięte po dłuższym okresie braku aktywności.",
      "Wersja beta może okresowo czyścić dane testowe lub techniczne, jeśli jest to konieczne do utrzymania jakości produktu.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Informacje prawne"
      title="Polityka prywatności Portfolio Tracker"
      summary="Skrócone wyjaśnienie, jakie dane zapisuje aplikacja, po co są potrzebne i jak wygląda to w obecnej wersji beta produktu."
      updatedAt="14 marca 2026"
      note="Wersja robocza dla aktualnej bety produktu."
      sections={sections}
    />
  );
}
