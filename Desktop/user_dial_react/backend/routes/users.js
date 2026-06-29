const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  getDashboardStats,
  deleteUsers,
  deleteUser,
  copyUser
} = require("../controllers/userController");

router.get("/", getUsers);
router.get("/stats", getDashboardStats);
router.post("/", createUser);
router.post("/copy", copyUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);

// router.delete("/", deleteUsers);
router.delete("/:id", deleteUser);

module.exports = router;