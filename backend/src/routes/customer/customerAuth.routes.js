// src/routes/customer/customerAuth.routes.js
import express from "express";
import { 
  register, 
  login, 
  getMe, 
  updateMe, 
  changePassword 
} from "../../controllers/customer/customerAuth.Controller.js";
import authCustomer from "../../middlewares/authCustomer.middleware.js"; 

const router = express.Router();

// Public routes (không cần auth)
router.post("/register", register);
router.post("/login", login);

// Protected routes (cần auth)
router.get("/me", authCustomer, getMe);           // Thêm middleware
router.put("/me", authCustomer, updateMe);        // Thêm middleware  
router.put("/change-password", authCustomer, changePassword); // Thêm middleware

export default router;