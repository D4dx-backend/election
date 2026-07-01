const { uploadImageFile } = require("./spacesStorage");

const MAX_BYTES = 5 * 1024 * 1024;

function parseImageDataUrl(dataUrl) {
  const str = String(dataUrl || "").trim();
  const match = str.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    throw new Error("Invalid image data.");
  }

  const mimetype = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) {
    throw new Error("Invalid image data.");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }

  let ext = ".jpg";
  if (mimetype.includes("png")) ext = ".png";
  else if (mimetype.includes("webp")) ext = ".webp";
  else if (mimetype.includes("gif")) ext = ".gif";

  return { buffer, mimetype, ext };
}

async function uploadPhotoFromBase64(photoBase64, folder = "nominees", name = "nominee") {
  const { buffer, mimetype, ext } = parseImageDataUrl(photoBase64);
  const safeName =
    String(name || "nominee")
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .slice(0, 40) || "nominee";

  return uploadImageFile(
    { buffer, mimetype, originalname: `${safeName}${ext}` },
    folder
  );
}

module.exports = {
  uploadPhotoFromBase64,
  parseImageDataUrl,
};
