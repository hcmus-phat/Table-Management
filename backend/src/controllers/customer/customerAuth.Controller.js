import customerService from "../../services/customer.service.js";
import customerValidator from "../../validators/customer.validator.js";

// --- 1. REGISTER ---
export const register = async (req, res) => {
  try {
    const { error } = customerValidator.register.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const { username, email, password } = req.body;
    const result = await customerService.register(username, email, password);

    const customerData = result.customer.toJSON();
    delete customerData.password;

    return res.status(201).json({
      message: "Đăng ký thành công",
      customer: customerData,
      accessToken: result.accessToken
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// --- 2. LOGIN ---
export const login = async (req, res) => {
  try {
    const { error } = customerValidator.login.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const { username, password } = req.body;
    const result = await customerService.login(username, password);

    const customerData = result.customer.toJSON();
    delete customerData.password;

    return res.status(200).json({
      message: "Đăng nhập thành công",
      customer: customerData,
      accessToken: result.accessToken
    });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

// --- 3. GET CUSTOMER PROFILE --- DÙNG uid
export const getMe = async (req, res) => {
  try {
    console.log("=== DEBUG getMe ===");
    console.log("req.user:", req.user);
    
    const uid = req.user?.uid;  // DÙNG uid
    
    if (!uid) {
      return res.status(401).json({ 
        error: "Không tìm thấy thông tin người dùng trong request" 
      });
    }
    
    console.log("Getting customer with uid:", uid);
    
    const customer = await customerService.getCustomer(uid);

    const customerData = customer.toJSON ? customer.toJSON() : customer;
    
    return res.status(200).json({
      success: true,
      customer: {
        uid: customerData.uid,
        username: customerData.username,
        email: customerData.email,
        fullName: customerData.fullName || null,
        phone: customerData.phone || null,
        address: customerData.address || null,
        dateOfBirth: customerData.dateOfBirth || null,
        createdAt: customerData.createdAt,
        updatedAt: customerData.updatedAt
      }
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    return res.status(404).json({ 
      error: error.message || "Không thể lấy thông tin" 
    });
  }
};

// --- 4. UPDATE PROFILE --- DÙNG uid
export const updateMe = async (req, res) => {
  try {
    const uid = req.user?.uid;  // DÙNG uid
    
    if (!uid) {
      return res.status(401).json({ 
        error: "Không tìm thấy thông tin người dùng" 
      });
    }

    const { error } = customerValidator.update.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedCustomer = await customerService.updateCustomer(uid, req.body);

    const customerData = updatedCustomer.toJSON();
    delete customerData.password;

    return res.status(200).json({
      message: "Cập nhật thành công",
      customer: customerData
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// --- 5. CHANGE PASSWORD --- DÙNG uid
export const changePassword = async (req, res) => {
  try {
    const uid = req.user?.uid;  // DÙNG uid
    
    if (!uid) {
      return res.status(401).json({ 
        error: "Không tìm thấy thông tin người dùng" 
      });
    }

    const { error } = customerValidator.changePassword.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { oldPassword, newPassword } = req.body;
    await customerService.changePassword(uid, oldPassword, newPassword);

    return res.status(200).json({
      message: "Thay đổi mật khẩu thành công"
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};