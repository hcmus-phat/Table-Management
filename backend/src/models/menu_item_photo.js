import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class MenuItemPhoto extends Model {}

MenuItemPhoto.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // gen_random_uuid()
      primaryKey: true,
    },

    menu_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "MenuItemPhoto",
    tableName: "menu_item_photos",
    timestamps: false,
    underscored: true,
  }
);

export default MenuItemPhoto;
