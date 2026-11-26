module.exports=(app)=>
{
    const AuthController=require('../controllers/Auth.controller');
    const middleware=require('../middleware/Auth.middleware');
    const routes=require('express').Router();

    routes.post('/register',AuthController.Register);
    routes.post('/login',AuthController.Login);
    routes.get('/myprofile',AuthController.Myprofile);
    routes.post("/forgotpassword",AuthController.forgotpassword);
    routes.post("/reset-password/:token",AuthController.resetPassword);
    app.use('/api/auth',routes);
};

// Login generates token with UserID.
// Middleware verifies token.
// Middleware stores decoded data in req.user.
// GetProfile reads req.user.UserID.