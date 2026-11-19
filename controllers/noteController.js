const { userInfo } = require("node:os");
const Note = require("../models/Note");
const mongoose = require("mongoose");

// Create Note
exports.createNote = async (req, res) => {
  try {
    const { noteText } = req.body;

    if (typeof noteText !== "string" || !noteText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note text is required",
      });
    }

    const note = await Note.create({
      userId: req.user._id,
      noteText: noteText.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get My Notes
exports.getMyNotes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user._id,
    };

    const [notes, total] = await Promise.all([
      Note.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),

      Note.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Single Own Note
exports.getNote = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Own Note
exports.updateNote = async (req, res) => {
  try {
    const { noteText } = req.body;

    if (typeof noteText !== "string" || !noteText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note text is required",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      {
        $set: {
          noteText: noteText.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Own Note
exports.deleteNote = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin: Get All Users' Notes
exports.getAllNotes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // const [notes, total] = await Promise.all([
    //     Note.find()
    //         .populate('userId', 'name userName role')
    //         .sort({ createdAt: -1 })
    //         .skip(skip)
    //         .limit(limit),

    //     Note.countDocuments()
    // ]);

    const [notes, totalResult] = await Promise.all([
      Note.aggregate([
        // Join users collection
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },

        // Convert user array into object
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Select required fields
        {
          $project: {
            noteText: 1,
            createdAt: 1,
            updatedAt: 1,
            userInfo: {
              _id: "$user._id",
              name: "$user.name",
              userName: "$user.userName",
              role: "$user.role",
            },
          },
        },

        // Sort latest first
        {
          $sort: {
            createdAt: -1,
          },
        },

        // Pagination
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]),

      Note.aggregate([
        {
          $count: "total",
        },
      ]),
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    return res.status(200).json({
      success: true,
      data: notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
