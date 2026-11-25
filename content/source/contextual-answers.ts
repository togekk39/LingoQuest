export function answerVariants(...parts: readonly (string | readonly string[])[]): string[] {
  const answers = parts.reduce<string[]>(
    (prefixes, part) =>
      typeof part === 'string'
        ? prefixes.map((prefix) => prefix + part)
        : prefixes.flatMap((prefix) => part.map((variant) => prefix + variant)),
    [''],
  );
  return [...new Set(answers)].filter((answer) => answer.trim().length > 0);
}
