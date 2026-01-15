import React, { useState, useEffect } from 'react';
import { X, Clock, Receipt, Utensils, CheckCircle, BellRing, AlertCircle, CreditCard, Star, ChevronLeft, Loader, Check, MessageSquare } from 'lucide-react';
import customerService from '../../services/customerService';

const OrderDetailModal = ({ order, onClose, onRequestBill }) => {
  // State quản lý việc đang review món nào (null = đang xem list)
  const [reviewingItem, setReviewingItem] = useState(null);
  
  // State cho Form Review
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State lưu danh sách ID các món ĐƯỢC PHÉP review (chưa review)
  const [reviewableItemIds, setReviewableItemIds] = useState(new Set());
  const [checkingReviewStatus, setCheckingReviewStatus] = useState(false);

  // --- 1. LOGIC CHECK TRẠNG THÁI REVIEW ---
  // Khi mở đơn hàng hoàn tất, tự động kiểm tra xem món nào chưa review
  useEffect(() => {
    if (order && order.status === 'completed') {
      checkReviewableStatus();
    }
  }, [order]);

  const checkReviewableStatus = async () => {
    setCheckingReviewStatus(true);
    try {
      const res = await customerService.getReviewableItems(order.id);
      
      // Xử lý dữ liệu trả về (mảng)
      const data = Array.isArray(res) ? res : (res.data || []);
      
      // Lưu ID vào Set để tra cứu cho nhanh
      // Lưu cả id (order_item_id) và menu_item_id để chắc chắn
      const ids = new Set(data.map(item => item.id || item.menu_item_id));
      setReviewableItemIds(ids);

    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái review:", error);
    } finally {
      setCheckingReviewStatus(false);
    }
  };

  if (!order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // --- 2. XỬ LÝ REVIEW ---
  const handleOpenReview = (item) => {
    setReviewingItem(item);
    setRating(5);
    setComment('');
  };

  const handleCloseReview = () => {
    setReviewingItem(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewingItem) return;

    setIsSubmitting(true);
    try {
      // Gọi API tạo review
      await customerService.createReview({
        menu_item_id: reviewingItem.menu_item?.id || reviewingItem.menu_item_id || reviewingItem.id,
        order_id: order.id,
        rating: rating,
        comment: comment
      });

      // Cập nhật UI: Xóa món vừa review khỏi danh sách "được phép review"
      setReviewableItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewingItem.id); 
        newSet.delete(reviewingItem.menu_item?.id);
        return newSet;
      });

      // Thông báo và quay lại
      alert("Cảm ơn đánh giá của bạn!");
      handleCloseReview();

    } catch (error) {
      console.error(error);
      alert(error.message || "Không thể gửi đánh giá, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. HELPERS HIỂN THỊ (Giữ nguyên logic cũ) ---
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
        
        {/* =========================================
            TRƯỜNG HỢP 1: HIỂN THỊ FORM ĐÁNH GIÁ
           ========================================= */}
        {reviewingItem ? (
           <div className="flex flex-col h-full animate-fade-in bg-gray-50">
              {/* Header Form */}
              <div className="bg-white p-4 border-b flex items-center justify-between shadow-sm z-10">
                  <button 
                    onClick={handleCloseReview} 
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-orange-600 transition bg-gray-100 px-3 py-1.5 rounded-lg"
                  >
                      <ChevronLeft size={18} className="mr-1" /> Quay lại
                  </button>
                  <h3 className="font-bold text-gray-800 text-lg">Đánh giá món ăn</h3>
                  <div className="w-16"></div>
              </div>

              {/* Body Form */}
              <div className="p-6 flex-1 overflow-y-auto">
                  {/* Card thông tin món */}
                  <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                           <img 
                              src={reviewingItem.menu_item?.image || reviewingItem.image || 'https://placehold.co/100?text=Food'} 
                              alt="" 
                              className="w-full h-full object-cover"
                           />
                      </div>
                      <div>
                          <h4 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                            {reviewingItem.menu_item?.name || reviewingItem.name}
                          </h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Utensils size={12} /> Bạn thấy món này thế nào?
                          </p>
                      </div>
                  </div>

                  <form onSubmit={handleSubmitReview}>
                      {/* Chọn sao */}
                      <div className="flex flex-col items-center gap-2 mb-8">
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                          <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="transition-transform hover:scale-110 focus:outline-none p-1"
                          >
                              <Star 
                              size={40} 
                              className={`${star <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`} 
                              />
                          </button>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 mt-2">
                            {rating === 5 ? 'Tuyệt vời! 😍' : rating === 4 ? 'Rất ngon! 😋' : rating === 3 ? 'Tạm ổn 🙂' : rating === 2 ? 'Cần cải thiện 😐' : 'Tệ quá 😞'}
                        </span>
                      </div>
                      
                      {/* Nhập bình luận */}
                      <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <MessageSquare size={16}/> Bình luận thêm <span className="font-normal text-gray-400">(Tùy chọn)</span>
                          </label>
                          <textarea
                              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm text-sm"
                              rows="4"
                              placeholder="Hương vị, độ nóng, cách trình bày..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                          ></textarea>
                      </div>

                      {/* Nút gửi */}
                      <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      >
                          {isSubmitting ? <Loader className="animate-spin" size={20} /> : 'Gửi đánh giá'}
                      </button>
                  </form>
              </div>
           </div>
        ) : (
        /* =========================================
            TRƯỜNG HỢP 2: HIỂN THỊ CHI TIẾT ĐƠN HÀNG (BÌNH THƯỜNG)
           ========================================= */
          <>
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
                {order.items?.map((item, index) => {
                  // Logic hiển thị nút Review
                  // Kiểm tra trong danh sách được phép + Trạng thái đơn hoàn tất + Item không bị hủy
                  const canReview = reviewableItemIds.has(item.id) || reviewableItemIds.has(item.menu_item?.id);
                  const isCancelled = item.status === 'cancelled';
                  
                  return (
                    <div key={index} className="bg-white p-3 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex gap-3 relative overflow-hidden group">
                      
                      {/* Dải màu trạng thái */}
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
                            <h4 className={`font-bold text-sm text-gray-800 truncate pr-2 ${isCancelled ? 'line-through text-gray-400' : ''}`}>
                                {item.menu_item?.name || item.name}
                            </h4>
                            <div className="flex-shrink-0">
                                {getItemStatusBadge(item.status)}
                            </div>
                        </div>
                        
                        {/* Modifiers */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
                            {item.modifiers.map((mod, idx) => (
                              <div key={idx} className="flex justify-between w-full pr-4">
                                <span>+ {mod.modifier_option?.name || mod.name}</span>
                                {(mod.price > 0 || mod.price_adjustment > 0) && (
                                    <span className="font-medium text-gray-700">
                                        {formatCurrency(mod.price || mod.price_adjustment)}
                                    </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Notes */}
                        {item.notes && (
                          <div className="mt-1.5 flex items-start gap-1">
                              <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 italic">
                                  Note: {item.notes}
                              </span>
                          </div>
                        )}

                        {/* --- [MỚI] NÚT VIẾT ĐÁNH GIÁ --- */}
                        {order.status === 'completed' && !isCancelled && (
                             <div className="mt-3 pt-2 border-t border-dashed border-gray-100 flex justify-end">
                                {checkingReviewStatus ? (
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                      <Loader size={10} className="animate-spin"/> Kiểm tra...
                                    </span>
                                ) : canReview ? (
                                    <button 
                                        onClick={() => handleOpenReview(item)}
                                        className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 hover:scale-105 transition-all shadow-sm"
                                    >
                                        <Star size={12} className="fill-green-700" />
                                        Viết đánh giá
                                    </button>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 select-none">
                                        <Check size={12} /> Đã đánh giá
                                    </span>
                                )}
                             </div>
                        )}
                      </div>

                      {/* Giá tiền */}
                      <div className="flex flex-col justify-end items-end pl-2">
                        <p className="font-bold text-sm text-gray-900">{formatCurrency(item.price || item.price_at_order)}</p>
                      </div>
                    </div>
                  );
                })}
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
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailModal;