const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

let s3Client = null;

function normalizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function detectRegionFromEndpoint(endpoint) {
  const match = String(endpoint || "").match(/([a-z0-9]+)\.digitaloceanspaces\.com/i);
  return match ? match[1] : "";
}

function getSpacesConfig() {
  const rawEndpoint = process.env.DO_SPACES_ENDPOINT || "";
  const region =
    process.env.DO_SPACES_REGION ||
    detectRegionFromEndpoint(rawEndpoint) ||
    "nyc3";
  const bucket = process.env.DO_SPACES_BUCKET || "";
  const endpoint = normalizeUrl(
    rawEndpoint || `https://${region}.digitaloceanspaces.com`
  );
  const cdnBase = normalizeUrl(
    process.env.DO_SPACES_CDN_URL ||
      process.env.DO_SPACES_CDN_ENDPOINT ||
      (bucket ? `https://${bucket}.${region}.cdn.digitaloceanspaces.com` : "")
  );
  const folderPrefix = String(process.env.DO_SPACES_FOLDER || "")
    .replace(/[^a-z0-9/_-]/gi, "")
    .replace(/^\/+|\/+$/g, "");

  return {
    region,
    bucket,
    endpoint,
    cdnBase,
    folderPrefix,
    accessKeyId: process.env.DO_SPACES_KEY || "",
    secretAccessKey: process.env.DO_SPACES_SECRET || "",
  };
}

function isSpacesConfigured() {
  const { bucket, accessKeyId, secretAccessKey, cdnBase } = getSpacesConfig();
  return Boolean(bucket && accessKeyId && secretAccessKey && cdnBase);
}

function getS3Client() {
  if (s3Client) return s3Client;

  const { region, endpoint, accessKeyId, secretAccessKey } = getSpacesConfig();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("DigitalOcean Spaces credentials are not configured.");
  }

  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  });

  return s3Client;
}

function buildObjectKey(folder, originalName) {
  const ext = path.extname(originalName || "").toLowerCase() || ".jpg";
  const base = path
    .basename(originalName || "image", ext)
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()
    .slice(0, 40);
  const safeFolder = String(folder || "uploads")
    .replace(/[^a-z0-9/_-]/gi, "")
    .replace(/^\/+|\/+$/g, "");
  return `${safeFolder}/${Date.now()}-${base}${ext}`;
}

const localUploadDir = path.resolve(__dirname, "..", "public", "uploads");

async function saveLocalFallback(file, folder) {
  const targetDir = path.join(localUploadDir, folder);
  fs.mkdirSync(targetDir, { recursive: true });

  const filename = buildObjectKey(folder, file.originalname).split("/").pop();
  const filePath = path.join(targetDir, filename);
  await fs.promises.writeFile(filePath, file.buffer);

  return `/uploads/${folder}/${filename}`;
}

async function uploadImageFile(file, folder = "uploads") {
  if (!file?.buffer) {
    throw new Error("Uploaded file buffer is missing.");
  }

  if (!isSpacesConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DigitalOcean Spaces is not configured. Set DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET, and DO_SPACES_CDN_URL."
      );
    }
    return saveLocalFallback(file, folder);
  }

  const { bucket, cdnBase, folderPrefix } = getSpacesConfig();
  const uploadFolder = folderPrefix ? `${folderPrefix}/${folder}` : folder;
  const key = buildObjectKey(uploadFolder, file.originalname);

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
      ACL: "public-read",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${cdnBase}/${key}`;
}

/** Resolve stored image paths to a browser-loadable URL. */
function resolvePublicImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/uploads/")) {
    const { cdnBase } = getSpacesConfig();
    if (isSpacesConfigured() && cdnBase) {
      const key = url.replace(/^\/uploads\//, "");
      return `${cdnBase}/${key}`;
    }
    return url;
  }

  return url;
}

module.exports = {
  uploadImageFile,
  resolvePublicImageUrl,
  isSpacesConfigured,
  getSpacesConfig,
};
