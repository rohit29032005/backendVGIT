const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    technologies: [{
        type: String,
        required: true
    }],
    category: {
        type: String,
        required: true,
        enum: ['Web Development', 'Mobile App', 'AI/ML', 'Data Science', 'Game Development', 'IoT', 'Blockchain', 'Other']
    },
    githubUrl: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^https:\/\/github\.com\//.test(v);
            },
            message: 'GitHub URL must start with https://github.com/'
        }
    },
    liveUrl: String,
    images: [{
        type: String // URLs to uploaded images
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: true,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for search functionality
projectSchema.index({ title: 'text', description: 'text', technologies: 'text' });

module.exports = mongoose.model('Project', projectSchema);
