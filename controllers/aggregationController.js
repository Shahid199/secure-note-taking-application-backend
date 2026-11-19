
const User = require('../models/User');
const mongoose = require('mongoose');

// Scenario 1: Group Users by Interests
exports.groupUsersByInterests = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        // Exactly ONE aggregate() call
        const result = await User.aggregate([
            {
                $unwind: '$interests'
            },
            {
                $group: {
                    _id: '$interests',
                    users: {
                        $push: '$name'
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    pagination: [
                        { $count: 'total' }
                    ]
                }
            }
        ]);

        const data = result[0]?.data || [];
        const total = result[0]?.pagination[0]?.total || 0;

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Group Interests Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.getPost = async (req, res) => {
    try {
        const { userId } = req.params;

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;

        let pipeline = [];

        // Specific user's posts
        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            pipeline = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $lookup: {
                        from: 'posts',
                        localField: '_id',
                        foreignField: 'userId',
                        pipeline: [
                            {
                                $facet: {
                                    data: [
                                        { $sort: { createdAt: -1, _id: -1 } },
                                        { $skip: skip },
                                        { $limit: limit }
                                    ],
                                    pagination: [
                                        { $count: 'total' }
                                    ]
                                }
                            }
                        ],
                        as: 'postResult'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        userName: 1,
                        posts: {
                            $ifNull: [
                                { $arrayElemAt: ['$postResult.data', 0] },
                                []
                            ]
                        },
                        totalPosts: {
                            $ifNull: [
                                { $arrayElemAt: ['$postResult.pagination.total', 0] },
                                0
                            ]
                        }
                    }
                }
            ];
        } 

        // All users' posts
        else {
            pipeline = [
                {
                    $lookup: {
                        from: 'posts',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'posts'
                    }
                },
                {
                    $unwind: '$posts'
                },
                {
                    $project: {
                        _id: '$posts._id',
                        postText: '$posts.postText',
                        createdAt: '$posts.createdAt',
                        user: {
                            _id: '$_id',
                            name: '$name',
                            userName: '$userName'
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1,
                        _id: -1
                    }
                },
                {
                    $facet: {
                        data: [
                            { $skip: skip },
                            { $limit: limit }
                        ],
                        pagination: [
                            { $count: 'total' }
                        ]
                    }
                }
            ];
        }

        const result = await User.aggregate(pipeline);

        // Specific user's posts response
        if (userId) {
            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'User posts retrieved successfully',
                data: {
                    user: {
                        _id: result[0]._id,
                        name: result[0].name,
                        userName: result[0].userName
                    },
                    posts: result[0].posts,
                    pagination: {
                        total: result[0].totalPosts,
                        page,
                        limit,
                        totalPages: Math.ceil(result[0].totalPosts / limit)
                    }
                }
            });
        }

        // All posts response
        const data = result[0]?.data || [];
        const total = result[0]?.pagination[0]?.total || 0;

        return res.status(200).json({
            success: true,
            message: 'All posts retrieved successfully',
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get Post Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


