
const User = require('../models/User');
const jwt = require('jsonwebtoken');
exports.register = async (req, res) => {
    try {
        const { name, userName, password, interests } = req.body;

        // Required field validation
        if (!name || !userName || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, username and password are required'
            });
        }

        // Password validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        // Validate interests
        if (interests !== undefined && !Array.isArray(interests)) {
            return res.status(400).json({
                success: false,
                message: 'Interests must be an array'
            });
        }

        // Check existing username
        const existingUser = await User.findOne({
            userName: userName.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Create new user
        const user = await User.create({
            name,
            userName,
            password,
            interests: interests || [],
            role: 'user'
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });

    } catch (error) {
        // Handle duplicate username race condition
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error('Registration Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.login = async (req, res) => {
    try {
        const { userName, password } = req.body;

        // Validate required fields
        if (!userName || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user and include password
        const user = await User.findOne({
            userName: userName.trim().toLowerCase()
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1d'
            }
        );

        // Send response
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token
        });

    } catch (error) {
        console.error('Login Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
