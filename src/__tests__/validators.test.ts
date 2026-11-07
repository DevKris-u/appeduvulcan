import { describe, it, expect } from '@jest/globals';
import {
  validate,
  validateArray,
  ValidationError,
  LessonSchema,
  AttendanceSchema,
  GradesResponseSchema,
  MessageListItemSchema,
} from '../api/validators';

describe('validators', () => {
  describe('validate', () => {
    it('powinien zwrócić poprawne dane', () => {
      const data = { nazwa: 'Matematyka', skrot: 'mat' };
      const result = validate<any>(LessonSchema, { przedmiot: data } as any, 'test');
      expect(result.przedmiot).toEqual(data);
    });

    it('powinien rzucić ValidationError przy niepoprawnych danych', () => {
      expect(() => validate(LessonSchema, { numerLekcji: 'nie-liczba' } as any, 'test')).toThrow(
        ValidationError
      );
    });
  });

  describe('validateArray', () => {
    it('powinien zwrócić tablicę poprawnych elementów', () => {
      const data = [
        { oddzialy: [{ kategoriaFrekwencji: 1 }] },
        { oddzialy: [{ kategoriaFrekwencji: 2 }] },
      ];
      const result = validateArray(AttendanceSchema, data, 'test');
      expect(result).toHaveLength(2);
    });

    it('powinien rzucić błąd gdy elementy niepoprawne', () => {
      expect(() => validateArray(AttendanceSchema, ['nie-obiekt'] as any, 'test')).toThrow(
        ValidationError
      );
    });
  });

  describe('GradesResponseSchema', () => {
    it('powinien obsłużyć brak ocenyPrzedmioty', () => {
      const result = validate<any>(GradesResponseSchema, {}, 'Oceny');
      expect(result.ocenyPrzedmioty).toBeUndefined();
    });
  });

  describe('MessageListItemSchema', () => {
    it('powinien wymagać apiGlobalKey i data', () => {
      expect(() =>
        validate(MessageListItemSchema, { data: '2024-01-01' } as any, 'Odebrane')
      ).toThrow(ValidationError);
    });
  });
});
