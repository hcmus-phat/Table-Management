import React, { useMemo } from 'react';
import { DollarSign, ChevronUp, Clock, Utensils, BellRing, ShoppingBag } from 'lucide-react';

const OrderTrackingBar = ({ order, onViewOrder, onRequestBill }) => {
  if (!order || !order.items || order.items.length === 0) return null;

  // --- 1. LOGIC TÍNH TOÁN TRẠNG THÁI ---
  const trackingSummary = useMemo(() => {
    const items = order.items;
    
    // Đếm số lượng món theo trạng thái
    const counts = {
      pending: items.filter(i => i.status === 'pending').length,
      preparing: items.filter(i => i.status === 'preparing').length,
      ready: items.filter(i => i.status === 'ready').length,
      served: items.filter(i => i.status === 'served').length,
    };

    // Xác định trạng thái ưu tiên để hiển thị màu sắc và icon
    if (counts.ready > 0) {
      return {
        title: `${counts.ready} món đã xong!`,
        subtitle: 'Nhân viên đang mang ra...',
        color: 'bg-green-600',
        icon: <BellRing size={20} className="animate-pulse" />
      };
    }
    if (counts.pending > 0) {
      return {
        title: `Đang gửi ${counts.pending} món mới`,
        subtitle: 'Chờ nhân viên xác nhận...',
        color: 'bg-yellow-500',
        icon: <Clock size={20} />
      };
    }
    if (counts.preparing > 0) {
      return {
        title: `Bếp đang nấu ${counts.preparing} món`,
        subtitle: 'Vui lòng đợi trong giây lát',
        color: 'bg-blue-600',
        icon: <Utensils size={20} />
      };
    }
    if (counts.served > 0 && order.status !== 'payment') {
      return {
        title: 'Chúc quý khách ngon miệng',
        subtitle: 'Bạn có thể gọi thêm món',
        color: 'bg-orange-600',
        icon: <ShoppingBag size={20} />
      };
    }
    // Fallback (Ví dụ khi đang thanh toán)
    return {
        title: 'Đang xử lý',
        subtitle: 'Chi tiết đơn hàng',
        color: 'bg-gray-700',
        icon: <DollarSign size={20} />
    };

  }, [order.items, order.status]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 pb-safe">
      {/* Container nổi (Floating Card) */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden">
        
        {/* Phần Tracking (Click vào để xem chi tiết) */}
        <div 
            onClick={onViewOrder}
            className="flex items-center justify-between p-3 cursor-pointer active:bg-gray-50 transition-colors"
        >
            <div className="flex items-center gap-3.5">
                {/* Icon Box */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${trackingSummary.color} transition-colors duration-300`}>
                    {trackingSummary.icon}
                </div>

                {/* Text Info */}
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-sm">
                        {trackingSummary.title}
                    </span>
                    <span className="text-xs text-gray-500">
                        {trackingSummary.subtitle}
                    </span>
                </div>
            </div>

            {/* Icon mở rộng */}
            <div className="bg-gray-100 p-1.5 rounded-full text-gray-500">
                <ChevronUp size={18} />
            </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gray-100 w-full"></div>

        {/* Phần Footer nhỏ: Tổng tiền & Nút thanh toán */}
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50/50">
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Tổng tạm tính</span>
                <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(order.total_amount || 0)}
                </span>
            </div>

            {/* Nút Gọi Bill (Chỉ hiện khi chưa thanh toán & chưa hủy) */}
            {order.status !== 'payment' && order.status !== 'completed' && order.status !== 'cancelled' && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // Chặn click lan ra ngoài (để không mở modal)
                        onRequestBill();
                    }}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-black transition-transform active:scale-95 flex items-center gap-2"
                >
                    <DollarSign size={14} />
                    Thanh toán
                </button>
            )}
             
             {/* Trạng thái đang thanh toán */}
             {order.status === 'payment' && (
                 <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1.5 rounded-lg animate-pulse">
                     Đang gọi thanh toán...
                 </span>
             )}
        </div>

      </div>
    </div>
  );
};

export default OrderTrackingBar;