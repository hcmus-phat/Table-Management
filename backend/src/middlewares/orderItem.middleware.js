// middleware/orderItem.middleware.js

export const validateCreateOrderItem = (req, res, next) => {
  const { order_id, menu_item_id, quantity, price_at_order } = req.body;
  
  if (!order_id || !menu_item_id || !quantity || !price_at_order) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu thông tin bắt buộc'
    });
  }
  
  next();
};
