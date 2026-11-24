const previousBuiltInChecksums = new Set([
  '85889d066af2e80b18bc07f42347a08cf2c663b0f061200ab56db4c96f283ea6',
  'e3cba792784da48c2c11b06377824981729a52b78008221d8fedcd264fe203c4',
]);

export function isPreviousBuiltInCourse(checksum: string) {
  return previousBuiltInChecksums.has(checksum);
}
