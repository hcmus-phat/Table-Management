// src/models/order.js
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "customers",
        key: "uid",
      },
    },

    table_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tables",
        key: "id",
      },
    },

    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // --- SỬA LẠI ĐOẠN NÀY (Chỉ giữ 1 cái status duy nhất) ---
    status: {
      type: DataTypes.ENUM(
        "pending",    // Khách vừa đặt
        "confirmed",  // [MỚI] Waiter đã xác nhận -> Chuyển xuống bếp
        "preparing",  // Bếp đang nấu
        "ready",      // Bếp nấu xong
        "served",     // Đã mang ra bàn
        "payment",    // Khách gọi thanh toán
        "completed",  // Đã thanh toán xong
        "cancelled"   // Đã hủy
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    // -------------------------------------------------------

    ordered_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['cash', 'momo', 'vnpay', 'zalopay', 'stripe']]
      }
    },

    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["customer_id"],
      },
      {
        fields: ["table_id"],
      },
      {
        fields: ["ordered_at"],
      },
    ],
  }
);

Order.associate = (models) => {
  Order.belongsTo(models.Table, { 
    foreignKey: 'table_id', 
    as: 'table' 
  });

  Order.hasMany(models.OrderItem, { 
    foreignKey: 'order_id', 
    as: 'items' 
  });
};

export default Order;