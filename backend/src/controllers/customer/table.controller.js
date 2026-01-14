import { Op } from 'sequelize';
import db from '../../models/index.js'; // Import từ index để đảm bảo các mối quan hệ (associations) được nạp
const { Order, OrderItem, MenuItem, OrderItemModifier, ModifierOption } = db;

// GET /api/customer/tables/:tableId/active-order
export const getTableActiveOrder = async (req, res) => {
  try {
    const { tableId } = req.params;

    // 1. Tìm order Active
    const activeOrder = await Order.findOne({
      where: {
        table_id: tableId,
        status: {
          [Op.notIn]: ['completed', 'cancelled']
        }
      },
      order: [['created_at', 'DESC']]
    });

    if (!activeOrder) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active order found'
      });
    }

    // 2. Lấy items kèm theo Topping (Modifiers)
    const orderItems = await OrderItem.findAll({
      where: { order_id: activeOrder.id },
      include: [
        {
          model: MenuItem,
          as: 'menu_item',
          attributes: ['id', 'name'] // Lấy thêm ảnh nếu cần
        },
        // 🔥 [QUAN TRỌNG] Phải include Modifiers để hiển thị
        {
          model: OrderItemModifier,
          as: 'modifiers', 
          include: [{
             model: ModifierOption,
             as: 'modifier_option',
             attributes: ['id', 'name']
          }]
        }
      ]
    });

    // 3. Transform data cho khớp với Frontend
    const orderData = {
      // Thông tin Order
      id: activeOrder.id, // Frontend hay dùng .id
      order_id: activeOrder.id,
      table_id: activeOrder.table_id,
      status: activeOrder.status,
      totalAmount: parseFloat(activeOrder.total_amount), // Frontend dùng totalAmount
      total_amount: activeOrder.total_amount, // Giữ cả 2 key cho chắc
      created_at: activeOrder.created_at,
      
      // Thông tin Items
      items: orderItems.map(item => {
        // Tính giá item (Ưu tiên lấy giá đã chốt trong order_item)
        const itemPrice = parseFloat(item.price_at_order || 0);

        return {
          id: item.menu_item_id, // ID món ăn
          order_item_id: item.id, // ID dòng order
          name: item.menu_item?.name || "Món không xác định",
          quantity: item.quantity,
          status: item.status,
          notes: item.notes,
          
          // Giá tiền & Tổng
          price: itemPrice,
          price_at_order: itemPrice,
          subtotal: itemPrice * item.quantity,

          // 🔥 Map Modifiers để Frontend hiển thị "+ Topping"
          modifiers: item.modifiers?.map(mod => ({
             id: mod.id,
             modifier_option_id: mod.modifier_option_id,
             name: mod.modifier_option?.name || "Topping", // Lấy tên topping
             price: parseFloat(mod.price || 0) // Lấy giá topping đã lưu
          })) || []
        };
      })
    };

    res.status(200).json({
      success: true,
      data: orderData,
      message: 'Active order retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get active order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get active order'
    });
  }
};