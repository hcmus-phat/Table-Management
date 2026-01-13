import express from 'express';
import { updateOrderStatus, getAllOrders } from '../../controllers/restaurant/order.controller.js'; 

const router = express.Router();

router.get('/', getAllOrders);

// Định nghĩa API: PUT /api/admin/orders/:orderId/status
router.put('/:orderId/status', updateOrderStatus);

// ❌ REMOVED: router.put('/items/:itemId/status', updateOrderItemStatus);
// Use /api/admin/kitchen/items/:itemId/status instead

export default router;