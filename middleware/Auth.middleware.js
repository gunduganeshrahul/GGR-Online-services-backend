 
const jwt = require("jsonwebtoken");
const db = require("../models");

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await db.user.findByPk(decoded.UserID, {
            attributes: [
                "UserID",
                "UserName",
                "Email",
                "RoleID",
                "isActive"
            ],
            include: [
                {
                    model: db.roleMaster,
                    as: "role",
                    attributes: ["RoleID", "RoleName"]
                }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        if (!user.role) {
            return res.status(403).json({
                success: false,
                message: "User role not found"
            });
        }

        req.user = {
            UserID: user.UserID,
            UserName: user.UserName,
            Email: user.Email,
            RoleID: user.RoleID,
            Role: user.role.RoleName
        };

        next();

    } catch (error) {
        console.error("Authentication Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};
