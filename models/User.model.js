 
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class User extends Model {}

    User.init(
        {
            UserID: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            UserName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            Email: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false
            },
            Password: {
                type: DataTypes.STRING,
                allowNull: false
            },
            Phone: {
                type: DataTypes.STRING,
                allowNull: false
            },
            RoleID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "RoleMaster",
                    key: "RoleID"
                }
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            reset_token: {
                type: DataTypes.STRING,
                allowNull: true
            },
            reset_token_expiry: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "User",
            tableName: "Users",
            timestamps: true
        }
    );

    return User;
};
