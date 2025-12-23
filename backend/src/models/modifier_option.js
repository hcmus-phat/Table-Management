import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class ModifierOption extends Model {}

ModifierOption.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // gen_random_uuid()
      primaryKey: true,
    },

    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    price_adjustment: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0, // CHECK (price_adjustment >= 0)
      },
    },

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "active",
      validate: {
        isIn: [["active", "inactive"]],
      },
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize, // ⚠️ bắt buộc
    modelName: "ModifierOption",
    tableName: "modifier_options",
    timestamps: false, // vì đã có created_at
    underscored: true,
  }
);

export default ModifierOption;
