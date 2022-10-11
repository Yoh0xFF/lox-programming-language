export function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

export function isAlpha(c: string): boolean {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
}

export function isAlphaNumeric(c: string): boolean {
  return isAlpha(c) || isDigit(c);
}
