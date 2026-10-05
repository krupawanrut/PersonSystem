const router = require("express").Router();
const ctrl = require("../controllers/reports.controller");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);

router.get("/reports/summary", requireRole("hr"), ctrl.summary);
router.get("/evaluatees/:id/report", ctrl.evaluateeReport);
router.get("/evaluatees/:id/report/pdf", ctrl.evaluateeReportPdf);

module.exports = router;
