
const router = require('express').Router();

const {
    createNote,
    getMyNotes,
    getNote,
    updateNote,
    deleteNote,
    getAllNotes
} = require('../controllers/noteController');

const {
    authenticate,
    authorize
} = require('../middleware/authMiddleware');

// All routes require login
router.use(authenticate);

// Admin only: All users' notes
router.get('/admin/allnotes', authorize('admin'), getAllNotes);

// User + Admin: Own notes
router.route('/')
    .post(createNote)
    .get(getMyNotes);

router.route('/:id')
    .get(getNote)
    .put(updateNote)
    .delete(deleteNote);

module.exports = router;
