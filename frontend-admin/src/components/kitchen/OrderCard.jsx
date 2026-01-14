import React, { useState, useMemo } from "react";
import { CheckCircle, ChefHat, Loader, Clock } from 'lucide-react'; // Thêm icon Clock
import OrderTimer, { getElapsedSeconds, getTimeStatus } from "./OrderTimer";
import kitchenService from "../../services/kitchenService"; 

const OrderCard = ({ order, onStartOrder, onReadyOrder, isUpdating }) => {
  const timeStatus = getTimeStatus(getElapsedSeconds(order.ordered_at));
  const [itemLoading, setItemLoading] = useState({});

  // Phân loại món
  const { activeItems, finishedItems } = useMemo(() => {
    const items = order.items || [];
    return {
      activeItems: items.filter(i => ['pending', 'confirmed', 'preparing', 'ready'].includes(i.status)),
      finishedItems: items.filter(i => ['served', 'completed', 'cancelled'].includes(i.status)),
    };
  }, [order.items]);

  // [FIX 1] Logic nút bấm: Chỉ hiện nút "Nhận nấu" khi có món ĐÃ DUYỆT (Confirmed)
  // Món Pending (khách đang chọn) thì bếp không được quyền nấu.
  const hasConfirmedItems = activeItems.some(i => i.status === 'confirmed');
  
  // Logic kiểm tra xem có món Pending để hiện cảnh báo "Khách đang chọn thêm" không
  const hasPendingItems = activeItems.some(i => i.status === 'pending');

  const handleItemReady = async (itemId) => {
    setItemLoading(prev => ({ ...prev, [itemId]: true }));
    try {
        await kitchenService.updateOrderItemStatus(itemId, 'ready');
    } catch (error) {
        console.error("Lỗi update item", error);
    } finally {
        setItemLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const isCooking = order.status === 'preparing';
  const shortOrderId = order.id.slice(-4).toUpperCase();

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 overflow-hidden flex flex-col h-[480px] transition-all ${
        timeStatus === 'overdue' ? 'border-red-400 shadow-red-100' : 'border-gray-200'
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
            {order.status === 'confirmed' ? 'WAITING' : order.status}
         </span>
      </div>

      {/* TIMER & WARNING */}
      <div className="px-4 py-2 border-b bg-gray-50 flex justify-between items-center">
         <OrderTimer orderedAt={order.ordered_at} status={order.status} />
         
         {/* [FIX 2] Cảnh báo rõ ràng hơn */}
         {hasPendingItems && (
            <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200">
                <Clock size={12}/> Khách đang gọi thêm...
            </span>
         )}
         {hasConfirmedItems && (
            <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                CẦN XÁC NHẬN
            </span>
         )}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
        {activeItems.map((item) => {
            const isReady = item.status === 'ready';
            const isPreparing = item.status === 'preparing';
            const isConfirmed = item.status === 'confirmed';
            const isPending = item.status === 'pending'; // Chưa duyệt
            const isLoading = itemLoading[item.id];

            return (
                <div key={item.id} className={`p-3 rounded-lg border flex justify-between items-center transition-all ${
                    isReady ? 'bg-green-50 border-green-200 opacity-60' : // Ready thì làm mờ chút cho đỡ rối
                    isConfirmed ? 'bg-white border-red-300 shadow-md ring-1 ring-red-100' : // Confirmed nổi bật nhất
                    isPreparing ? 'bg-blue-50 border-blue-200' : 
                    'bg-gray-50 border-gray-200 grayscale' // Pending làm xám
                }`}>
                    {/* INFO */}
                    <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-700">{item.quantity}x</span>
                            <span className={`font-medium ${isReady ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                                {item.menu_item?.name}
                            </span>
                        </div>
                        {item.notes && <div className="text-xs text-orange-600 mt-1 italic">Note: "{item.notes}"</div>}
                        
                        <div className="mt-1">
                            {isPending && <span className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded">Chờ Waiter duyệt</span>}
                            {isConfirmed && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">Mới - Cần nấu</span>}
                            {isPreparing && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">Đang nấu</span>}
                            {isReady && <span className="text-[10px] bg-green-200 text-green-800 px-1 rounded font-bold">✓ Đã xong</span>}
                        </div>
                    </div>

                    {/* ACTION BUTTON */}
                    {/* Chỉ hiện nút check khi đang nấu */}
                    {isPreparing && (
                        <button
                            onClick={() => handleItemReady(item.id)}
                            disabled={isLoading}
                            className="w-10 h-10 rounded-full bg-white hover:bg-green-500 text-gray-300 hover:text-white border-2 border-gray-200 hover:border-green-500 flex items-center justify-center transition-all shadow-sm"
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
         {/* [FIX 3] Chỉ hiện nút NHẬN NẤU khi có món CONFIRMED */}
         {hasConfirmedItems ? (
             <button 
                onClick={() => onStartOrder(order.id)}
                disabled={isUpdating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 animate-bounce-slow"
             >
                <ChefHat size={20}/> NHẬN NẤU ({activeItems.filter(i => i.status === 'confirmed').length} MÓN)
             </button>
         ) : (
             /* Logic nút Hoàn tất (Backup) */
             (() => {
                 // Nút này thực ra ít dùng vì Backend đã Auto-Ready, nhưng giữ lại làm backup
                 const allItemsReady = activeItems.length > 0 && activeItems.every(i => i.status === 'ready');
                 
                 // Nếu Order đã Ready (do Auto backend) -> Hiện thông báo chờ phục vụ
                 if (order.status === 'ready') {
                     return (
                         <div className="w-full py-3 bg-green-100 text-green-700 rounded-lg font-bold flex items-center justify-center gap-2 border border-green-200">
                             <CheckCircle size={20}/> ĐANG CHỜ PHỤC VỤ
                         </div>
                     )
                 }

                 return (
                     <button 
                        onClick={() => onReadyOrder(order.id)}
                        // Chỉ cho bấm khi đang nấu VÀ tất cả món đã ready (Backup case)
                        disabled={!allItemsReady || !isCooking || isUpdating}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                            allItemsReady && isCooking
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                     >
                        <CheckCircle size={20}/> 
                        {allItemsReady ? 'HOÀN TẤT ĐƠN' : 'Chờ nấu xong...'}
                     </button>
                 );
             })()
         )}
      </div>
    </div>
  );
};

export default OrderCard;