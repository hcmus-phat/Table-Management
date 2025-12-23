import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class MenuItemModifierGroup extends Model {}

MenuItemModifierGroup.init(
  {
    menu_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: "MenuItemModifierGroup",
    tableName: "menu_item_modifier_groups",
    timestamps: false, // bảng trung gian thường không cần timestamps
    underscored: true,
  }
);

export default MenuItemModifierGroup;
