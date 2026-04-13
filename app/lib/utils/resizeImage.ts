const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function drawToCanvas(img: HTMLImageElement, scale: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      quality,
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resizes and compresses an image File to stay under 2 MB.
 * Returns a base64 data URL of the compressed image.
 */
export async function resizeImageUnder2MB(file: File): Promise<string> {
  const img = await loadImage(file);

  let scale = 1;
  let quality = 0.9;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const canvas = drawToCanvas(img, scale);
    const blob = await canvasToBlob(canvas, quality);

    if (blob.size <= MAX_BYTES) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // First reduce quality in steps of 0.1
    if (quality > 0.2) {
      quality = Math.round((quality - 0.1) * 10) / 10;
    } else {
      // Then shrink dimensions by 20% each round
      scale = Math.round(scale * 0.8 * 100) / 100;
      quality = 0.8;

      if (scale < 0.1) {
        // Fallback: return whatever we have even if slightly over
        const canvas = drawToCanvas(img, scale);
        const blob = await canvasToBlob(canvas, 0.5);
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }
  }
}
