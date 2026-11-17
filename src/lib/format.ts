export function readable(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/^./, letter => letter.toUpperCase());
}

export function area(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(', ');
}

export function validId(value?: string) {
  if (!value || !/^\d+$/.test(value)) return 0;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : 0;
}
