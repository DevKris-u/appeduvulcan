import { z, type ZodTypeAny } from 'zod';

/* ── Wspólne schematy ── */

export const PrzedmiotSchema = z.object({
  nazwa: z.string().optional(),
  skrot: z.string().optional(),
});

export const NauczycielSchema = z.object({
  imie: z.string().optional(),
  nazwisko: z.string().optional(),
});

export const SalaSchema = z.object({
  nazwa: z.string().optional(),
});

export const RecipientSchema = z.object({
  nazwa: z.string().optional(),
  globalKey: z.string().optional(),
});

export const GradeColumnSchema = z.object({
  wpis: z.string().optional(),
  ocena: z.string().optional(),
  wartosc: z.string().optional(),
  wagaOceny: z.number().optional(),
  waga: z.number().optional(),
  nazwa: z.string().optional(),
  data: z.string().optional(),
  opis: z.string().optional(),
});

export const LessonSchema = z.object({
  data: z.string().optional(),
  dataOd: z.string().optional(),
  dzien: z.string().optional(),
  godzinaOd: z.string().optional(),
  czasOd: z.string().optional(),
  godzinaDo: z.string().optional(),
  czasDo: z.string().optional(),
  numerLekcji: z.number().optional(),
  numer: z.number().optional(),
  nrLekcji: z.number().optional(),
  przedmiot: PrzedmiotSchema.optional(),
  przedmiotNazwa: z.string().optional(),
  opisZajec: z.string().optional(),
  nauczyciel: NauczycielSchema.optional(),
  sala: SalaSchema.optional(),
  zmianaInfo: z.string().optional(),
  adnotacja: z.string().optional(),
  opis: z.string().optional(),
  odwolane: z.boolean().optional(),
  status: z.string().optional(),
  id: z.string().optional(),
});

export const ExamSchema = z.object({
  data: z.string().optional(),
  dataSpr: z.string().optional(),
  przedmiot: PrzedmiotSchema.optional(),
  przedmiotNazwa: z.string().optional(),
  temat: z.string().optional(),
  opis: z.string().optional(),
  nazwa: z.string().optional(),
  tytul: z.string().optional(),
  kategoria: z.any().optional(),
  rodzaj: z.any().optional(),
  id: z.string().optional(),
});

export const AttendanceItemSchema = z.object({
  kategoriaFrekwencji: z.number(),
});

export const AttendanceSchema = z.object({
  oddzialy: z.array(AttendanceItemSchema).optional(),
});

export const ClassificationPeriodSchema = z.object({
  id: z.number().optional(),
  Id: z.number().optional(),
  numerOkresu: z.number().optional(),
});

export const SubjectGradesSchema = z.object({
  przedmiot: PrzedmiotSchema.optional(),
  przedmiotNazwa: z.string().optional(),
  srednia: z.number().optional(),
  kolumnyOcenyCzastkowe: z.array(GradeColumnSchema).optional(),
});

export const MessageListItemSchema = z.object({
  apiGlobalKey: z.string(),
  data: z.string(),
  nadawca: z.string().optional(),
  temat: z.string().optional(),
  tresc: z.string().optional(),
  przeczytana: z.boolean().optional(),
});

export const MessageDetailSchema = z.object({
  apiGlobalKey: z.string(),
  data: z.string().optional(),
  nadawca: z.string().optional(),
  temat: z.string().optional(),
  tresc: z.string().optional(),
});

/* ── Helper walidacyjny ── */

export class ValidationError extends Error {
  constructor(public readonly issues: z.ZodIssue[]) {
    super(
      `Błąd walidacji odpowiedzi API: ${issues
        .map((i: any) => i.path.join('.') + ': ' + i.message)
        .join(', ')}`
    );
    this.name = 'ValidationError';
  }
}

export function validate<T>(schema: ZodTypeAny, data: unknown, endpoint: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data as T;
}

export function validateArray<T>(schema: ZodTypeAny, data: unknown, endpoint: string): T[] {
  const result = z.array(schema).safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data as T[];
}

/* ── Schematy odpowiedzi endpointów ── */

export const LuckyNumberResponseSchema = z.string().nullable();
export const LessonsResponseSchema = z.array(LessonSchema);
export const ExamsResponseSchema = z.array(ExamSchema);
export const AttendanceResponseSchema = AttendanceSchema;
export const ClassificationPeriodsResponseSchema = z.array(ClassificationPeriodSchema);
export const GradesResponseSchema = z.object({
  ocenyPrzedmioty: z.array(SubjectGradesSchema).optional(),
});
export const MessageBoxesResponseSchema = z.any();
export const ReceivedMessagesResponseSchema = z.array(MessageListItemSchema);
export const MessageDetailResponseSchema = MessageDetailSchema;
