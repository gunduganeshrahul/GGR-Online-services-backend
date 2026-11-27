 
const db = require("../models");

const CreateRoles = async () => {
    try {
        const roles = [
            { RoleName: "Admin" },
            { RoleName: "Customer" },
            { RoleName: "RestaurantOwner" }
        ];

        for (const role of roles) {
            await db.roleMaster.findOrCreate({
                where: {
                    RoleName: role.RoleName
                },
                defaults: role
            });
        }

        console.log("Roles created successfully");
    } catch (error) {
        console.error("Role creation failed:", error.message);
        throw error;
    }
};

module.exports = CreateRoles;
