/**
 * Canvas helpers for the export pipeline.
 */

/** Rasterizes an ImageBitmap into a PNG data URL, optionally scaled down. */
export async function bitmapToDataURL(
  bitmap: ImageBitmap,
  scale = 1,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/** Downscales a PNG data URL by `scale` (0 < scale <= 1) via canvas. */
export async function downscaleToPng(
  dataURL: string,
  scale: number,
): Promise<string> {
  if (scale >= 1) return dataURL;
  const img = await loadImage(dataURL);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export function loadImage(dataURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = dataURL;
  });
}
