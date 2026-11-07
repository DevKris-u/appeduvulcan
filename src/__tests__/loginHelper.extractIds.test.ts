import { describe, it, expect } from '@jest/globals';

// Testujemy logikę dekodowania contextKey (dwukrotne base64, split po '-')
function extractIdsFromKey(contextKey: string): [string, string] {
  const step1 = Buffer.from(contextKey, 'base64').toString('utf-8');
  const step2 = Buffer.from(step1, 'base64').toString('utf-8');
  const parts = step2.split('-');
  return [parts[0], parts[1]];
}

describe('extractIdsFromKey', () => {
  it('powinien wyciągnąć studentId i idDziennik z podwójnego base64', () => {
    const studentId = '12345';
    const idDziennik = '67890';
    const plain = `${studentId}-${idDziennik}`;
    const step1 = Buffer.from(plain, 'utf-8').toString('base64');
    const contextKey = Buffer.from(step1, 'utf-8').toString('base64');

    const [sid, idz] = extractIdsFromKey(contextKey);
    expect(sid).toBe(studentId);
    expect(idz).toBe(idDziennik);
  });

  it('powinien zwrócić undefined dla idDziennik gdy brak drugiego segmentu', () => {
    const plain = '12345';
    const step1 = Buffer.from(plain, 'utf-8').toString('base64');
    const contextKey = Buffer.from(step1, 'utf-8').toString('base64');

    const [sid, idz] = extractIdsFromKey(contextKey);
    expect(sid).toBe('12345');
    expect(idz).toBeUndefined();
  });
});
