export type TrendAnalysisSubsection = Readonly<{
  title: string;
  body: string;
}>;

export type TrendAnalysisSection = Readonly<{
  title: string;
  description?: string;
  subsections: readonly TrendAnalysisSubsection[];
}>;

export type FiveYearTrendAnalysis = Readonly<{
  title: string;
  subtitle: string;
  sections: readonly TrendAnalysisSection[];
}>;

export const FIVE_YEAR_TREND_ANALYSIS: FiveYearTrendAnalysis = {
  title: "Analiza trendu 5-letniego",
  subtitle: "Jak wyglada caly cykl, a nie tylko ostatni raport.",
  sections: [
    {
      title: "Podsumowanie zarzadcze",
      subsections: [
        {
          title: "Mocne strony",
          body:
            "W dluzszym okresie spolka pokazuje to, co inwestor lubi najbardziej: wzrost przychodow, mocne marze i wysoka generacje gotowki. Core biznes pozostaje bardzo silny, a skala i infrastruktura dalej buduja przewage.",
        },
        {
          title: "Ryzyka",
          body:
            "Najwieksze ryzyko nie lezy w jednym slabszym kwartale, tylko w tym, ze rosnace inwestycje nie zwroca sie wystarczajaco szybko. Dochodzi do tego presja konkurencyjna i regulacyjna, ktora moze podnosic koszt utrzymania przewagi.",
        },
        {
          title: "Perspektywy",
          body:
            "Spolka wchodzi w kolejna faze z pozycji sily, ale poprzeczka jest wyzej niz kilka lat temu. Jesli nowe inwestycje zaczna donosic realny wzrost i monetyzacje, perspektywa zostaje dobra. Jesli nie, rynek szybko zrobi sie mniej cierpliwy.",
        },
      ],
    },
    {
      title: "Trendy w rachunku wynikow",
      subsections: [
        {
          title: "Kluczowe wnioski",
          body:
            "Rachunek wynikow dalej pracuje na korzysc tezy: przychody rosna, marze sa mocne, a EPS potrafi rosnac szybciej niz sprzedaz. Watchpoint pozostaje ten sam: koszty musza dawac realny zwrot.",
        },
        {
          title: "Przychody",
          body:
            "Przychody rosna stabilnie w horyzoncie kilku lat, a w ostatnich latach dynamika moze przyspieszac. To sugeruje, ze spolka nadal rozwija core oraz skutecznie skaluje nowsze strumienie przychodow. Top line wyglada na odporny i nadal w fazie wzrostu.",
        },
        {
          title: "Rentownosc",
          body:
            "Rentownosc przesuwa sie w dobrym kierunku: marze brutto i netto moga stopniowo sie rozszerzac wraz ze skala i optymalizacja kosztow. EPS potrafi rosnac szybciej niz zysk, m.in. dzieki skupowi akcji. Najmocniejsze skoki w bottom line czesto wynikaja z polaczenia leverage operacyjnego oraz zdarzen nieoperacyjnych.",
        },
        {
          title: "Efektywnosc operacyjna",
          body:
            "Wskazniki operacyjne (np. marza operacyjna, EBITDA) moga poprawiac sie wraz ze skala. Jednoczesnie wzrost wydatkow na R&D i koszty ogolne odzwierciedla inwestycje w kluczowe inicjatywy. Ryzyko: przy slabszym wzroscie przychodow szybko rosnace koszty moga sciskac marze.",
        },
      ],
    },
    {
      title: "Kondycja bilansu",
      subsections: [
        {
          title: "Kluczowe wnioski",
          body:
            "Bilans zostaje atutem, ale warto pilnowac kierunku lewaru. Sama skala aktywow nie wystarczy, jesli koszt finansowania i capex zaczna rosnac szybciej niz operacyjna sila biznesu.",
        },
        {
          title: "Plynnosc",
          body:
            "Pomimo potencjalnie wyzszego dlugu, plynnosc moze pozostawac mocna: gotowka i aktywa krotkoterminowe pokrywaja biezace potrzeby, co daje bufor na inwestycje i szoki rynkowe.",
        },
        {
          title: "Jakosc aktywow",
          body:
            "Wzrost aktywow czesto wynika z inwestycji w infrastrukture i zdolnosci produkcyjne (np. data centers), a nie tylko z pozycji ksiegowych. Udzial goodwill i intangibles jest istotny, ale zwykle nie dominuje w calosci aktywow, co ogranicza ryzyko znaczacych odpisow.",
        },
        {
          title: "Zadluzenie",
          body:
            "Najwieksza zmiana w bilansie bywa wzrost dlugu oraz przejscie w kierunku wiekszego wykorzystania finansowania zewnetrznego. Nawet przy wzroscie lewarowania, profil moze pozostac zarzadzalny przy odpowiednio silnej rentownosci i cash generation, ale trend warto stale monitorowac.",
        },
      ],
    },
    {
      title: "Analiza przeplywow pienieznych",
      subsections: [
        {
          title: "Kluczowe wnioski",
          body:
            "Cash flow jest tu glownym dowodem jakosci. Dopoki gotowka rosnie mimo wysokiego capex, teza pozostaje mocna. Problem zacznie sie wtedy, gdy inwestycje beda rosnac szybciej niz zdolnosc do ich finansowania.",
        },
        {
          title: "Gotowka operacyjna",
          body:
            "Gotowka z dzialalnosci operacyjnej jest zwykle wysoka i rosnie wraz z rentownoscia oraz poprawa working capital. To sygnal, ze zysk jest wspierany realna gotowka, a nie tylko ksiegowoscia.",
        },
        {
          title: "Wolny przeplyw (FCF)",
          body:
            "FCF pozostaje mocny w wartosci bezwzglednej, nawet przy wzroscie nakladow. W okresach intensywnej rozbudowy infrastruktury tempo wzrostu FCF moze zwalniac, bo inwestycje kompensuja wzrost CFO. Klucz: czy przyszly wzrost przychodow i marz nadaza za capex.",
        },
        {
          title: "Inwestycje",
          body:
            "Inwestycje wskazuja na faze intensywnego build-out. Skoki capex zwykle sygnalizuja strategiczny zaklad o przyszly popyt, ale podnosza poprzeczke oczekiwanych zwrotow. Poza capex pojawiaja sie tez przejecia i projekty dlugoterminowe.",
        },
      ],
    },
    {
      title: "Pozycja konkurencyjna",
      subsections: [
        {
          title: "Kluczowe wnioski",
          body:
            "Skala i ekosystem dalej daja przewage, ale rynek nie jest juz tak latwy jak dawniej. Kluczowe bedzie to, czy firma obroni marze i pozycje w swiecie bardziej AI-first niz feed-first.",
        },
        {
          title: "Pozycja rynkowa",
          body:
            "Spolka moze miec dominujaca pozycje w kluczowych segmentach oraz znacacy udzial w szybko rosnacych kategoriach. Platformy o globalnym zasiegu daja dystrybucje i przewage w wdrazaniu nowych funkcji.",
        },
        {
          title: "Przewagi konkurencyjne",
          body:
            "Przewagi wynikaja z efektow sieciowych, skali danych i infrastruktury. Integracja warstw (hardware, data centers, software, produkty) pozwala wdrazac innowacje szybko i globalnie. Dodatkowo ekosystem (np. przegladarka, system operacyjny, narzedzia produktywnosci) wzmacnia stickiness.",
        },
        {
          title: "Zagrozenia",
          body:
            "Najwieksze zagrozenia to konkurencja w AI, zmiana zachowan uzytkownikow, presja na attention w mediach oraz decyzje regulatorow. Ryzyko strukturalne: nowe interfejsy (asystenci, agenci) moga przeniesc discovery poza tradycyjne kanaly.",
        },
      ],
    },
    {
      title: "Innowacje i badania oraz rozwoj",
      subsections: [
        {
          title: "Kluczowe wnioski",
          body:
            "Wysokie R&D ma sens tylko wtedy, gdy zamienia sie w wyzsza monetyzacje, mocniejszy produkt albo nizszy koszt przewagi. To wzmacnia moat, ale podnosi koszt pomylki.",
        },
        {
          title: "Biezace inicjatywy",
          body:
            "Priorytetem jest AI oraz jej integracja w produktach, wraz z inwestycjami w infrastrukture obliczeniowa. Rownolegle rozwijane sa narzedzia dla klientow enterprise oraz projekty dlugoterminowe, ktore moga otwierac nowe rynki.",
        },
        {
          title: "Pipeline",
          body:
            "Kolejne kroki to glebsza integracja AI w kluczowych produktach, narzedzia produktywnosci i ekosystem urzadzen. W enterprise rosnac moze rola platformy pod aplikacje AI. Projekty wysokiego ryzyka pozostaja opcja na nowe linie biznesowe, ale z niepewnym timingiem.",
        },
        {
          title: "Moat innowacji",
          body:
            "Innowacje wzmacniaja moat poprzez lepsze doswiadczenia, stickiness ekosystemu i przewage technologiczna. Ryzyko: komodytyzacja modeli AI lub presja open-source moze zwiekszac konkurencje, ale skala i infrastruktura nadal sa przewaga.",
        },
      ],
    },
  ],
};
