import React, { useState, useMemo } from "react";
import { CheckCircle, ChefHat, Loader } from 'lucide-react';
import OrderTimer, { getElapsedSeconds, getTimeStatus } from "./OrderTimer";
import kitchenService from "../../services/kitchenService"; // Import service

const OrderCard = ({ order, onStartOrder, onReadyOrder, isUpdating }) => {
  const timeStatus = getTimeStatus(getElapsedSeconds(order.ordered_at));
  
  // State loading riêng cho từng item để không bị đơ cả card
  const [itemLoading, setItemLoading] = useState({});

  // Phân loại món
  const { activeItems, finishedItems } = useMemo(() => {
    const items = order.items || [];
    return {
      // Active: Bao gồm cả preparing và ready (để hiển thị trong list chính)
      activeItems: items.filter(i => ['pending', 'confirmed', 'preparing', 'ready'].includes(i.status)),
      // Finished: Chỉ served hoặc cancelled
      finishedItems: items.filter(i => ['served', 'completed', 'cancelled'].includes(i.status)),
    };
  }, [order.items]);

  // Hàm xử lý khi bấm xong 1 món
  const handleItemReady = async (itemId) => {
    setItemLoading(prev => ({ ...prev, [itemId]: true }));
    try {
        // Gọi API update item thành 'ready'
        await kitchenService.updateOrderItemStatus(itemId, 'ready');
        // Socket sẽ tự update lại UI, không cần set state local
    } catch (error) {
        console.error("Lỗi update item", error);
    } finally {
        setItemLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const hasNewItems = activeItems.some(i => ['pending', 'confirmed'].includes(i.status));
  const isCooking = order.status === 'preparing';
  const shortOrderId = order.id.slice(-4).toUpperCase();

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 overflow-hidden flex flex-col h-[480px] ${
        timeStatus === 'overdue' ? 'border-red-400' : 'border-gray-200'
    }`}>
      
      {/* HEADER */}
      <div className="bg-gray-800 text-white px-4 py-3 flex-shrink-0 flex justify-between items-center">
         <div>
            <h3 className="font-bold text-lg">Order #{shortOrderId}</h3>
            <p className="text-gray-300 text-sm">Bàn {order.table?.table_number}</p>
         </div>
         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
             order.status === 'ready' ? 'bg-green-500 text-white' : 
             order.status === 'preparing' ? 'bg-blue-500 text-white' : 'bg-gray-600'
         }`}>
            {order.status}
         </span>
      </div>

      {/* TIMER */}
      <div className="px-4 py-2 border-b bg-gray-50 flex justify-between items-center">
         <OrderTimer orderedAt={order.ordered_at} status={order.status} />
         {hasNewItems && <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">CÓ MÓN MỚI</span>}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
        
        {/* LIST MÓN ĂN */}
        {activeItems.map((item) => {
            const isReady = item.status === 'ready';
            const isPreparing = item.status === 'preparing';
            const isPending = ['pending', 'confirmed'].includes(item.status);
            const isLoading = itemLoading[item.id];

            return (
                <div key={item.id} className={`p-3 rounded-lg border flex justify-between items-center transition-all ${
                    isReady ? 'bg-green-50 border-green-200' : 
                    isPending ? 'bg-yellow-50 border-yellow-200' : 
                    'bg-white border-blue-100 shadow-sm'
                }`}>
                    {/* Thông tin món */}
                    <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-700">{item.quantity}x</span>
                            <span className={`font-medium ${isReady ? 'text-green-800' : 'text-gray-800'}`}>
                                {item.menu_item?.name}
                            </span>
                        </div>
                        {item.notes && <div className="text-xs text-orange-600 mt-1 italic">Note: "{item.notes}"</div>}
                        
                        {/* Badge trạng thái nhỏ */}
                        <div className="mt-1">
                            {isPending && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1 rounded">Chờ nhận</span>}
                            {isPreparing && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">Đang nấu</span>}
                            {isReady && <span className="text-[10px] bg-green-200 text-green-800 px-1 rounded font-bold">✓ Đã xong</span>}
                        </div>
                    </div>

                    {/* ACTION BUTTON CHO TỪNG MÓN */}
                    {isPreparing && (
                        <button
                            onClick={() => handleItemReady(item.id)}
                            disabled={isLoading}
                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-green-100 text-gray-400 hover:text-green-600 flex items-center justify-center transition-colors border border-gray-200 hover:border-green-300"
                            title="Báo xong món này"
                        >
                            {isLoading ? <Loader size={18} className="animate-spin text-blue-600"/> : <CheckCircle size={24} />}
                        </button>
                    )}
                </div>
            );
        })}

        {finishedItems.length > 0 && (
            <div className="text-center text-xs text-gray-400 pt-2 border-t">
                {finishedItems.length} món đã phục vụ
            </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-3 bg-gray-50 border-t">
         {/* Nếu có món Pending -> Hiện nút NHẬN NẤU */}
         {hasNewItems ? (
             <button 
                onClick={() => onStartOrder(order.id)}
                disabled={isUpdating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
             >
                <ChefHat size={20}/> NHẬN NẤU MÓN MỚI
             </button>
         ) : (
             /* ✅ FIX: Nút HOÀN TẤT chỉ hiện khi Order = preparing VÀ tất cả items = ready */
             (() => {
                 const allItemsReady = activeItems.length > 0 && activeItems.every(i => i.status === 'ready');
                 const canComplete = isCooking && allItemsReady;
                 
                 return (
                     <button 
                        onClick={() => onReadyOrder(order.id)}
                        disabled={!canComplete || isUpdating}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                            canComplete
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg animate-pulse' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={!canComplete ? 'Vui lòng đánh dấu xong tất cả món trước' : 'Báo Waiter đến lấy món'}
                     >
                        <CheckCircle size={20}/> 
                        {canComplete ? 'HOÀN TẤT ĐƠN (Gọi Waiter)' : 'Chờ nấu xong...'}
                     </button>
                 );
             })()
         )}
      </div>
    </div>
  );
};

export default OrderCard;