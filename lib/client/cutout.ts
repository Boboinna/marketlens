const load = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not read the image."));
    img.src = src;
  });

/** Applies SAM's mask to the photo in the browser: the product stays, everything else turns transparent. */
export async function makeCutout(photoUrl: string, maskUrl: string): Promise<string> {
  const [img, mask] = await Promise.all([load(photoUrl), load(maskUrl)]);
  const w = img.naturalWidth, h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, w, h);

  const mc = document.createElement("canvas");
  mc.width = w; mc.height = h;
  const mctx = mc.getContext("2d")!;
  mctx.drawImage(mask, 0, 0, w, h);
  const m = mctx.getImageData(0, 0, w, h).data;

  for (let i = 0; i < pixels.data.length; i += 4) pixels.data[i + 3] = m[i]; // white = keep
  ctx.putImageData(pixels, 0, 0);
  return canvas.toDataURL("image/png");
}
