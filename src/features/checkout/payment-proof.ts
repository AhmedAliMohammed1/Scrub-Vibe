const signatures = {
  "image/jpeg": (bytes: Uint8Array) =>
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes: Uint8Array) =>
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    ),
  "image/webp": (bytes: Uint8Array) =>
    [0x52, 0x49, 0x46, 0x46].every(
      (value, index) => bytes[index] === value,
    ) &&
    [0x57, 0x45, 0x42, 0x50].every(
      (value, index) => bytes[index + 8] === value,
    ),
} satisfies Record<string, (bytes: Uint8Array) => boolean>;

const extensions: Record<keyof typeof signatures, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function paymentProofExtensionFromBytes(
  type: string,
  size: number,
  bytes: Uint8Array,
) {
  if (size === 0 || size > 5 * 1024 * 1024) return null;
  const matches = signatures[type as keyof typeof signatures];
  if (!matches) return null;
  return matches(bytes)
    ? extensions[type as keyof typeof signatures]
    : null;
}

export async function paymentProofExtension(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return paymentProofExtensionFromBytes(file.type, file.size, bytes);
}
