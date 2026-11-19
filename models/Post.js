const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        postText: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Index for user's posts and lookup
postSchema.index({
    userId: 1,
    createdAt: -1,
    _id: -1
});

module.exports = mongoose.model('Post', postSchema);