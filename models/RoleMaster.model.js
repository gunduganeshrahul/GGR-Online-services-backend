 
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class RoleMaster extends Model {}

    RoleMaster.init(
        {
            RoleID: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            RoleName: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            }
        },
        {
            sequelize,
            modelName: "RoleMaster",
            tableName: "RoleMaster",
            timestamps: true
        }
    );

    return RoleMaster;
};
