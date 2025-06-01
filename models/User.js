// Replace ENTIRE file with the simplified schema I provided
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    university: {
        type: String,
        default: 'VIT Vellore'
    },
    branch: {
        type: String,
        default: 'Computer Science'
    },
    year: {
        type: Number,
        default: 2
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    }
}, {
    timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
