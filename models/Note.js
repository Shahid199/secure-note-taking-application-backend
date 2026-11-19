const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        noteText: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Index for user's notes listing
noteSchema.index({ userId: 1 });

module.exports = mongoose.model('Note', noteSchema);