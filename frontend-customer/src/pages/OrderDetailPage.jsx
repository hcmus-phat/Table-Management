import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CustomerService from '../services/customerService';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [items, setItems] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const orderData = await CustomerService.getOrderWithItems(orderId);
        const actualOrder = orderData.order?.data || orderData.order;
        setOrder(actualOrder);
        setItems(orderData.items || []);
      } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [orderId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const totalAmount = items.reduce((sum, item) => 
    sum + (Number(item.quantity || 0) * Number(item.price_at_order || 0)), 0
  );

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-6 px-4"> 
      <div className="w-full max-w-3xl"> 
        
        {/* Header */}
        <div className="mb-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-extrabold text-gray-900">Chi tiết đơn hàng</h1>
            <p className="text-gray-500 font-mono mt-1">Mã đơn: #{orderId?.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Info Card - CHỈ CÒN TRẠNG THÁI */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Trạng thái đơn hàng</p>
              <p className="font-semibold text-green-600 mt-1 text-lg">
                ● {order?.status || 'Hoàn thành'}
              </p>
            </div>
          </div>

          {/* List Items Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-5 bg-gray-50/80 border-b border-gray-100 text-xs uppercase font-bold text-gray-500 tracking-wider">
              <div className="col-span-6">Tên món</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-4 text-right">Thành tiền</div>
            </div>
            
            <div className="divide-y divide-gray-50">
              {items.length > 0 ? items.map((item, index) => (
                <div key={index} className="p-5 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-12 md:col-span-6">
                    <p className="font-bold text-gray-800 break-words">
                      {item.menu_item?.name || item.menu_item_name || "Món ăn chưa xác định"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 md:hidden">
                       Đơn giá: {formatCurrency(item.price_at_order)}
                    </p>
                  </div>

                  <div className="col-span-4 md:col-span-2 text-left md:text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                      x{item.quantity}
                    </span>
                  </div>

                  <div className="col-span-8 md:col-span-4 text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.quantity * item.price_at_order)}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-gray-400">Không có dữ liệu món ăn</div>
              )}
            </div>

            {/* Total Section */}
            <div className="p-6 bg-gray-900 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <span className="block font-medium opacity-70 text-sm">Tổng cộng thanh toán</span>
                  <span className="text-xs opacity-50 italic">Đã bao gồm thuế & phí</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-orange-500">
                    {formatCurrency(order?.total_amount || totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Note Section */}
          {order?.notes && (
            <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Ghi chú đơn hàng</p>
              </div>
              <p className="text-sm text-gray-700 italic leading-relaxed">"{order.notes}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;