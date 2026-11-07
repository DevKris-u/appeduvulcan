import base64
import datetime
import os
import re
import sys
from urllib.parse import urljoin
import httpx
from bs4 import BeautifulSoup


def parse_verification_token(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    token_input = soup.find("input", {"name": "__RequestVerificationToken"})
    if not token_input or not token_input.get("value"):
        raise ValueError("Nie znaleziono tokenu __RequestVerificationToken w HTML.")
    return token_input["value"]


def handle_sso_post_redirects(client: httpx.Client, response: httpx.Response) -> httpx.Response:
    while True:
        if "wresult" in response.text and "<form" in response.text:
            soup = BeautifulSoup(response.text, "html.parser")
            form = soup.find("form")
            if not form:
                break
            action_url = urljoin(str(response.url), form.get("action"))
            data = {i.get("name"): i.get("value", "") for i in form.find_all("input") if i.get("name")}
            response = client.post(action_url, data=data, follow_redirects=True)
        else:
            break
    return response


def extract_ids_from_key(context_key: str):
    try:
        step1 = base64.b64decode(context_key).decode("utf-8")
        step2 = base64.b64decode(step1).decode("utf-8")
        parts = step2.split("-")
        return parts[0], parts[1]
    except Exception as e:
        raise ValueError(f"Błąd dekodowania klucza: {e}")


def format_time(iso_str: str) -> str:
    """Konwertuje '2026-11-04T07:10:00+01:00' na '07:10'."""
    if not iso_str:
        return ""
    match = re.search(r"T(\d{2}:\d{2})", iso_str)
    return match.group(1) if match else str(iso_str)


def parse_lesson(lekcja: dict):
    """Wyciąga dane z lekcji niezależnie od wersji struktury JSON Vulcana."""
    # Data i godziny
    data = (lekcja.get("data") or lekcja.get("dataOd") or lekcja.get("dzien") or "")[:10]
    godz_od = format_time(lekcja.get("godzinaOd") or lekcja.get("czasOd") or "")
    godz_do = format_time(lekcja.get("godzinaDo") or lekcja.get("czasDo") or "")
    
    # Numer lekcji
    nr = lekcja.get("numerLekcji") or lekcja.get("numer") or lekcja.get("nrLekcji")
    if isinstance(lekcja.get("poraLekcji"), dict):
        nr = nr or lekcja["poraLekcji"].get("numer")
    nr = str(nr) if nr is not None else "-"
    
    # Przedmiot
    prz = lekcja.get("przedmiot") or lekcja.get("przedmiotNazwa") or lekcja.get("opisZajec")
    if isinstance(prz, dict):
        prz = prz.get("nazwa") or prz.get("skrot") or "Nieznany"
    prz = str(prz) if prz else "Nieznany"
    
    # Nauczyciel
    nau = lekcja.get("pracownik") or lekcja.get("nauczyciel")
    if isinstance(nau, dict):
        imie = nau.get("imie", "")
        nazwisko = nau.get("nazwisko", "")
        nau = f"{imie} {nazwisko}".strip() or nau.get("nazwa", "")
    nau = str(nau) if nau else ""
    
    # Sala
    sal = lekcja.get("sala")
    if isinstance(sal, dict):
        sal = sal.get("kod") or sal.get("nazwa") or ""
    sal = str(sal) if sal else ""
    
    # Status / Zmiany
    zmiana = lekcja.get("zmianaInfo") or lekcja.get("adnotacja") or lekcja.get("opis") or ""
    odwolane = lekcja.get("odwolane", False) or lekcja.get("status") == "odwolane"
    
    return data, godz_od, godz_do, nr, prz, nau, sal, zmiana, odwolane


def parse_exam(spr: dict):
    """Wyciąga dane ze sprawdzianu/zadania z uwzględnieniem zagnieżdżeń."""
    data = (spr.get("data") or spr.get("dataSpr") or "")[:10]
    
    prz = spr.get("przedmiot") or spr.get("przedmiotNazwa")
    if isinstance(prz, dict):
        prz = prz.get("nazwa") or prz.get("skrot") or ""
    prz = str(prz) if prz else ""
    
    opis = spr.get("temat") or spr.get("opis") or spr.get("nazwa") or spr.get("tytul") or "Sprawdzian/Zadanie"
    
    rodz = spr.get("kategoria") or spr.get("rodzaj")
    if isinstance(rodz, dict):
        rodz = rodz.get("nazwa") or rodz.get("kod") or ""
    
    if rodz and isinstance(rodz, str) and rodz not in opis:
        opis = f"[{rodz}] {opis}"
        
    return data, prz, opis


def fetch_dashboard(client: httpx.Client, base_api_url: str, context_key: str):
    headers = {"Accept": "application/json, text/plain, */*", "Referer": f"{base_api_url.replace('/api', '')}/App/{context_key}/tablica"}
    params = {"key": context_key}

    print("\n" + "=" * 85)
    print("                              DANE Z PULPITU (TABLICA)")
    print("=" * 85)

    # 1. Szczęśliwy numerek
    try:
        res = client.get(f"{base_api_url}/SzczesliwyNumerTablica", params=params, headers=headers)
        val = res.text.strip().replace('"', '')
        print(f"[+] Szczęśliwy numerek na dziś: {val if val != 'null' else 'brak (nieustawiony)'}")
    except Exception:
        pass

    # 2. Plan zajęć (pulpit)
    try:
        res = client.get(f"{base_api_url}/PlanZajecTablica", params=params, headers=headers)
        plan_data = res.json() if res.status_code == 200 else []
        print(f"\n[+] Plan zajęć na dziś (lekcji: {len(plan_data)}):")
        for lekcja in plan_data:
            _, godz_od, godz_do, _, prz, nau, sal, zmiana, odw = parse_lesson(lekcja)
            info = f" {godz_od}-{godz_do} | {prz}"
            if nau: info += f" ({nau})"
            if sal: info += f" [s. {sal}]"
            if odw: info += " [ODWOŁANE]"
            elif zmiana: info += f" <-- ZMIANA: {zmiana}"
            print(f"    •{info}")
    except Exception as e:
        print(f"[-] Błąd pobierania planu zajęć: {e}")

    # 3. Sprawdziany
    try:
        res = client.get(f"{base_api_url}/SprawdzianyTablica", params=params, headers=headers)
        sprawdziany = res.json() if res.status_code == 200 else []
        print(f"\n[+] Nadchodzące sprawdziany i zadania (pozycji: {len(sprawdziany)}):")
        for spr in sprawdziany:
            data, prz, opis = parse_exam(spr)
            print(f"    • [{data}] {prz + ': ' if prz else ''}{opis}")
    except Exception as e:
        print(f"[-] Błąd pobierania sprawdzianów: {e}")

    # 4. Frekwencja
    try:
        res = client.get(f"{base_api_url}/FrekwencjaTablica", params=params, headers=headers)
        if res.status_code == 200:
            frekwencja = res.json()
            lekcje = frekwencja.get("oddzialy", [])
            if lekcje:
                obecnosci = sum(1 for l in lekcje if l.get("kategoriaFrekwencji") == 1)
                proc = round((obecnosci / len(lekcje)) * 100, 1)
                print(f"\n[+] Frekwencja z ostatnich dni: {proc}% ({obecnosci}/{len(lekcje)} obecności)")
    except Exception:
        pass


def fetch_timetable(client: httpx.Client, base_api_url: str, context_key: str):
    """Pobiera pełny plan lekcji na bieżący tydzień."""
    headers = {"Accept": "application/json, text/plain, */*", "Referer": f"{base_api_url.replace('/api', '')}/App/{context_key}/planZajec"}
    
    today = datetime.date.today()
    monday = today - datetime.timedelta(days=today.weekday())
    sunday = monday + datetime.timedelta(days=6)

    params = {
        "key": context_key,
        "dataOd": f"{monday}T00:00:00.000Z",
        "dataDo": f"{sunday}T23:59:59.999Z",
        "zakresDanych": 2
    }

    print("\n" + "=" * 85)
    print(f"               PLAN ZAJĘĆ ({monday.strftime('%d.%m.%Y')} - {sunday.strftime('%d.%m.%Y')})")
    print("=" * 85)

    try:
        res = client.get(f"{base_api_url}/PlanZajec", params=params, headers=headers)
        res.raise_for_status()
        plan_data = res.json()

        if not plan_data:
            print("Brak zaplanowanych zajęć w tym tygodniu.")
            return

        schedule_by_day = {}
        for lekcja in plan_data:
            data, _, _, _, _, _, _, _, _ = parse_lesson(lekcja)
            if not data: continue
            if data not in schedule_by_day: schedule_by_day[data] = []
            schedule_by_day[data].append(lekcja)

        dni = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"]
        
        for date_str in sorted(schedule_by_day.keys()):
            day_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d")
            print(f"\n--- {dni[day_obj.weekday()].upper()} ({date_str}) ---")
            
            # Sortujemy lekcje danego dnia według numeru
            lekcje_sort = sorted(schedule_by_day[date_str], key=lambda x: parse_lesson(x)[3] if parse_lesson(x)[3].isdigit() else "99")
            
            for lekcja in lekcje_sort:
                _, godz_od, godz_do, nr, prz, nau, sal, zmiana, odw = parse_lesson(lekcja)
                
                info = f" {nr:>2}. {godz_od}-{godz_do} | {prz}"
                if sal: info += f" [s. {sal}]"
                if nau: info += f" ({nau})"
                
                if odw: print(f"{info} [ODWOŁANE]")
                elif zmiana: print(f"{info} <-- ZMIANA: {zmiana}")
                else: print(info)

    except Exception as e:
        print(f"[!] Błąd pobierania pełnego planu lekcji: {e}")


def print_grades_table(grades_json: dict):
    subjects = grades_json.get("ocenyPrzedmioty", [])
    if not subjects:
        print("  Brak wpisów dla tego okresu.")
        return

    print(f"\n{'Przedmiot':<32} | {'Śr.':<5} | {'Oceny cząstkowe'}")
    print("-" * 85)

    for item in subjects:
        nazwa = item.get("przedmiotNazwa", "Nieznany")
        srednia = item.get("srednia") or "-"

        oceny_czastkowe = []
        for kol in item.get("kolumnyOcenyCzastkowe", []):
            wartosc = kol.get("wpis") or kol.get("ocena") or kol.get("wartosc")
            if not wartosc and "oceny" in kol and kol["oceny"]:
                sub = kol["oceny"][0]
                if isinstance(sub, dict):
                    wartosc = sub.get("wpis") or sub.get("wartosc") or sub.get("kod")
                else: wartosc = str(sub)

            waga = kol.get("wagaOceny") or kol.get("waga")
            if wartosc is not None and str(wartosc).strip():
                tag = f" (waga {waga})" if waga else ""
                oceny_czastkowe.append(f"{wartosc}{tag}")

        oceny_str = ", ".join(oceny_czastkowe) if oceny_czastkowe else "(brak ocen)"
        print(f"{nazwa:<32} | {str(srednia):<5} | {oceny_str}")


def main():
    login = os.getenv("LOGIN")
    password = os.getenv("PASSWORD")

    if not login or not password:
        print("Błąd: Zmienne środowiskowe LOGIN i PASSWORD muszą być ustawione.", file=sys.stderr)
        sys.exit(1)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
    }

    with httpx.Client(headers=headers, follow_redirects=True, timeout=30.0) as client:
        try:
            print("[*] Pobieranie strony logowania...")
            res = client.get("https://eduvulcan.pl/logowanie")
            res.raise_for_status()
            csrf_token = parse_verification_token(res.text)

            print("[*] Logowanie poświadczeniami...")
            payload = {"UserName": login, "Password": password, "captcha-response": "", "__RequestVerificationToken": csrf_token}
            res = client.post("https://eduvulcan.pl/logowanie", data=payload)
            res.raise_for_status()

            print("[*] Przechodzenie do aplikacji ucznia (wymiana tokenów SAML)...")
            res = client.get("https://eduvulcan.pl/dostep-do-dziennika/")
            res.raise_for_status()

            soup = BeautifulSoup(res.text, "html.parser")
            dziennik_link = next((urljoin("https://eduvulcan.pl", a["href"]) for a in soup.find_all("a", href=True) if "/dziennik?" in a["href"]), None)
            if not dziennik_link: raise RuntimeError("Nie znaleziono linku wejściowego do dziennika.")

            sso_res = handle_sso_post_redirects(client, client.get(dziennik_link))
            
            match = re.search(r"https://uczen\.eduvulcan\.pl/([^/]+)/App/([^/]+)/", str(sso_res.url))
            if not match: raise RuntimeError(f"Błąd URL: {sso_res.url}")

            instance, context_key = match.group(1), match.group(2)
            base_api_url = f"https://uczen.eduvulcan.pl/{instance}/api"
            student_id, id_dziennik = extract_ids_from_key(context_key)

            fetch_dashboard(client, base_api_url, context_key)
            fetch_timetable(client, base_api_url, context_key)

            print(f"\n[*] Pobieranie okresów klasyfikacyjnych (idDziennik={id_dziennik})...")
            periods = client.get(f"{base_api_url}/OkresyKlasyfikacyjne", params={"key": context_key, "idDziennik": id_dziennik}, headers={"Referer": str(sso_res.url)}).json()
            
            for period in periods:
                p_id = period.get("id") or period.get("Id")
                print(f"\n[*] Oceny dla okresu {period.get('numerOkresu', p_id)} (ID: {p_id})...")
                grades = client.get(f"{base_api_url}/Oceny", params={"key": context_key, "idOkresKlasyfikacyjny": p_id}, headers={"Referer": str(sso_res.url)}).json()
                print_grades_table(grades)

        except Exception as e:
            print(f"[!] Błąd: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()