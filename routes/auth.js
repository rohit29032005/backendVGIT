const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Register route
router.post('/register', async (req, res) => {
    try {
        console.log('🔄 Registration attempt:', req.body);
        
        const { name, email, password, university, branch, year } = req.body;
        
        // Validate required fields
        if (!name || !email || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                message: 'Name, email, and password are required' 
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Please enter a valid email address' 
            });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({ 
                message: 'User already exists with this email' 
            });
        }
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create user data object
        const userData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            university: university || 'VIT Vellore',
            branch: branch || 'Computer Science',
            year: parseInt(year) || 2,
            role: 'user'
        };
        
        console.log('📝 Creating user with data:', { ...userData, password: '[HIDDEN]' });
        
        // Create and save new user
        const newUser = new User(userData);
        await newUser.save();
        
        console.log('✅ User saved successfully:', newUser.email);
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        console.log('✅ Registration successful for:', newUser.email);
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                university: newUser.university,
                branch: newUser.branch,
                year: newUser.year,
                role: newUser.role
            }
        });
        
    } catch (error) {
        console.error('❌ Registration error details:', error);
        
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'User already exists with this email' 
            });
        }
        
        // Handle MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error',
                errors: validationErrors
            });
        }
        
        // Handle other errors
        res.status(500).json({ 
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('🔄 Login attempt for:', req.body.email);
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid credentials' 
            });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                message: 'Invalid credentials' 
            });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login successful for:', user.email);
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                university: user.university,
                branch: user.branch,
                year: user.year,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login'
        });
    }
});

// Get user profile route - THIS WAS MISSING!
router.get('/profile', verifyToken, async (req, res) => {
    try {
        console.log('🔄 Getting profile for user:', req.userId);
        
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('✅ Profile found:', user.email, 'Role:', user.role);
        
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                university: user.university,
                branch: user.branch,
                year: user.year,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('❌ Profile error:', error);
        res.status(500).json({ message: 'Server error getting profile' });
    }
});

module.exports = router;
