import express from "express";
import {
    createOrder,
    getMyOrders
} from "../../controllers/customer/orderHistory.controller.js"
import authCustomer from "../../middlewares/authCustomer.middleware.js";

const router = express.Router()

router.use(authCustomer);

// POST /api/customer/orders - Tạo order mới
router.post("/", createOrder);

// GET /api/customer/orders - Lấy danh sách orders
router.get("/", getMyOrders);

export default router;