import OrderItemService from "../../services/orderItem.service.js";
import db from '../../models/index.js';
const { Order, OrderItem, OrderItemModifier, MenuItem, ModifierOption, Table } = db;

// POST: Tạo mới OrderItem (Khách gọi thêm 1 món lẻ)
export const createOrderItem = async (req, res) => {
    try {
        const { order_id, menu_item_id } = req.body;

        // 1. Validate cơ bản
        if (!order_id || !menu_item_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu order_id hoặc menu_item_id'
            });
        }

        // ✅ 2. KIỂM TRA ORDER CÓ TỒN TẠI KHÔNG
        const existingOrder = await Order.findByPk(order_id);
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: `Order ID ${order_id} không tồn tại. Vui lòng tạo đơn mới.`,
                code: 'ORDER_NOT_FOUND'
            });
        }

        // ✅ 3. KIỂM TRA ORDER ĐÃ HOÀN TẤT/HỦY CHƯA
        if (['completed', 'cancelled', 'payment_request', 'payment_pending'].includes(existingOrder.status)) {
            let msg = 'Đơn hàng đã đóng.';
            if (existingOrder.status === 'completed') msg = 'Đơn hàng đã hoàn tất.';
            if (existingOrder.status === 'cancelled') msg = 'Đơn hàng đã bị hủy.';
            if (existingOrder.status.includes('payment')) msg = 'Đơn hàng đang trong quá trình thanh toán. Không thể gọi thêm món lúc này.';

            return res.status(400).json({
                success: false,
                message: msg,
                code: 'ORDER_LOCKED'
            });
        }

        // 4. Gọi Service tạo món
        // Service này sẽ INSERT vào DB với status mặc định là 'pending'
        await OrderItemService.createOrderItem(req.body);


        if (['ready', 'served'].includes(existingOrder.status)) {
            console.log(`🔔 Đánh thức đơn hàng ${order_id}: ${existingOrder.status} -> pending`);
            existingOrder.status = 'pending';
            await existingOrder.save(); // Lưu status mới xuống DB
        }

        // 3. [QUAN TRỌNG] Lấy lại toàn bộ thông tin đơn hàng để bắn Socket
        // Query này y hệt bên Kitchen Controller để đảm bảo dữ liệu đồng nhất
        const fullOrder = await Order.findByPk(order_id, {
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
                            as: 'menu_item', 
                            attributes: ['id', 'name', 'price', 'prep_time_minutes']
                        },
                        {
                            model: OrderItemModifier,
                            as: 'modifiers',
                            include: [{
                                model: ModifierOption,
                                as: 'modifier_option',
                                attributes: ['id', 'name', 'price_adjustment']
                            }]
                        }
                    ]
                }
            ]
        });

        if (fullOrder) {
            // 4. Bắn Socket cho Waiter - Khách đặt món MỚI
            if (req.io) {
                // ✅ Event rõ ràng: Đơn mới từ khách (chưa duyệt)
                req.io.emit('new_order_created', fullOrder);
                // Bắn thêm event này để chắc chắn UI Waiter cập nhật status mới
                req.io.emit('order_status_updated', fullOrder);

                // Bắn riêng cho bàn đó (để khách thấy món mình vừa đặt hiện lên ngay)
                if (fullOrder.table) {
                    req.io.emit(`order_update_table_${fullOrder.table.id}`, fullOrder);
                }

                console.log(`🔔 Socket sent: new_order_created for Table ${fullOrder.table?.table_number}`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Thêm món ăn thành công',
            data: fullOrder
        });

    } catch (error) {
        console.error('Lỗi Controller Create:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm món ăn',
        });
    }
};

// GET: Lấy danh sách món ăn theo order_id
export const getOrderItemsByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Gọi Service lấy dữ liệu
        const formattedItems = await OrderItemService.getItemsByOrderId(orderId);

        res.json({
            success: true,
            data: formattedItems
        });
    } catch (error) {
        console.error('Lỗi Controller GetItems:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy chi tiết món ăn',
            error: error.message
        });
    }
};