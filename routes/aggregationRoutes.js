const router = require("express").Router();

const {
  groupUsersByInterests,
  getAllPosts,
  getUserPosts,
} = require("../controllers/aggregationController");

const { authenticate, authorize } = require("../middleware/authMiddleware");

const { getPost } = require("../controllers/aggregationController");

// Admin: Group users by interests
router.get(
  "/users-by-interests",
  authenticate,
  authorize("admin"),
  groupUsersByInterests,
);

// All posts
router.get("/posts", getPost);

// Specific user's posts
router.get("/posts/:userId", getPost);

module.exports = router;
