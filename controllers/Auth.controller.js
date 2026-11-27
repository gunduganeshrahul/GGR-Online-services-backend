 
const db = require("../models");

const Auth = db.user;
const RoleMaster = db.roleMaster;

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/mailer");




exports.Register = async (req, res) => {
    try {
        console.log("REGISTER API CALLED");

        const { UserName, Email, Password, Phone } = req.body;

        if (!UserName || !Email || !Password || !Phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        if (Password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const normalizedEmail = Email.trim().toLowerCase();

        const existed = await Auth.findOne({
            where: { Email: normalizedEmail }
        });

        if (existed) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Find Customer role
        const customerRole = await RoleMaster.findOne({
            where: { RoleName: "Customer" }
        });

        console.log("Customer Role Result:", customerRole);
        console.log("Customer RoleID:", customerRole?.RoleID);

        if (!customerRole) {
            return res.status(500).json({
                success: false,
                message: "Customer role not found"
            });
        }

        const HashPassword = await bcrypt.hash(Password, 10);

        // Debug BEFORE creating user
        console.log("Creating user with RoleID:", customerRole.RoleID);

        const User = await Auth.create({
            UserName: UserName.trim(),
            Email: normalizedEmail,
            Password: HashPassword,
            Phone: Phone.trim(),
            RoleID: customerRole.RoleID
        });

        console.log("USER CREATED:", User.UserID);

        return res.status(201).json({
            success: true,
            message: "Registered successfully",
            data: {
                UserID: User.UserID,
                UserName: User.UserName,
                Email: User.Email,
                Phone: User.Phone,
                RoleID: User.RoleID,
                Role: customerRole.RoleName
            }
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// ================= LOGIN =================

exports.Login = async (req, res) => {
    try {
        const { identifier, Password } = req.body;

        if (!identifier || !Password) {
            return res.status(400).json({
                success: false,
                message: "Email or Phone and Password are required"
            });
        }

        const value = identifier.trim();

        const where = value.includes("@")
            ? { Email: value.toLowerCase() }
            : { Phone: value };

        const User = await Auth.findOne({
            where,
            include: [
                {
                    model: RoleMaster,
                    as: "role",
                    attributes: ["RoleID", "RoleName"]
                }
            ]
        });

        if (!User) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/phone or password"
            });
        }

        if (!User.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        const IsMatch = await bcrypt.compare(
            Password,
            User.Password
        );

        if (!IsMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/phone or password"
            });
        }

        if (!User.role) {
            return res.status(403).json({
                success: false,
                message: "User role is not assigned"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        const token = jwt.sign(
            { UserID: User.UserID },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                UserID: User.UserID,
                UserName: User.UserName,
                Email: User.Email,
                Phone: User.Phone,
                RoleID: User.RoleID,
                Role: User.role.RoleName
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


// ================= MY PROFILE =================

exports.Myprofile = async (req, res) => {
    try {
        const User = await Auth.findByPk(req.user.UserID, {
            attributes: [
                "UserID",
                "UserName",
                "Email",
                "Phone",
                "RoleID"
            ],
            include: [
                {
                    model: RoleMaster,
                    as: "role",
                    attributes: ["RoleName"]
                }
            ]
        });

        if (!User) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: User
        });

    } catch (error) {
        console.error("My Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile"
        });
    }
};


// ================= FORGOT PASSWORD =================

exports.forgotpassword = async (req, res) => {
    try {
        const { Email } = req.body;

        if (!Email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const User = await Auth.findOne({
            where: {
                Email: Email.trim().toLowerCase()
            }
        });

        if (!User) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const resetTokenExpiry = new Date(
            Date.now() + 5 * 60 * 1000
        );

        User.reset_token = resetToken;
        User.reset_token_expiry = resetTokenExpiry;

        await User.save();

        if (!process.env.CLIENT_URL) {
            throw new Error("CLIENT_URL is not configured");
        }

        const resetLink =
            `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: User.Email,
            subject: "GGR Orders - Password Reset",
            html: `
                <p>Hello ${User.UserName},</p>
                <p>You requested a password reset.</p>
                <p>This link expires in 5 minutes.</p>
                <p><a href="${resetLink}">Reset Password</a></p>
                <p>If you did not request this, ignore this email.</p>
            `
        });

        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request"
        });
    }
};


// ================= RESET PASSWORD =================

exports.resetPassword = async (req, res) => {
    try {
        const { Password } = req.body;
        const { token } = req.params;

        if (!Password) {
            return res.status(400).json({
                success: false,
                message: "New password is required"
            });
        }

        if (Password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const User = await Auth.findOne({
            where: { reset_token: token }
        });

        if (!User) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset link"
            });
        }

        if (
            !User.reset_token_expiry ||
            new Date() > new Date(User.reset_token_expiry)
        ) {
            return res.status(400).json({
                success: false,
                message: "Reset link has expired. Please request a new one"
            });
        }

        User.Password = await bcrypt.hash(Password, 10);
        User.reset_token = null;
        User.reset_token_expiry = null;

        await User.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("Reset Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Password reset failed"
        });
    }
};
