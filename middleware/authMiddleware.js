
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication Middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};


// Authorization Middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            console.log('Logged in user:', req.user);
        console.log('User role:', req.user?.role);
        console.log('Allowed roles:', roles);


        
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        
        }
        
        next();
    };
};

module.exports = {
    authenticate,
    authorize
};
