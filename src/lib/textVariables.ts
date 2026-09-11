const NAME_TOKEN_RE = /\{\{\s*nome\s*\}\}/gi;

export function hasNameVariable(value: string | undefined | null) {
  if (!value) return false;
  NAME_TOKEN_RE.lastIndex = 0;
  return NAME_TOKEN_RE.test(value);
}

export function personalizeText(value: string | undefined | null, name: string) {
  if (!value) return '';
  const resolvedName = name.trim();
  NAME_TOKEN_RE.lastIndex = 0;
  return value.replace(NAME_TOKEN_RE, resolvedName);
}
