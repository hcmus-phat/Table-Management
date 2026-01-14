import Order from '../../models/order.js';
import OrderItem from '../../models/orderItem.js';

/**
 * [CUSTOMER] Yêu cầu thanh toán
 * POST /api/customer/orders/:orderId/request-payment
 * Body: { payment_method: 'cash' | 'momo' | 'vnpay' | 'zalopay' | 'stripe' }
 */
export const requestPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_method = 'cash' } = req.body;

    // 1. Lấy thông tin order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          association: 'items',
          include: ['menu_item', { association: 'modifiers', include: ['modifier_option'] }],
        },
        { association: 'table' },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng',
      });
    }

    // 2. Kiểm tra trạng thái đơn
    if (order.status === 'payment' || order.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Đơn hàng đã được yêu cầu thanh toán hoặc đã hoàn tất',
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Đơn hàng đã bị hủy',
      });
    }

    // 3. Kiểm tra TẤT CẢ món đã served chưa
    const items = order.items || [];
    const activeItems = items.filter(i => i.status !== 'cancelled');
    
    if (activeItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Không có món nào trong đơn hàng',
      });
    }

    const allServed = activeItems.every(i => i.status === 'served');
    if (!allServed) {
      const unservedCount = activeItems.filter(i => i.status !== 'served').length;
      return res.status(400).json({
        success: false,
        error: `Vui lòng đợi tất cả món được phục vụ (còn ${unservedCount} món chưa lên)`,
      });
    }

    // 4. Cập nhật trạng thái đơn sang 'payment'
    order.status = 'payment';
    order.payment_method = payment_method;
    await order.save();

    // 5. Reload để lấy data đầy đủ
    await order.reload({
      include: [
        {
          association: 'items',
          include: ['menu_item', { association: 'modifiers', include: ['modifier_option'] }],
        },
        { association: 'table' },
      ],
    });

    // 6. Emit socket thông báo Waiter
    req.io.emit('order_status_updated', order);
    
    if (order.table_id) {
      req.io.emit(`order_update_table_${order.table_id}`, order);
    }

    return res.json({
      success: true,
      message: `Đã yêu cầu thanh toán bằng ${payment_method}`,
      data: order,
    });
  } catch (error) {
    console.error('Request payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi yêu cầu thanh toán',
    });
  }
};

/**
 * [CUSTOMER] Hoàn tất thanh toán (sau khi payment gateway callback)
 * POST /api/customer/orders/:orderId/complete-payment
 * Body: { transaction_id: string, payment_method: string }
 */
export const completePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transaction_id, payment_method } = req.body;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          association: 'items',
          include: ['menu_item', { association: 'modifiers', include: ['modifier_option'] }],
        },
        { association: 'table' },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng',
      });
    }

    if (order.status !== 'payment') {
      return res.status(400).json({
        success: false,
        error: 'Đơn hàng chưa ở trạng thái chờ thanh toán',
      });
    }

    // Cập nhật thông tin thanh toán
    order.status = 'completed';
    order.transaction_id = transaction_id;
    order.payment_method = payment_method || order.payment_method;
    order.completed_at = new Date();
    await order.save();

    // Reload data
    await order.reload({
      include: [
        {
          association: 'items',
          include: ['menu_item', { association: 'modifiers', include: ['modifier_option'] }],
        },
        { association: 'table' },
      ],
    });

    // Emit socket
    req.io.emit('order_status_updated', order);
    
    if (order.table_id) {
      req.io.emit(`order_update_table_${order.table_id}`, order);
    }

    return res.json({
      success: true,
      message: 'Thanh toán thành công',
      data: order,
    });
  } catch (error) {
    console.error('Complete payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi hoàn tất thanh toán',
    });
  }
};

/**
 * [MOCK] VNPay Payment Callback
 * GET /api/customer/payment/vnpay-callback?orderId=xxx&status=success
 */
export const vnpayCallback = async (req, res) => {
  try {
    const { orderId, status, transactionId } = req.query;

    if (status === 'success') {
      // Gọi completePayment
      const order = await Order.findByPk(orderId);
      if (order && order.status === 'payment') {
        order.status = 'completed';
        order.transaction_id = transactionId || `VNPAY_${Date.now()}`;
        order.completed_at = new Date();
        await order.save();

        // Emit socket
        await order.reload({
          include: [
            { association: 'items', include: ['menu_item', { association: 'modifiers', include: ['modifier_option'] }] },
            { association: 'table' },
          ],
        });
        req.io.emit('order_status_updated', order);
        if (order.table_id) {
          req.io.emit(`order_update_table_${order.table_id}`, order);
        }
      }

      // Redirect về trang success
      return res.redirect(`/customer/payment-success?orderId=${orderId}`);
    } else {
      return res.redirect(`/customer/payment-failed?orderId=${orderId}`);
    }
  } catch (error) {
    console.error('VNPay callback error:', error);
    return res.status(500).send('Payment processing error');
  }
};

/**
 * [MOCK] MoMo Payment Callback
 */
export const momoCallback = async (req, res) => {
  // Similar to VNPay
  try {
    const { orderId, resultCode, transId } = req.body;

    if (resultCode === '0') {
      const order = await Order.findByPk(orderId);
      if (order && order.status === 'payment') {
        order.status = 'completed';
        order.transaction_id = transId || `MOMO_${Date.now()}`;
        order.completed_at = new Date();
        await order.save();

        await order.reload({
          include: [
            { association: 'items', include: ['menu_item', { association: 'modifiers', include: ['modifier_option'] }] },
            { association: 'table' },
          ],
        });
        req.io.emit('order_status_updated', order);
        if (order.table_id) {
          req.io.emit(`order_update_table_${order.table_id}`, order);
        }
      }

      return res.json({ success: true, message: 'Payment successful' });
    } else {
      return res.json({ success: false, message: 'Payment failed' });
    }
  } catch (error) {
    console.error('MoMo callback error:', error);
    return res.status(500).json({ success: false, error: 'Payment processing error' });
  }
};
