export async function dataUrlToBlob(u: string): Promise<Blob> {
  return (await fetch(u)).blob();
}
