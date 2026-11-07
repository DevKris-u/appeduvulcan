# EduVulcan Mobile

Nieoficjalny klient mobilny dla polskiego dziennika elektronicznego **EDU Vulcan** (`uczen.eduvulcan.pl`, `wiadomosci.eduvulcan.pl`).

## Co robi aplikacja

- Logowanie do konta Ucznia Vulcan (przez scraping strony logowania, bo Vulcan nie udostępnia oficjalnego API).
- Pulpit: szczęśliwy numer, dzisiejszy plan lekcji, nadchodzące sprawdziany, frekwencja.
- Plan zajęć: tygodniowy podział na dni z detalami lekcji (nauczyciel, sala, zmiany, odwołania).
- Oceny: okresy klasyfikacyjne, przedmioty, średnie, szczegóły wpisów z wagami i datami.
- Wiadomości: lista odbiorcza, czytanie treści wiadomości, oznaczenie jako przeczytane.

## Stack

- React Native 0.76 + Expo SDK ~52
- React 18.3, TypeScript (`strict`)
- Zustand — stan globalny
- Axios — warstwa API
- react-native-paper (MD3) — UI
- react-navigation — nawigacja (bottom tabs + stack)
- react-native-safe-area-context, react-native-screens

## Uruchomienie lokalnie

```bash
npm install
npx expo start
```

Aplikację można przetestować na telefonie w **Expo Go** (skanowanie kodu QR z terminala) lub na emulatorze Android (`npx expo run:android`).

## Uwagi dotyczące uwierzytelniania

Vulcan nie udostępnia oficjalnego API publicznego. Logowanie odbywa się przez pobranie strony logowania, wyciągnięcie tokena CSRF, wysłanie poświadczeń i przejście łańcucha przekierowań SSO. Każda zmiana w serwisie `eduvulcan.pl` może przerwać logowanie — wtedy konieczna jest aktualizacja kodu w `src/api/VulcanLoginHelper.pl`.

## Struktura

```
src/
  api/
    VulcanLoginHelper.ts   # logowanie + SSO, wyciąganie kontekstu
    VulcanRepository.ts    # wywołania API do Vulcan (oceny, plan, wiadomości, …)
  models/
    VulcanModels.ts        # interfejsy TS (wymagają uszczelnienia)
  screens/
    LoginScreen.tsx
    DashboardScreen.tsx
    TimetableScreen.tsx
    GradesScreen.tsx
    MessagesScreen.tsx
  state/
    useVulcanStore.ts      # Zustand: stan globalny + akcje
```

## Plany rozwoju (bliższe)

1. Utrwalenie sesji (`expo-secure-store` / `async-storage`) — brak ponownego logowania po zamknięciu aplikacji.
2. Silniejsze typowanie i walidacja odpowiedzi API (`zod`).
3. Obsługa sieci (timeout, retry, wykrywanie offline).
4. Poprawa strefy czasowej w planie zajęć (czas lokalny, nie UTC).
5. Testy jednostkowe i CI.

## Licencja

Projekt nieoficjalny, nie affiliated z firmą Vulcan. Używaj na własną odpowiedzialność.
