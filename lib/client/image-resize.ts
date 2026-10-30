import imageCompression from "browser-image-compression";

export interface Photo { dataUrl: string; width: number; height: number }

/** Shrinks the photo in the browser: function request bodies are limited and several images travel together. */
export async function resizeImage(file: File): Promise<Photo> {
  const small = await imageCompression(file, {
    maxWidthOrHeight: 1280, maxSizeMB: 0.8, useWebWorker: true, fileType: "image/jpeg", initialQuality: 0.85,
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