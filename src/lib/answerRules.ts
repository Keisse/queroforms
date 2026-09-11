const EXCLUSIVE_MULTI_VALUES = new Set(['none', 'nenhuma']);

export function toggleMultiAnswer(current: string[], value: string) {
  if (EXCLUSIVE_MULTI_VALUES.has(value)) {
    return current.length === 1 && current[0] === value ? [] : [value];
  }

  const withoutExclusive = current.filter(item => !EXCLUSIVE_MULTI_VALUES.has(item));
  if (withoutExclusive.includes(value)) return withoutExclusive.filter(item => item !== value);
  return [...withoutExclusive, value];
}
