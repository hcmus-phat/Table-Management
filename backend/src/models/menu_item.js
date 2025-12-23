import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class MenuItem extends Model {}

MenuItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // gen_random_uuid()
      primaryKey: true,
    },

    restaurant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01, // CHECK (price > 0)
      },
    },

    prep_time_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 240,
      },
    },

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["available", "unavailable", "sold_out"]],
      },
    },

    is_chef_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "MenuItem",
    tableName: "menu_items",
    timestamps: false,
    underscored: true,
  }
);

export default MenuItem;
