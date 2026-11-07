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
  przedmiot?: any;
  przedmiotNazwa?: string;
  opisZajec?: string;
  pracownik?: any;
  nauczyciel?: any;
  sala?: any;
  zmianaInfo?: string;
  adnotacja?: string;
  opis?: string;
  odwolane?: boolean;
  status?: string;
}

export interface Exam {
  data?: string;
  dataSpr?: string;
  przedmiot?: any;
  przedmiotNazwa?: string;
  temat?: string;
  opis?: string;
  nazwa?: string;
  tytul?: string;
  kategoria?: any;
  rodzaj?: any;
}

export interface Attendance {
  oddzialy?: Array<{ kategoriaFrekwencji: number }>;
}

export interface ClassificationPeriod {
  id?: number;
  Id?: number;
  numerOkresu?: number;
}

export interface SubjectGrades {
  przedmiot?: any;
  przedmiotNazwa?: string;
  srednia?: number;
  kolumnyOcenyCzastkowe?: GradeColumn[];
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

export interface MessageListItem {
  apiGlobalKey: string;
  data: string;
  nadawca?: string;
  temat?: string;
  tresc?: string;
  przeczytana?: boolean;
}

export interface MessageDetail {
  apiGlobalKey: string;
  data?: string;
  nadawca?: string;
  temat?: string;
  tresc?: string;
  adresaci?: Recipient[];
}

export interface Recipient {
  nazwa?: string;
  globalKey?: string;
}

export interface VulcanContext {
  instance: string;
  contextKey: string;
  baseApiUrl: string;
  studentId: string;
  idDziennik: string;
  baseMessagesApiUrl: string;
}
