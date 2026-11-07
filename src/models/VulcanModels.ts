export interface Przedmiot {
  nazwa?: string;
  skrot?: string;
}

export interface Nauczyciel {
  imie?: string;
  nazwisko?: string;
}

export interface Sala {
  nazwa?: string;
}

export interface Kategoria {
  nazwa?: string;
}

export interface Recipient {
  nazwa?: string;
  globalKey?: string;
}

export interface LuckyNumber {
  number: string | null;
}

export interface Lesson {
  data?: string;
  dataOd?: string;
  dzien?: string;
  godzinaOd?: string;
  czasOd?: string;
  godzinaDo?: string;
  czasDo?: string;
  numerLekcji?: number;
  numer?: number;
  nrLekcji?: number;
  poraLekcji?: { numer: number };
  przedmiot?: Przedmiot;
  przedmiotNazwa?: string;
  opisZajec?: string;
  pracownik?: any;
  nauczyciel?: Nauczyciel;
  sala?: Sala;
  zmianaInfo?: string;
  adnotacja?: string;
  opis?: string;
  odwolane?: boolean;
  status?: string;
  id?: string;
}

export interface Exam {
  data?: string;
  dataSpr?: string;
  przedmiot?: Przedmiot;
  przedmiotNazwa?: string;
  temat?: string;
  opis?: string;
  nazwa?: string;
  tytul?: string;
  kategoria?: Kategoria;
  rodzaj?: any;
  id?: string;
}

export interface AttendanceItem {
  kategoriaFrekwencji: number;
}

export interface Attendance {
  oddzialy?: AttendanceItem[];
}

export interface ClassificationPeriod {
  id?: number;
  Id?: number;
  numerOkresu?: number;
}

export interface GradeColumn {
  wpis?: string;
  ocena?: string;
  wartosc?: string;
  wagaOceny?: number;
  waga?: number;
  nazwa?: string;
  data?: string;
  kategoria?: any;
  opis?: string;
  oceny?: any[];
}

export interface SubjectGrades {
  przedmiot?: Przedmiot;
  przedmiotNazwa?: string;
  srednia?: number;
  kolumnyOcenyCzastkowe?: GradeColumn[];
  id?: string;
}

export interface MessageListItem {
  apiGlobalKey: string;
  data: string;
  nadawca?: string;
  temat?: string;
  tresc?: string;
  przeczytana?: boolean;
  adresaci?: Recipient[];
}

export interface MessageDetail {
  apiGlobalKey: string;
  data?: string;
  nadawca?: string;
  temat?: string;
  tresc?: string;
  adresaci?: Recipient[];
}

export interface VulcanContext {
  instance: string;
  contextKey: string;
  baseApiUrl: string;
  studentId: string;
  idDziennik: string;
  baseMessagesApiUrl: string;
}
