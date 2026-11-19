const router = require('express').Router();

const { createPost } = require('../controllers/postController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, createPost);

module.exports = router;