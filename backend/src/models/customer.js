import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcryptjs";
import VerifiedEmail from "./verifiedEmail.js"; 
class Customer extends Model {
  async comparePassword(candidatePassword) {
      // Nếu là Google user (không có password), luôn trả về false
      if (this.auth_method === 'google') {
        console.log("[MODEL] Google user - không kiểm tra password");
        return false; 
      }
      
      if (!this.password) {
        throw new Error("Tài khoản không có mật khẩu. Vui lòng đặt lại mật khẩu.");
      }
      
      if (!candidatePassword) {
        return false;
      }
  
      // So sánh password bình thường
      return bcrypt.compare(candidatePassword, this.password);
    }
}

Customer.init(
  {
    uid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: false,
      validate: {
        isEmail: true
      }
    },
    auth_method: {
      type: DataTypes.ENUM('email', 'google'),
      allowNull: true,
      defaultValue: 'email',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: "customers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeCreate: async (customer) => {
        const salt = await bcrypt.genSalt(10);
        customer.password = await bcrypt.hash(customer.password, salt);
      },
      beforeUpdate: async (customer) => {
        if (customer.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          customer.password = await bcrypt.hash(customer.password, salt);
        }
      },
      afterUpdate: async (customer) => {
        if (customer.changed('email')) {
          await VerifiedEmail.create({
            customer_uid: customer.uid,
            email: customer.email,
            is_verified: false
          });
        }
      }
    }
  }
);

// Thiết lập quan hệ
Customer.hasMany(VerifiedEmail, {
  foreignKey: 'customer_uid',
  sourceKey: 'uid',
  as: 'verifiedEmails'
});

VerifiedEmail.belongsTo(Customer, {
  foreignKey: 'customer_uid',
  targetKey: 'uid',
  as: 'customer'
});

export default Customer;