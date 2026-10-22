/** Rasmni 1600 px gacha kichraytirib, JPEG data URL ga aylantiradi (serverga yuborish uchun). */
export async function fileToDataUrl(file: File, maxSide = 1600): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Faqat rasm fayli yuklang');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Rasmni o‘qib bo‘lmadi. JPG yoki PNG yuklang.');
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}
