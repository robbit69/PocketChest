export const retrievalCodeHint = '6–32 位字母、数字、短横线或下划线，不区分大小写';
export function isValidRetrievalCode(code: string): boolean {
  return /^[A-Z0-9_-]{6,32}$/i.test(code.trim());
}
