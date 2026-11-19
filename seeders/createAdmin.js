
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        // Connect to MongoDB using existing database file
        await connectDB();

        const adminExists = await User.findOne({
            userName: process.env.ADMIN_USERNAME
        });

        if (adminExists) {
            console.log('Admin account already exists');
            return;
        }

        const admin = await User.create({
            name: process.env.ADMIN_NAME,
            userName: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
            interests: []
        });

        console.log('Admin created successfully:', admin.userName);

    } catch (error) {
        console.error('Admin creation failed:', error.message);

    } finally {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
    }
};

createAdmin();
