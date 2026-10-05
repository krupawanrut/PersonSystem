const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/scores.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");
const { uploadSignature } = require("../middleware/upload");

router.use(authenticate);

router.get("/:id/scores", requireRole("evaluator", "hr"), ctrl.list);

router.put(
  "/:id/scores/:indicatorId",
  requireRole("evaluator"),
  [body("scoreValue").isFloat({ min: 0, max: 4 }).withMessage("คะแนนไม่ถูกต้อง")],
  handleValidation,
  ctrl.setScore
);

router.put(
  "/:id/comment",
  requireRole("evaluator"),
  [body("overallComment").notEmpty().withMessage("กรุณากรอกความเห็นสรุป")],
  handleValidation,
  ctrl.setComment
);

router.post("/:id/sign", requireRole("evaluator"), uploadSignature.single("signature"), ctrl.signAndSubmit);

module.exports = router;
