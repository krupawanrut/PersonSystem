const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const MAX_MB = Number(process.env.MAX_UPLOAD_MB) || 5;

const ALLOWED = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

function makeStorage(subdir) {
  const dest = path.join(process.cwd(), UPLOAD_DIR, subdir);
  fs.mkdirSync(dest, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });
}

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.has(ext)) {
    return cb(new Error("ชนิดไฟล์ไม่ได้รับอนุญาต (รองรับเฉพาะ PDF, JPG, PNG)"));
  }
  cb(null, true);
}

const uploadEvidence = multer({
  storage: makeStorage("evidence"),
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

const uploadSignature = multer({
  storage: makeStorage("signatures"),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = { uploadEvidence, uploadSignature };
