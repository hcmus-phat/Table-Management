import React, { useState, useMemo } from "react";
import {
  X,
  Receipt,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import CustomerService from "../../services/customerService";

const BillModal = ({ isOpen, onClose, order, onRequestPayment }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");

  // Kiểm tra xem tất cả món đã served chưa
  const allItemsServed = useMemo(() => {
    if (!order) return false;
    const items = order.items || [];
    if (items.length === 0) return false;

    // Lọc các món active (không bị cancelled)
    const activeItems = items.filter((i) => i.status !== "cancelled");
    if (activeItems.length === 0) return false;

    // Kiểm tra TẤT CẢ món active đã served
    return activeItems.every((i) => i.status === "served");
  }, [order]);

  // Early return AFTER all hooks
  if (!isOpen || !order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePaymentRequest = async () => {
    if (!allItemsServed) {
      alert("Vui lòng đợi tất cả món được phục vụ trước khi thanh toán!");
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận thanh toán ${formatCurrency(
        order.total_amount
      )} bằng ${getPaymentMethodName(selectedPaymentMethod)}?`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      // 1. Gửi request payment đến backend
      await onRequestPayment(order.id, selectedPaymentMethod);

      // 2. Xử lý theo payment method
      if (selectedPaymentMethod === "cash") {
        // Tiền mặt: Đóng modal, đợi waiter xác nhận
        alert(
          "✅ Đã gửi yêu cầu thanh toán tiền mặt. Vui lòng chờ nhân viên đến thu tiền."
        );
        onClose();
      } else {
        // Online payment: Mở cổng thanh toán (Mock)
        handleOnlinePayment(
          selectedPaymentMethod,
          order.id,
          order.total_amount
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Lỗi thanh toán: " + (error.message || "Vui lòng thử lại"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock payment gateway redirect
  const handleOnlinePayment = async (method, orderId, amount) => {
    if (method === "momo") {
      // Thanh toán MoMo thực - gọi API để lấy payUrl
      try {
        setIsProcessing(true);
        const response = await CustomerService.createMomoPayment(
          orderId,
          amount
        );

        if (response && response.payUrl) {
          // Redirect đến trang thanh toán MoMo
          window.location.href = response.payUrl;
        } else if (response && response.resultCode === 0) {
          // Nếu API trả về thành công nhưng không có payUrl (đã thanh toán)
          alert("✅ Thanh toán thành công!");
          onClose();
        } else {
          throw new Error(response?.message || "Không thể tạo thanh toán MoMo");
        }
      } catch (error) {
        console.error("MoMo payment error:", error);
        alert(
          "❌ Lỗi thanh toán MoMo: " + (error.message || "Vui lòng thử lại")
        );
        setIsProcessing(false);
      }
      return;
    }

    // Các phương thức thanh toán khác (VNPay, ZaloPay, Stripe) - vẫn giữ mock
    const mockUrls = {
      vnpay: `http://localhost:5000/api/customer/payment/vnpay-callback?orderId=${orderId}&status=success&transactionId=VNPAY_${Date.now()}`,
      zalopay: `http://localhost:5000/api/customer/payment/zalopay-callback?orderId=${orderId}&status=success&transactionId=ZALO_${Date.now()}`,
      stripe: `http://localhost:5000/api/customer/payment/stripe-callback?orderId=${orderId}&status=success&transactionId=STRIPE_${Date.now()}`,
    };

    const paymentUrl = mockUrls[method];

    if (paymentUrl) {
      alert(
        `🔄 Đang chuyển đến cổng thanh toán ${getPaymentMethodName(
          method
        )}...\n\n(Mock: Sẽ tự động hoàn tất sau 2 giây)`
      );

      setTimeout(async () => {
        try {
          await CustomerService.completePayment(
            orderId,
            `${method.toUpperCase()}_${Date.now()}`,
            method
          );
          alert("✅ Thanh toán thành công!");
          onClose();
        } catch (err) {
          console.error("Complete payment error:", err);
          alert("Lỗi hoàn tất thanh toán");
        }
      }, 2000);
    }
  };

  const getPaymentMethodName = (method) => {
    const names = {
      cash: "Tiền mặt",
      vnpay: "VNPay",
      momo: "MoMo",
      zalopay: "ZaloPay",
      stripe: "Thẻ quốc tế (Stripe)",
    };
    return names[method] || method;
  };

  const paymentMethods = [
    { id: "cash", name: "Tiền mặt", icon: "💵", color: "green" },
    { id: "momo", name: "MoMo", icon: "🟣", color: "purple" },
    { id: "vnpay", name: "VNPay", icon: "🔵", color: "blue" },
    { id: "zalopay", name: "ZaloPay", icon: "🔷", color: "cyan" },
    { id: "stripe", name: "Stripe", icon: "💳", color: "indigo" },
  ];

  // Tính toán chi tiết hóa đơn
  const activeItems = (order.items || []).filter(
    (i) => i.status !== "cancelled"
  );
  const subtotal = activeItems.reduce((sum, item) => {
    const itemPrice = parseFloat(item.unit_price || 0);
    const modifierPrice = (item.modifiers || []).reduce(
      (modSum, mod) => modSum + parseFloat(mod.modifier_option?.price || 0),
      0
    );
    return sum + (itemPrice + modifierPrice) * item.quantity;
  }, 0);

  const tax = subtotal * 0.1; // 10% VAT
  const serviceCharge = subtotal * 0.05; // 5% phí phục vụ
  const total = order.total_amount || subtotal + tax + serviceCharge;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt size={28} />
            <div>
              <h2 className="text-xl font-bold">Hóa đơn thanh toán</h2>
              <p className="text-sm text-purple-100">
                Bàn {order.table?.table_number} • #
                {order.id?.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* THÔNG TIN ĐƠN */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-gray-600">Thời gian đặt:</span>
              <span className="font-semibold text-right">
                {formatDateTime(order.created_at)}
              </span>

              <span className="text-gray-600">Trạng thái:</span>
              <span className="font-semibold text-right">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    order.status === "payment"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {order.status === "payment"
                    ? "Chờ thanh toán"
                    : order.status.toUpperCase()}
                </span>
              </span>
            </div>
          </div>

          {/* DANH SÁCH MÓN */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Receipt size={18} />
              Chi tiết món ăn ({activeItems.length})
            </h3>

            <div className="space-y-3">
              {activeItems.map((item, idx) => {
                const itemPrice = parseFloat(item.unit_price || 0);
                const modifierPrice = (item.modifiers || []).reduce(
                  (sum, mod) =>
                    sum + parseFloat(mod.modifier_option?.price || 0),
                  0
                );
                const itemTotal = (itemPrice + modifierPrice) * item.quantity;

                return (
                  <div
                    key={idx}
                    className="border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {item.quantity}x {item.menu_item?.name || item.name}
                        </span>

                        {/* Trạng thái món */}
                        <div className="mt-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded ${
                              item.status === "served"
                                ? "bg-green-100 text-green-700"
                                : item.status === "ready"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.status === "served"
                              ? "✓ Đã lên"
                              : item.status === "ready"
                              ? "Chờ bưng"
                              : "Đang làm"}
                          </span>
                        </div>

                        {/* Modifiers */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 ml-2">
                            {item.modifiers.map((mod, modIdx) => (
                              <div key={modIdx}>
                                + {mod.modifier_option?.name} (+
                                {formatCurrency(
                                  mod.modifier_option?.price || 0
                                )}
                                )
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <div className="text-xs text-orange-600 italic mt-1">
                            Ghi chú: "{item.notes}"
                          </div>
                        )}
                      </div>

                      <span className="font-semibold text-gray-900 ml-3">
                        {formatCurrency(itemTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TỔNG CỘNG */}
          <div className="border-t-2 border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tạm tính:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phí phục vụ (5%):</span>
              <span className="font-medium">
                {formatCurrency(serviceCharge)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">VAT (10%):</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>TỔNG CỘNG:</span>
              <span className="text-purple-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* CẢNH BÁO NẾU CHƯA SERVED HẾT */}
          {!allItemsServed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-yellow-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Chưa thể thanh toán</p>
                <p>
                  Vui lòng đợi tất cả món được phục vụ trước khi thanh toán.
                </p>
              </div>
            </div>
          )}

          {/* PHƯƠNG THỨC THANH TOÁN */}
          {allItemsServed && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard size={18} />
                Phương thức thanh toán
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    disabled={isProcessing}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedPaymentMethod === method.id
                        ? `border-${method.color}-500 bg-${method.color}-50`
                        : "border-gray-200 hover:border-gray-300"
                    } ${
                      isProcessing
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {method.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER - PAYMENT BUTTON */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          {allItemsServed ? (
            <button
              onClick={handlePaymentRequest}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                isProcessing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader size={24} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  Thanh toán {formatCurrency(total)}
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-xl font-bold text-lg bg-gray-300 text-gray-500 cursor-not-allowed"
            >
              Chờ món được phục vụ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillModal;
