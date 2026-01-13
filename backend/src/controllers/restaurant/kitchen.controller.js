// src/controllers/restaurant/kitchen.controller.js
import db from "../../models/index.js";
import { Op } from "sequelize";
const { Order, OrderItem, Table, MenuItem, OrderItemModifier, ModifierOption, Sequelize } = db;


// 1. Lấy danh sách orders cho Kitchen Display
export const getKitchenOrders = async (req, res) => {
  try {
    const { status } = req.query;

    // Mặc định lấy các đơn chưa hoàn thành
    let whereCondition = {
      status: ["pending", "confirmed", "preparing", "ready"],
    };

    if (status) {
      whereCondition.status = status.split(",");
    }

    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        {
          model: Table,
          as: "table",
          attributes: ["id", "table_number", "location"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: MenuItem,
              as: "menu_item",
              attributes: ["id", "name", "prep_time_minutes"],
            },
            {
              model: OrderItemModifier,
              as: "modifiers",
              include: [
                {
                  model: ModifierOption,
                  as: "modifier_option",
                  attributes: ["id", "name", "price_adjustment"],
                },
              ],
            },
          ],
        },
      ],
      order: [["ordered_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("[Kitchen Controller] getKitchenOrders Error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách đơn hàng",
      message: error.message,
    });
  }
};

// 2. Cập nhật status của order (QUAN TRỌNG NHẤT)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "pending", "confirmed", "preparing", "ready", 
      "served", "payment", "completed", "cancelled"
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Trạng thái không hợp lệ",
      });
    }

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng",
      });
    }

    // --- BƯỚC 1: CẬP NHẬT ORDER (VỎ NGOÀI) ---
    order.status = status;
    // ✅ FIX: Chỉ set completed_at khi THỰC SỰ hoàn tất (payment/completed)
    if (status === 'completed' || status === 'payment') {
      order.completed_at = new Date();
    }
    await order.save();

    // --- BƯỚC 2: CẬP NHẬT ITEM BÊN TRONG ---
    // Logic: Order thay đổi -> Items bên trong phải thay đổi theo
    
    if (status === 'preparing') {
        // Bếp ấn Nấu: Chuyển tất cả món "chờ" hoặc "đã xác nhận" sang "đang nấu"
        await OrderItem.update(
            { status: 'preparing' },
            { 
                where: { 
                    order_id: id,
                    status: { [Op.in]: ['pending', 'confirmed'] } 
                } 
            }
        );
    } 
    else if (status === 'ready') {
        // Bếp ấn Xong: Chuyển món "đang nấu" sang "sẵn sàng"
        await OrderItem.update(
            { status: 'ready' },
            { 
                where: { 
                    order_id: id,
                    status: 'preparing'
                } 
            }
        );
    }
    else if (status === 'served') {
        // Waiter đã mang món lên bàn: Items chuyển sang served
        await OrderItem.update(
            { status: 'served' },
            { 
                where: { 
                    order_id: id,
                    status: { [Op.in]: ['ready', 'preparing'] } // Các món chưa serve
                } 
            }
        );
    }
    else if (status === 'cancelled') {
        // Hủy đơn: Tất cả items cancelled
        await OrderItem.update(
            { status: 'cancelled' },
            { where: { order_id: id } }
        );
    }
    // ❌ KHÔNG update items khi Order = 'payment' hoặc 'completed'
    // Vì OrderItem ENUM không có 2 status này

    // --- BƯỚC 3: LẤY LẠI DỮ LIỆU MỚI NHẤT ---
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: Table,
          as: "table",
          attributes: ["id", "table_number", "location"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: MenuItem,
              as: "menu_item",
              attributes: ["id", "name", "prep_time_minutes"],
            },
            {
              model: OrderItemModifier,
              as: "modifiers",
              include: [{ model: ModifierOption, as: "modifier_option" }],
            },
          ],
        },
      ],
    });

    // --- BƯỚC 4: BẮN SOCKET (REAL-TIME) ---
    // Nếu không có đoạn này, Waiter sẽ không thấy gì thay đổi trừ khi F5
    if (req.io) {
        req.io.emit('order_status_updated', updatedOrder);
        
        // Bắn riêng cho bàn (nếu khách dùng app)
        if (updatedOrder.table) {
             req.io.emit(`order_update_table_${updatedOrder.table.id}`, updatedOrder);
        }
    }

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng thành "${status}"`,
      data: updatedOrder,
    });

  } catch (error) {
    console.error("[Kitchen Controller] updateOrderStatus Error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi khi cập nhật trạng thái đơn hàng",
      message: error.message,
    });
  }
};

// 3. Lấy thống kê cho Kitchen Display
export const getKitchenStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, preparing, ready, completedToday] = await Promise.all([
      // Pending bao gồm cả confirmed (đã duyệt chờ nấu)
      Order.count({ where: { status: { [Op.in]: ["pending", "confirmed"] } } }),
      Order.count({ where: { status: "preparing" } }),
      Order.count({ where: { status: "ready" } }),
      Order.count({
        where: {
          status: { [Op.in]: ["completed", "served"] },
          completed_at: { [Op.gte]: today },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pending,
        preparing,
        ready,
        completedToday,
      },
    });
  } catch (error) {
    console.error("[Kitchen Controller] getKitchenStats Error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi khi lấy thống kê",
      message: error.message,
    });
  }
};

// [MỚI] Hàm cập nhật trạng thái TỪNG MÓN
export const updateOrderItemStatus = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { status } = req.body; // 'ready'

        // 1. Update món ăn
        const item = await OrderItem.findByPk(itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        item.status = status;
        await item.save();

        // 2. Logic Tự động cập nhật trạng thái Order cha
        const order = await Order.findByPk(item.order_id, {
            include: [{ model: OrderItem, as: 'items' }, { model: Table, as: 'table' }]
        });

        if (order) {
            // Kiểm tra xem TẤT CẢ món (trừ món hủy) đã xong chưa?
            // Các trạng thái được coi là "Xong": ready, served
            const allItemsDone = order.items
                .filter(i => i.status !== 'cancelled')
                .every(i => ['ready', 'served'].includes(i.status));

            // Nếu tất cả đã xong -> Update Order thành 'ready'
            if (allItemsDone && order.status !== 'ready' && order.status !== 'completed') {
                order.status = 'ready';
                await order.save();
            } 
            // Nếu có ít nhất 1 món đang 'preparing' hoặc 'ready' -> Order phải là 'preparing'
            // (Trường hợp Waiter lỡ tay bấm 'ready' order rồi lại thêm món mới)
            else if (!allItemsDone && order.status === 'ready') {
                order.status = 'preparing';
                await order.save();
            }
        }

        // 3. Lấy lại dữ liệu đầy đủ để bắn Socket
        const fullOrder = await Order.findByPk(item.order_id, {
             include: [
                { model: Table, as: 'table' },
                { 
                    model: OrderItem, as: 'items',
                    include: [
                        { model: MenuItem, as: 'menu_item' },
                        { model: OrderItemModifier, as: 'modifiers', include: ['modifier_option'] }
                    ]
                }
            ]
        });

        // 4. Bắn Socket
        if (req.io) {
            req.io.emit('order_status_updated', fullOrder);
            if (fullOrder.table) {
                req.io.emit(`order_update_table_${fullOrder.table.id}`, fullOrder);
            }
        }

        return res.json({ success: true, data: fullOrder });

    } catch (error) {
        console.error("Update Item Error:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};