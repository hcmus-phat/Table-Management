import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';

import authRoutes from './auth.routes.js';
import restaurantRoutes from './restaurant/index.js';
import customerRoutes from './customer/index.js';
import customerAuth from './customer/customerAuth.routes.js';
import orderHistoryRoutes from './customer/orderHistory.routes.js';
import orderItemRoutes from './customer/orderItem.routes.js';
import paymentRoutes from './customer/payment.routes.js';

const router = express.Router();

// 1. Auth & Admin
router.use('/auth', authRoutes);
router.use('/admin', verifyToken, restaurantRoutes);

// 2. Customer Auth & Info
router.use('/customer', customerAuth);

// 3. Payment (PHẢI ĐẶT TRƯỚC orderHistoryRoutes để tránh conflict path)
router.use('/customer', paymentRoutes);

// 4. Orders: Khớp với API GET /api/customer/orders
router.use('/customer/orders', orderHistoryRoutes); 

// 5. Order Items: Khớp với API POST /api/customer/order-items
router.use('/customer/order-items', orderItemRoutes); 

// 6. Khu vực Khách hàng khác
router.use('/', customerRoutes);

export default router;