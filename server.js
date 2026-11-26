 
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const db = require("./models");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Food Ordering Backend is running successfully"
    });
});

require("./routes/Auth.routes")(app);

db.sequelize
    .authenticate()
    .then(() => {
        console.log("PostgreSQL connected successfully");

        return db.sequelize.sync({ alter: true });
    })
    .then(() => {
        console.log("Tables synchronized successfully");

        const PORT = process.env.PORT || 9010;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database connection error:", error);
    });
