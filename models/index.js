 
const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
        port: dbConfig.port,
        pool: dbConfig.pool,
        logging: false
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Register models
db.user = require("./User.model")(sequelize);
db.roleMaster = require("./RoleMaster.model")(sequelize);

// Define relationships
db.roleMaster.hasMany(db.user, {
    foreignKey: "RoleID",
    as: "users"
});

db.user.belongsTo(db.roleMaster, {
    foreignKey: "RoleID",
    as: "role"
});

module.exports = db;
