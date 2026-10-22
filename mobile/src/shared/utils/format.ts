/** Datums- und Zeitformate in der Sprache der App (Intl, Hermes-kompatibel). */

export function formatDate(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | number, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Tag und Monat ohne Jahr, z. B. "14. März". Das Jahr 2000 ist ein Schaltjahr (29. Februar). */
export function formatDayMonth(day: number, month: number, language: string): string {
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long' }).format(
    new Date(2000, month - 1, day),
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
