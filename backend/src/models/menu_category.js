import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class MenuCategory extends Model {}

MenuCategory.init(
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

    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "MenuCategory",
    tableName: "menu_categories",
    timestamps: false,
    underscored: true,

    // UNIQUE (restaurant_id, name)
    indexes: [
      {
        unique: true,
        fields: ["restaurant_id", "name"],
      },
    ],
  }
);

export default MenuCategory;
