 
module.exports = (app) => {
    const AuthController = require("../controllers/Auth.controller");
    const middleware = require("../middleware/Auth.middleware");
    const RoleMiddleware = require("../middleware/Role.middleware");

    const routes = require("express").Router();

    // Public routes
    routes.post("/register", AuthController.Register);
    routes.post("/login", AuthController.Login);
    routes.post("/forgotpassword", AuthController.forgotpassword);
    routes.post("/reset-password/:token", AuthController.resetPassword);

    // Authenticated route
    routes.get("/myprofile", middleware, AuthController.Myprofile);

    // Admin only
    routes.get(
        "/admin",
        middleware,
        RoleMiddleware("Admin"),
        (req, res) => {
            res.json({
                success: true,
                message: "Welcome Admin"
            });
        }
    );

    // Admin and RestaurantOwner
    routes.get(
        "/manage-food",
        middleware,
        RoleMiddleware("Admin", "RestaurantOwner"),
        (req, res) => {
            res.json({
                success: true,
                message: "You can manage food"
            });
        }
    );

    app.use("/api/auth", routes);
};
