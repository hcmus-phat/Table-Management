import OrderItemService from "../../services/orderItem.service.js";

// POST: Tạo mới OrderItem
export const createOrderItem = async (req, res) => {
    try {
        const { order_id, menu_item_id } = req.body;

        // Validate cơ bản tại controller
        if (!order_id || !menu_item_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu order_id hoặc menu_item_id'
            });
        }

        const result = await OrderItemService.createOrderItem(req.body);

        res.status(201).json({
            success: true,
            message: 'Thêm món ăn vào đơn hàng thành công',
            data: result
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