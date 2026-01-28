const express = require("express");
const { saveBaggageCheck, getStats,getAllBaggageChecks } = require("../controllers/baggageController");

const router = express.Router();

router.post("/save-check", saveBaggageCheck);
router.get("/stats", getStats);
router.get("/all", getAllBaggageChecks); 

module.exports = router;
