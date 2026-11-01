import imageCompression from "browser-image-compression";

export interface Photo { dataUrl: string; width: number; height: number }

/** Shrinks the photo in the browser: function request bodies are limited and several images travel together. */
export async function resizeImage(file: File, opts: { extra?: boolean } = {}): Promise<Photo> {
  // Extra angles only help the AI understand the product, so they are kept small to stay under the request size limit.
  const small = await imageCompression(file, {
    maxWidthOrHeight: opts.extra ? 800 : 1280, maxSizeMB: opts.extra ? 0.3 : 0.8, useWebWorker: true, fileType: "image/jpeg", initialQuality: 0.85,
  });
  const dataUrl = await imageCompression.getDataUrlFromFile(small);
  const { width, height } = await new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not read the image."));
    img.src = dataUrl;
  });
  return { dataUrl, width, height };
}