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
  subtitle:
    "Kompleksowe spojrzenie na ewolucje finansowa i kierunek strategiczny spolki w perspektywie ostatnich pieciu lat.",
  sections: [
    {
      title: "Podsumowanie zarzadcze",
      subsections: [
        {
          title: "Mocne strony",
          body:
            "Spolka laczy przyspieszajacy wzrost przychodow z poprawa marz, silna generacja gotowki i nadal solidnym bilansem. Glowny biznes ma ogromny zasieg i powtarzalny popyt, a kompetencje w obszarze AI oraz infrastruktura tworza realne bariery wejscia. Dywersyfikacja strumieni przychodow, wysoka rentownosc i kultura R&D stawiaja firme w dobrej pozycji do dalszego ksztaltowania kluczowych segmentow gospodarki cyfrowej.",
        },
        {
          title: "Ryzyka",
          body:
            "Najwieksze ryzyka to rosnaca konkurencja w AI i chmurze, potencjalna zmiana modelu wyszukiwania i reklam oraz nasilona presja regulacyjna. Wyrazny wzrost nakladow inwestycyjnych i wykorzystania dlugu, przy wysokich kosztach R&D i overhead, podnosi stawke realizacji: jesli tempo wzrostu spadnie lub zwrot z tych inwestycji bedzie nizszy od oczekiwan, marze i wolne przeplywy pieniezne moga znalezc sie pod presja. Istnieje tez ryzyko zmiany zachowan uzytkownikow w kierunku agentow AI, social discovery lub zamknietych ekosystemow.",
        },
        {
          title: "Perspektywy",
          body:
            "Na bazie dostepnych danych spolka wchodzi w kolejna faze z pozycji sily, ale w trudniejszym otoczeniu niz w poprzedniej dekadzie. Wysokie inwestycje w AI, chmure i infrastrukture sugeruja podejscie ofensywne. Jesli uda sie dostosowac kluczowe produkty do swiata AI-first, skalowac chmure z rentownoscia oraz przeksztalcac dlugoterminowe projekty w realne biznesy, perspektywa pozostaje atrakcyjna. Sciezka moze byc jednak bardziej zmienna, a decyzje regulacyjne i ruchy konkurencji beda mialy wiekszy wplyw niz wczesniej.",
        },
      ],
    },
    {
      title: "Trendy w rachunku wynikow",
      subsections: [
        {
          title: "Kluczowe wnioski",
          body:
            "Rachunek wynikow pokazuje firme w dobrej formie: przychody rosna, marze sie poprawiaja, a zysk na akcje rośnie szybciej niz sprzedaz. Pozytywne motywy to skala, pricing power w core oraz inwestycje w innowacje. Najwazniejszy watchpoint to szybki wzrost kosztow operacyjnych (R&D i koszty ogolne), ktore musza dostarczac mierzalny zwrot. Trendy sa ogolnie korzystne, ale dyscyplina kosztowa bedzie coraz wazniejsza.",
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
            "Bilans pozostaje istotnym atutem: rosnacy kapital wlasny, solidna plynnosc i wysoki poziom retained earnings wspieraja dzialalnosc i inwestycje. Zmienna, ktora warto monitorowac, jest podejscie do zadluzenia: wieksze wykorzystanie dlugu zwieksza elastycznosc, ale podnosi ryzyko lewarowania.",
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
            "Cash flow jest kluczowa przewaga: wysoka gotowka z dzialalnosci operacyjnej oraz znaczny wolny przeplyw po inwestycjach. Wprowadzenie dywidendy obok skupu akcji bywa sygnalem wiary w stabilnosc przeplywow. Trade-off to rosnacy capex i czasem wieksze wykorzystanie dlugu, co zwieksza wage decyzji alokacyjnych.",
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
            "Pozycja konkurencyjna opiera sie na skali, danych, marce i integracji produktowej. Otoczenie jest jednak bardziej konkurencyjne i bardziej ograniczone regulacyjnie. Kluczowe bedzie, czy spolka potrafi adaptowac core produkty do swiata AI-first, broniac marz.",
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
            "Wysokie naklady na R&D to strategiczny wybor: wydatki dzis maja zabezpieczyc przewage w kolejnej dekadzie. AI jest w centrum inicjatyw, a chmura i infrastruktura sa fundamentem. To wzmacnia moat, ale podnosi koszty i wymagania wykonawcze.",
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
