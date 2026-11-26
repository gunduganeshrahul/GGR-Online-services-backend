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
db.user=require("../models/User.model")(sequelize);


db.sequelize = sequelize;

module.exports = db;