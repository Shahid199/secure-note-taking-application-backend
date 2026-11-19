require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const aggregateRoutes = require('./routes/aggregationRoutes');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        await connectDB();
        app.use('/api/auth', authRoutes);
        app.use('/api/note', noteRoutes);
        app.use('/api/aggregation', aggregateRoutes);
        app.use('/api/post', postRoutes);
        app.use('/api/user', userRoutes);


        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exit(1);
    }
};

startServer();

// const User = require('./models/User');
// const Note = require('./models/Note');
// const Post = require('./models/Post');

// const createCollections = async () => {
//     try {
//         // await User.createCollection();
//         // await Note.createCollection();
//         //  await Post.createCollection();
//         await User.createIndexes();
//         await Note.createIndexes();
//         await Post.createIndexes();

//         console.log('Collections and indexes created');

//         console.log('All collections created successfully');
//     } catch (error) {
//         console.error('Collection creation error:', error.message);
//     }
// };