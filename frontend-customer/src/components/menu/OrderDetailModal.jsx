import React from 'react';
import { X, Clock, Receipt, Utensils, CheckCircle, BellRing, AlertCircle, CreditCard } from 'lucide-react';

const OrderDetailModal = ({ order, onClose, onRequestBill }) => {
  if (!order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // 1. Helper: Text & Color cho Order Tổng
  const getOrderStatusInfo = (status) => {
    switch(status) {
        case 'pending': return { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={16}/> };
        case 'confirmed': return { text: 'Đã xác nhận', color: 'bg-orange-100 text-orange-800', icon: <CheckCircle size={16}/> };
        case 'preparing': return { text: 'Bếp đang nấu', color: 'bg-blue-100 text-blue-800', icon: <Utensils size={16}/> };
        case 'ready': return { text: 'Món đã xong', color: 'bg-green-100 text-green-800 animate-pulse', icon: <BellRing size={16}/> };
        case 'served': return { text: 'Đã phục vụ', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={16}/> };
        case 'payment': return { text: 'Chờ thanh toán', color: 'bg-purple-100 text-purple-800', icon: <Receipt size={16}/> };
        case 'completed': return { text: 'Hoàn tất', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle size={16}/> };
        case 'cancelled': return { text: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: <AlertCircle size={16}/> };
        default: return { text: status, color: 'bg-gray-100 text-gray-800', icon: <Clock size={16}/> };
    }
  };

  // 2. [MỚI] Helper: Text & Color cho TỪNG MÓN (Quan trọng)
  const getItemStatusBadge = (status) => {
      switch(status) {
          case 'pending': return <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200">Chờ duyệt</span>;
          case 'confirmed': return <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">Đã nhận</span>;
          case 'preparing': return <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">Đang nấu</span>;
          case 'ready': return <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold flex items-center gap-1"><BellRing size={10}/> Xong</span>;
          case 'served': return <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">Đã lên</span>;
          case 'cancelled': return <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 line-through">Hết/Hủy</span>;
          default: return null;
      }
  };

  const orderStatusInfo = getOrderStatusInfo(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <Receipt size={20} className="text-orange-600"/>
              Chi tiết đơn hàng
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Mã đơn: <span className="font-mono font-bold text-gray-700">#{order.id?.toString().slice(-6).toUpperCase()}</span></p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
          
          {/* Trạng thái chung */}
          <div className={`mb-5 flex justify-between items-center p-3 rounded-xl border border-dashed ${orderStatusInfo.color.replace('text-', 'border-').replace('800', '200')}`}>
            <span className="text-sm font-bold flex items-center gap-2">
                {orderStatusInfo.icon}
                Trạng thái chung:
            </span>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${orderStatusInfo.color}`}>
              {orderStatusInfo.text}
            </span>
          </div>

          {/* Danh sách món */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Danh sách món ăn</h4>
            {order.items?.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex gap-3 relative overflow-hidden">
                
                {/* Dải màu trạng thái bên trái */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    item.status === 'cancelled' ? 'bg-red-400' : 
                    item.status === 'pending' ? 'bg-yellow-400' : 
                    item.status === 'preparing' ? 'bg-blue-500' : 
                    item.status === 'ready' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>

                {/* Số lượng */}
                <div className="flex flex-col justify-start pt-0.5 pl-2">
                   <span className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-bold rounded-lg">
                     {item.quantity}x
                   </span>
                </div>

                {/* Thông tin chính */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                      <h4 className={`font-bold text-sm text-gray-800 truncate pr-2 ${item.status === 'cancelled' ? 'line-through text-gray-400' : ''}`}>
                          {item.menu_item?.name || item.name}
                      </h4>
                      {/* [MỚI] Hiển thị trạng thái từng món */}
                      <div className="flex-shrink-0">
                          {getItemStatusBadge(item.status)}
                      </div>
                  </div>
                  
                  {/* Modifiers */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
                      {item.modifiers.map((mod, idx) => (
                          <p key={idx}>+ {mod.modifier_option?.name || mod.name}</p>
                      ))}
                    </div>
                  )}
                  
                  {/* Ghi chú */}
                  {item.notes && (
                    <div className="mt-1.5 flex items-start gap-1">
                        <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 italic">
                            Note: {item.notes}
                        </span>
                    </div>
                  )}
                </div>

                {/* Giá tiền */}
                <div className="flex flex-col justify-end items-end pl-2">
                  <p className="font-bold text-sm text-gray-900">{formatCurrency(item.price || item.price_at_order)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t space-y-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Tạm tính</span>
            <span>{formatCurrency(order.totalAmount || order.total_amount)}</span>
          </div>
          
          <div className="flex justify-between items-center text-xl font-bold text-gray-900">
            <span>Tổng cộng</span>
            <span className="text-orange-600">{formatCurrency(order.totalAmount || order.total_amount)}</span>
          </div>

          {/* Nút Request Bill - Chỉ hiện khi chưa thanh toán */}
          {order.status !== 'payment' && order.status !== 'completed' && order.status !== 'cancelled' && onRequestBill && (
            <button 
              onClick={onRequestBill}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            >
              <CreditCard size={20} />
              Yêu cầu thanh toán
            </button>
          )}

          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailModal;