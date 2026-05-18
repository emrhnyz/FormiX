/** UTF-8 metni uint32 bloklarına paketler (her blok 4 bayt, little-endian). */
export function packStringToUint32s(text: string, maxChunks: number): number[] {
  const bytes = new TextEncoder().encode(text);
  const chunks: number[] = [];
  for (let i = 0; i < maxChunks; i++) {
    const offset = i * 4;
    let value = 0;
    for (let b = 0; b < 4; b++) {
      const byte = offset + b < bytes.length ? bytes[offset + b]! : 0;
      value |= byte << (8 * b);
    }
    chunks.push(value >>> 0);
  }
  return chunks;
}

export function unpackUint32sToString(values: bigint[]): string {
  const bytes: number[] = [];
  for (const v of values) {
    const n = Number(v & 0xffffffffn);
    bytes.push(n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff);
  }
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return new TextDecoder().decode(new Uint8Array(bytes.slice(0, end)));
}
