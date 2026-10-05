require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const apiRoutes = require("./routes");
const swaggerSpec = require("./config/swagger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ไฟล์หลักฐาน/ลายเซ็นที่อัปโหลด — เสิร์ฟแบบ static ผ่าน /uploads
app.use("/uploads", express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "person-system-backend" }));

// เอกสาร API แบบ interactive — ตอบข้อ 6.9 (คำอธิบาย API) และ 6.10 (parameter ของแต่ละ API)
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "ระบบประเมินบุคลากร — API Docs" }));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✓ ระบบประเมินบุคลากร API ทำงานที่ http://localhost:${PORT}`);
});

module.exports = app;
