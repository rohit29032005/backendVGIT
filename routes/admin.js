const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(auth);
router.use(adminAuth);

// GET admin dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProjects = await Project.countDocuments();
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        
        const projects = await Project.find()
            .populate('author', 'name email')
            .sort({ createdAt: -1 });
            
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        const totalLikes = projects.reduce((sum, project) => sum + (project.likes?.length || 0), 0);
        const totalComments = projects.reduce((sum, project) => sum + (project.comments?.length || 0), 0);

        res.json({
            stats: {
                totalUsers,
                totalProjects,
                totalAdmins,
                totalLikes,
                totalComments
            },
            projects,
            users
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE project (admin only)
router.delete('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await Project.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE user (admin only)
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // Delete user's projects first
        await Project.deleteMany({ author: req.params.id });
        
        // Delete user
        await User.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'User and their projects deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT update user role (admin only)
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'admin', 'moderator'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();
        
        res.json({ 
            message: 'User role updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT feature/unfeature project (admin only)
router.put('/projects/:id/feature', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.featured = !project.featured;
        await project.save();
        
        res.json({ 
            message: `Project ${project.featured ? 'featured' : 'unfeatured'} successfully`,
            featured: project.featured
        });
    } catch (error) {
        console.error('Feature project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
