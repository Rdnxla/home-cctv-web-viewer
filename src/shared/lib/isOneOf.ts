/** Сужает строку до элемента списка допустимых значений (`as const`-массив) */
export function isOneOf<T extends string>(values: readonly T[], value: string | null | undefined): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}
