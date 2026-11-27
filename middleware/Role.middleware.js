 
module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.Role)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to access this resource"
            });
        }

        next();
    };
};
