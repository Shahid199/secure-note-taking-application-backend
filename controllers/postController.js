
const Post = require('../models/Post');

// Create Post
exports.createPost = async (req, res) => {
    try {
        const { postText } = req.body;

        if (typeof postText !== 'string' || !postText.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Post text is required'
            });
        }

        const post = await Post.create({
            userId: req.user._id,
            postText: postText.trim()
        });

        return res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post
        });

    } catch (error) {
        console.error('Create Post Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
