// Shared formatting helpers for text inputs that hold a free-text amount
// (contracts' 계약금액 / 강사료 fields allow things like "시간당 100000원", not
// just a bare number, so we can't switch them to <input type="number">).

/**
 * Inserts thousands-separating commas into every run of digits in a
 * string as the user types, leaving everything else (Korean text, "원",
 * "~" ranges, etc.) untouched — so "시간당 100000원" becomes
 * "시간당 100,000원" and "35000000" becomes "35,000,000". Idempotent: running
 * it again on its own output (e.g. re-formatting on every keystroke while
 * editing an already-formatted value) gives the same result back.
 */
export function formatAmountInput(raw: string): string {
  const noCommas = raw.replace(/,/g, "");
  return noCommas.replace(/\d+/g, (digits) => {
    const trimmed = digits.replace(/^0+(?=\d)/, "");
    return Number(trimmed).toLocaleString("ko-KR");
  });
}
