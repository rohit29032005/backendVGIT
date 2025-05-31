const express = require('express');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
    res.json({ message: 'Projects route working!' });
});

// GET all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find({ status: 'published' })
            .populate('author', 'name university branch year')
            .sort({ createdAt: -1 });
            
        res.json({
            message: 'Projects fetched successfully',
            projects,
            count: projects.length
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST create project
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, technologies, category, githubUrl, liveUrl } = req.body;
        
        const project = new Project({
            title,
            description,
            technologies,
            category,
            githubUrl,
            liveUrl,
            author: req.user._id
        });
        
        await project.save();
        await project.populate('author', 'name university branch year');
        
        res.status(201).json({
            message: 'Project created successfully',
            project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PUT update project (ADD THIS NEW ROUTE)
router.put('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        // Check if user is the author
        if (project.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }
        
        const {
            title,
            description,
            technologies,
            category,
            githubUrl,
            liveUrl,
            images,
            status
        } = req.body;
        
        // Update fields if provided
        if (title !== undefined) project.title = title;
        if (description !== undefined) project.description = description;
        if (technologies !== undefined) project.technologies = technologies;
        if (category !== undefined) project.category = category;
        if (githubUrl !== undefined) project.githubUrl = githubUrl;
        if (liveUrl !== undefined) project.liveUrl = liveUrl;
        if (images !== undefined) project.images = images;
        if (status !== undefined) project.status = status;
        
        await project.save();
        await project.populate('author', 'name university branch year');
        
        res.json({
            message: 'Project updated successfully',
            project
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST like/unlike project
router.post('/:id/like', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        const existingLike = project.likes.find(
            like => like.user.toString() === req.user._id.toString()
        );
        
        if (existingLike) {
            project.likes = project.likes.filter(
                like => like.user.toString() !== req.user._id.toString()
            );
        } else {
            project.likes.push({ user: req.user._id });
        }
        
        await project.save();
        
        res.json({
            message: existingLike ? 'Project unliked successfully' : 'Project liked successfully',
            likesCount: project.likes.length,
            isLiked: !existingLike
        });
    } catch (error) {
        console.error('Like project error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST add comment to project
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: 'Comment text is required' });
        }
        
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        const newComment = {
            user: req.user._id,
            text: text.trim()
        };
        
        project.comments.push(newComment);
        await project.save();
        
        await project.populate('comments.user', 'name university branch year');
        
        const addedComment = project.comments[project.comments.length - 1];
        
        res.status(201).json({
            message: 'Comment added successfully',
            comment: addedComment,
            totalComments: project.comments.length
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
