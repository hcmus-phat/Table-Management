// controllers/restaurant/order.controller.js
import db from '../../models/index.js';
const { Order, OrderItem, OrderItemModifier, MenuItem, ModifierOption, Table } = db;

// GET: /api/admin/orders
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { 
                    model: Table, 
                    as: 'table',
                    attributes: ['id', 'table_number'] 
                },
                { 
                    model: OrderItem, 
                    as: 'items',
                    include: [
                        { 
                            model: MenuItem, 
                            as: 'menu_item', // Lưu ý: Alias phải khớp với model OrderItem (bạn đang để là 'menu_item')
                            attributes: ['name', 'price'] 
                        },
                        // 👇 MỚI: Lấy thêm Modifier để hiển thị (VD: Ít đường, Cay nhiều)
                        {
                            model: OrderItemModifier,
                            as: 'modifiers',
                            include: [
                                {
                                    model: ModifierOption,
                                    as: 'modifier_option',
                                    attributes: ['name', 'price_adjustment']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']] 
        });

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error('Get All Orders Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT: /api/admin/orders/:orderId/status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; 

        // 1. Tìm đơn hàng
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        // 2. Cập nhật trạng thái Order (Vỏ ngoài)
        order.status = status;
        
        if (status === 'payment' || status === 'completed') {
            order.completed_at = new Date();
        }
        
        await order.save();

        // 3. [FIX] Logic đồng bộ trạng thái món ăn (Items)
        // -------------------------------------------------------------
        
        // TRƯỜNG HỢP 1: Waiter duyệt đơn (confirmed) -> Các món chờ (pending) chuyển thành confirmed
        if (status === 'confirmed') {
             await OrderItem.update(
                { status: 'confirmed' }, 
                { 
                    where: { 
                        order_id: orderId, 
                        status: 'pending' // Chỉ update những món đang chờ
                    } 
                }
            );
        }
        // TRƯỜNG HỢP 2: Bếp nhận đơn (preparing) -> Các món confirmed chuyển thành preparing
        else if (status === 'preparing') {
            await OrderItem.update(
                { status: 'preparing' }, 
                { 
                    where: { 
                        order_id: orderId, 
                        // Update cả pending (nếu bếp bấm luôn) và confirmed (đã duyệt)
                        status: ['pending', 'confirmed'] 
                    } 
                }
            );
        } 
        // TRƯỜNG HỢP 3: Hủy đơn -> Tất cả items cancelled
        else if (status === 'cancelled') {
            await OrderItem.update(
                { status: 'cancelled' }, 
                { where: { order_id: orderId } }
            );
        }
        // ❌ KHÔNG update items khi Order = 'completed' hoặc 'payment'
        // Items chỉ đi đến 'served', không có 'completed' trong ENUM
        // -------------------------------------------------------------

        // 4. Reload data để gửi Socket
        const updatedOrder = await Order.findByPk(orderId, {
            include: [
                { 
                    model: OrderItem, 
                    as: 'items',
                    include: [
                        { model: MenuItem, as: 'menu_item' },
                        {
                             model: OrderItemModifier,
                             as: 'modifiers',
                             include: [{ model: ModifierOption, as: 'modifier_option' }]
                        }
                    ]
                },
                { model: Table, as: 'table' }
            ]
        });

        // 5. Bắn Socket với events rõ ràng hơn
        if (updatedOrder.table_id) {
            req.io.emit(`order_update_table_${updatedOrder.table_id}`, updatedOrder);
        }
        req.io.emit('order_status_updated', updatedOrder);
        // Waiter duyệt đơn -> Bắn event riêng cho Kitchen
        if (status === 'confirmed') {
             req.io.emit('order_confirmed', updatedOrder); // ✅ Event mới rõ ràng hơn
        }

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data: updatedOrder
        });

    } catch (error) {
        console.error('Update Order Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ❌ REMOVED: updateOrderItemStatus duplicate
// Use /api/admin/kitchen/items/:itemId/status instead (kitchen.controller.js has better logic with auto-update Order status)