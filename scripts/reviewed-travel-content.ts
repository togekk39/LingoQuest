import { canonicalStringify, sha256Hex } from '@lingoquest/course-pack';

export function reviewedTravelSignature(value: unknown): string {
  return sha256Hex(canonicalStringify(value));
}

export function checkReviewedTravelContent(
  reviewed: Readonly<Record<string, string>>,
  key: string,
  value: unknown,
  location: string,
): string[] {
  const actual = reviewedTravelSignature(value);
  if (Object.hasOwn(reviewed, key) && reviewed[key] === actual) return [];
  return [
    location +
      ' Changed instructional or assessment text requires a prerequisite review / Un cambio en el material o la evaluación requiere revisar sus requisitos. ' +
      `sha256=${actual}`,
  ];
}
