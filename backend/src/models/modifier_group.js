import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class ModifierGroup extends Model {}

ModifierGroup.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    restaurant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    selection_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["single", "multiple"]],
      },
    },

    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    min_selections: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    max_selections: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    modelName: "ModifierGroup",
    tableName: "modifier_groups",
    timestamps: false,
    underscored: true,
  }
);

export default ModifierGroup;
