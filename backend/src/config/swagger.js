const swaggerJsdoc = require("swagger-jsdoc");

// เอกสาร API อัตโนมัติ (ตอบข้อ 6.9 คำอธิบาย API และ 6.10 การระบุ parameter)
// สร้างจากคอมเมนต์ @swagger เหนือแต่ละ route ใน src/routes/*.routes.js โดยตรง
// เข้าดูได้จริงที่ GET /api/docs เมื่อรันเซิร์ฟเวอร์
const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ระบบประเมินบุคลากร — API",
      version: "1.0.0",
      description:
        "RESTful API สำหรับระบบประเมินบุคลากร (Personnel Evaluation System) " +
        "ครอบคลุมการเข้าสู่ระบบ, งานบุคลากร, การประเมินตนเอง และการให้คะแนนโดยกรรมการ",
    },
    servers: [{ url: "/api", description: "Backend API" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "แนบ JWT Token ที่ได้จาก POST /auth/login ในรูปแบบ `Authorization: Bearer <token>`",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "ดำเนินการสำเร็จ" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "integer", example: 400 },
            message: { type: "string", example: "เกิดข้อผิดพลาด" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: { field: { type: "string" }, message: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "401 — ไม่พบ Token หรือ Token หมดอายุ",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        Forbidden: {
          description: "403 — ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (บทบาทไม่ตรง)",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        NotFound: {
          description: "404 — ไม่พบข้อมูลที่ร้องขอ",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        ValidationError: {
          description: "400 — ข้อมูลไม่ถูกต้องหรือไม่ครบ",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
      },
    },
    tags: [
      { name: "Auth", description: "เข้าสู่ระบบและจัดการบัญชีของตนเอง" },
      { name: "Users", description: "จัดการผู้ใช้งาน (เฉพาะฝ่ายบุคลากร)" },
      { name: "Topics", description: "หัวข้อการประเมิน" },
      { name: "Indicators", description: "ตัวชี้วัดในแต่ละหัวข้อ" },
      { name: "Assignments", description: "การมอบหมายกรรมการผู้ประเมิน" },
      { name: "Evaluation Details", description: "รายละเอียดและหลักฐานประกอบการประเมิน" },
      { name: "Scores", description: "คะแนนประเมินตนเองและคะแนนจากกรรมการ" },
      { name: "Reports", description: "รายงานและสรุปภาพรวม" },
      { name: "Admin", description: "สำรองและกู้คืนข้อมูลระบบ (เฉพาะฝ่ายบุคลากร)" },
    ],
  },
  apis: ["./src/routes/*.routes.js"],
};

module.exports = swaggerJsdoc(options);
