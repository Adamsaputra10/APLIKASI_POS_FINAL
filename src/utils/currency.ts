import { Language } from '../types';

/**
 * Formats a pure numerical price into a localized currency string.
 * e.g. 20000 -> "Rp 20.000"
 */
export function formatPrice(amount: number, lang: Language): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  const rounded = Math.round(safeAmount);
  if (lang === 'ID') {
    return `Rp ${rounded.toLocaleString('id-ID')}`;
  }
  return `Rp ${rounded.toLocaleString('en-US')}`;
}

/**
 * Returns currency symbol string ('Rp').
 */
export function getCurrencySymbol(_lang?: Language): string {
  return 'Rp';
}

/**
 * Returns user price input directly without conversion.
 */
export function parseInputToUSD(inputVal: number, _lang?: Language): number {
  return inputVal;
}

