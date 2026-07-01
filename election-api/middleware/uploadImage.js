const { uploadImageFile } = require("../lib/spacesStorage");

/**
 * Upload a multer file buffer to DigitalOcean Spaces CDN (or local /uploads in dev).
 * Sets req.file.cdnUrl for controllers.
 */
function uploadToCdn(folder) {
  return async (req, res, next) => {
    if (!req.file) return next();

    try {
      req.file.cdnUrl = await uploadImageFile(req.file, folder);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { uploadToCdn };
