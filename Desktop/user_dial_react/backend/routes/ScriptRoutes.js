const express = require("express");
const router = express.Router();

const {
    getAllScripts,
    getScript,
    createScript,
    updateScript,
    deleteScript,
} = require("../controllers/ScriptController");

router.get("/", getAllScripts);
router.get("/:id", getScript);
router.post("/", createScript);
router.put("/:id", updateScript);
router.delete("/:id", deleteScript);

module.exports = router;
