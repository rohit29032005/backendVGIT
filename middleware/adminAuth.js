const adminAuth = (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.',
                userRole: req.user.role 
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error in admin authentication' });
    }
};

module.exports = adminAuth;
