 
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const db = require("./models");
const CreateRoles = require("./seeders/Role.seeder");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Food Ordering Backend is running successfully"
    });
});

// Register routes
require("./routes/Auth.routes")(app);

async function startServer() {
    try {
        await db.sequelize.authenticate();
        console.log("PostgreSQL connected successfully");

        // Ensure RoleMaster exists without altering all tables
        await db.roleMaster.sync();
        console.log("RoleMaster table is ready");

        await CreateRoles();

        const PORT = process.env.PORT || 9010;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
