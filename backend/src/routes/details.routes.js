const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/details.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { handleValidation } = require("../middleware/errorHandler");
const { uploadEvidence } = require("../middleware/upload");

router.use(authenticate);

router.get("/indicators/:id/details", ctrl.listByIndicator);

router.post(
  "/indicators/:id/details",
  requireRole("evaluatee"),
  [body("description").notEmpty().withMessage("กรุณากรอกรายละเอียดประกอบการประเมิน")],
  handleValidation,
  ctrl.create
);

router.put("/details/:id", requireRole("evaluatee"), ctrl.update);
router.delete("/details/:id", requireRole("evaluatee"), ctrl.remove);
router.post("/details/:id/evidence", requireRole("evaluatee"), uploadEvidence.single("file"), ctrl.attachEvidence);

router.get("/indicators/:id/self-score", ctrl.getSelfScore);

router.put(
  "/indicators/:id/self-score",
  requireRole("evaluatee"),
  [body("scoreValue").isFloat({ min: 1, max: 4 }).withMessage("คะแนนต้องอยู่ระหว่าง 1-4")],
  handleValidation,
  ctrl.setSelfScore
);

module.exports = router;
