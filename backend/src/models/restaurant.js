import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Restaurant extends Model {}

Restaurant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: "active",
      validate: {
        isIn: [["active", "inactive"]],
      },
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Restaurant",
    tableName: "restaurants",
    timestamps: false,
    underscored: true,
  }
);

export default Restaurant;
