import Customer from "../models/customer.js"; 
import jwt from "jsonwebtoken";

class CustomerService {

    // Tạo token với uid
    generateAccessToken(customer){
        return jwt.sign(
            {
                uid: customer.uid,        
                username: customer.username,
                email: customer.email,
                role: "customer"
            },
            process.env.JWT_SECRET || "customer-token-secret",
            { expiresIn: "24h" }
        );
    }

    verifyToken(token){
        try{
            return jwt.verify(token, process.env.JWT_SECRET || "customer-token-secret");
        }catch(error){
            throw new Error("Token không hợp lệ");
        } 
    }

    // Đăng ký
    async register(username, email, password){
        const existAccount = await Customer.findOne({
            where: { username: username }
        });

        if(existAccount){
            throw new Error("Username đã được sử dụng");
        }

        const existEmail = await Customer.findOne({
            where: { email: email }
        })

        if(existEmail){
            throw new Error("Email đã được sử dụng");
        }

        const customer = await Customer.create({username, email, password});
        const accessToken = this.generateAccessToken(customer);

        return {customer, accessToken};
    }

    // Đăng nhập
    async login(username, password){
        const customer = await Customer.findOne({
            where: { username: username }
        })

        if(!customer){
            throw new Error("Sai mật khẩu hoặc tên đăng nhập");
        }

        const isValid = await customer.comparePassword(password);
        if(!isValid) {
            throw new Error("Sai mật khẩu hoặc tên đăng nhập");
        }

        const accessToken = this.generateAccessToken(customer);
        return { customer, accessToken };
    }

    // Lấy thông tin khách hàng bằng uid
    async getCustomer(uid){  // NHỚ: parameter là uid
        const customer = await Customer.findByPk(uid, {
            attributes: { exclude: ["password"] } 
        })

        if(!customer) throw new Error("Tài khoản không tồn tại");
        return customer;
    }

    // Cập nhật thông tin bằng uid
    async updateCustomer(uid, updateData){  // NHỚ: parameter là uid
        const customer = await Customer.findByPk(uid);
        if(!customer) throw new Error("Không tìm thấy tài khoản");

        if(updateData.username && updateData.username !== customer.username){
            const exists = await Customer.findOne({ 
                where: { username: updateData.username } 
            });
            if (exists) throw new Error("Username đã tồn tại");
        }

        if (updateData.email && updateData.email !== customer.email) {
            const exists = await Customer.findOne({ 
                where: { email: updateData.email } 
            });
            if (exists) throw new Error("Email đã được sử dụng");
        }

        await customer.update(updateData);
        return customer;
    }

    // Đổi mật khẩu bằng uid
    async changePassword(uid, oldPassword, newPassword){  // NHỚ: parameter là uid
        const customer = await Customer.findByPk(uid);
        if(!customer) throw new Error("Tài khoản không tồn tại");

        const isValid = await customer.comparePassword(oldPassword);
        if(!isValid) throw new Error("Mật khẩu cũ không đúng");

        await customer.update({password: newPassword});
        return true;
    }
}

export default new CustomerService();