const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Keep JSON/base64 photo payloads under typical 1MB gateway limits (~280KB file → ~375KB base64). */
const JSON_PHOTO_TARGET_BYTES = 280 * 1024;
const COMPRESS_THRESHOLD_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const JSON_MAX_DIMENSION = 1024;

export function validateImageFile(file: File): string | null {
  if (!/^image\//.test(file.type)) {
    return 'Please choose an image file (PNG, JPG, etc.).';
  }
  if (file.size > 15 * 1024 * 1024) {
    return 'Image is too large. Please use a file under 15MB.';
  }
  return null;
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}

/** Aggressive compression for JSON/base64 uploads (avoids HTTP 413 on production gateways). */
export async function prepareImageForJsonUpload(file: File): Promise<File> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, JSON_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  let quality = 0.82;
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'nominee-photo';

  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) break;

      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await canvasToJpegBlob(canvas, quality);
      if (blob && blob.size <= JSON_PHOTO_TARGET_BYTES) {
        return new File([blob], `${baseName}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
      }

      if (quality > 0.45) {
        quality -= 0.08;
      } else {
        scale *= 0.85;
        quality = 0.78;
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error('Could not compress the image enough for upload. Try a smaller photo.');
}

/** Resize/compress large photos so multipart upload stays under the 5MB API limit. */
export async function prepareImageForUpload(file: File): Promise<File> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvasToJpegBlob(canvas, 0.85);

  if (!blob) return file;

  if (blob.size >= file.size && file.size <= MAX_UPLOAD_BYTES) {
    return file;
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image is still too large after compression. Try a smaller photo.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'nominee-photo';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

/** Read a compact image file as a data URL for JSON photoBase64 uploads. */
export async function fileToDataUrl(file: File): Promise<string> {
  const prepared = await prepareImageForJsonUpload(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read image file'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(prepared);
  });
}
