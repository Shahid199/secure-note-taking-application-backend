
const router = require('express').Router();

const {
    createUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');

const {
    authenticate,
    authorize
} = require('../middleware/authMiddleware');

// All routes require Admin authentication
router.use(authenticate, authorize('admin'));

router.route('/')
    .post(createUser)
    .get(getAllUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;
