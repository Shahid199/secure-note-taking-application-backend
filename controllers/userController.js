
const mongoose = require('mongoose');

const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');

// Create User
exports.createUser = async (req, res) => {
    try {
        const { name, userName, password, role, interests } = req.body;

        if (!name || !userName || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, username and password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        if (interests !== undefined && !Array.isArray(interests)) {
            return res.status(400).json({
                success: false,
                message: 'Interests must be an array'
            });
        }

        const user = await User.create({
            name,
            userName: userName.trim().toLowerCase(),
            password,
            role: role || 'user',
            interests: interests || []
        });

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        console.error('Create User Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Get All Users (Pagination)
exports.getAllUsers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 10, 1),
            100
        );

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find()
                .select('-password')
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit),

            User.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get Users Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Get Single User
exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get User Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Update User
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const allowedFields = [
            'name',
            'userName',
            'password',
            'role',
            'interests'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

        if (updates.name !== undefined &&
            (typeof updates.name !== 'string' || !updates.name.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Name must be a non-empty string'
            });
        }

        if (updates.userName !== undefined) {
            if (typeof updates.userName !== 'string' || !updates.userName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Username must be a non-empty string'
                });
            }

            updates.userName = updates.userName.trim().toLowerCase();
        }

        if (updates.password !== undefined && updates.password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        if (updates.role !== undefined &&
            !['user', 'admin'].includes(updates.role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        if (updates.interests !== undefined &&
            !Array.isArray(updates.interests)) {
            return res.status(400).json({
                success: false,
                message: 'Interests must be an array'
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent removing the last admin
        if (
            user.role === 'admin' &&
            updates.role === 'user'
        ) {
            const adminCount = await User.countDocuments({
                role: 'admin'
            });

            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot demote the last admin'
                });
            }
        }

        Object.assign(user, updates);

        // save() triggers password hashing middleware
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        console.error('Update User Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Delete User + All Notes + All Posts
exports.deleteUser = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        if (req.user._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        let deletedUser = null;

        await session.withTransaction(async () => {
            const user = await User.findById(id).session(session);

            if (!user) {
                throw new Error('USER_NOT_FOUND');
            }

            // Protect the last admin
            if (user.role === 'admin') {
                const adminCount = await User.countDocuments({
                    role: 'admin'
                }).session(session);

                if (adminCount <= 1) {
                    throw new Error('LAST_ADMIN');
                }
            }

            await Note.deleteMany({
                userId: user._id
            }).session(session);

            await Post.deleteMany({
                userId: user._id
            }).session(session);

            await User.deleteOne({
                _id: user._id
            }).session(session);

            deletedUser = {
                _id: user._id,
                name: user.name,
                userName: user.userName
            };
        });

        return res.status(200).json({
            success: true,
            message: 'User and all associated notes and posts deleted successfully',
            data: deletedUser
        });

    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (error.message === 'LAST_ADMIN') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the last admin'
            });
        }

        console.error('Delete User Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

    } finally {
        await session.endSession();
    }
};
