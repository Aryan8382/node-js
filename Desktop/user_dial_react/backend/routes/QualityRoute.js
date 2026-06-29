const express = require("express");
const router = express.Router();

const {
  getCampaigns,
  getLists,
  createList,
  updateList,
  deleteList,
  getListById,
  copyList,
  getIngroups,
  getScorecards,
} = require("../controllers/qualityController");

router.get("/campaigns", getCampaigns);
router.get("/lists", getLists);
router.post("/lists", createList);
router.post("/lists/copy", copyList);
router.put("/lists/:listId", updateList);
router.get("/lists/:listId", getListById);
router.get("/ingroups", getIngroups);
router.get("/scorecards", getScorecards);
router.delete("/lists/:listId", deleteList);

module.exports = router;