import React, { useState, useEffect } from "react";
import { X, Printer, Send, Calculator } from "lucide-react";

const BillConfirmModal = ({ isOpen, onClose, order, onConfirm }) => {
  if (!isOpen || !order) return null;

  // State quản lý các khoản tiền
  const [discountType, setDiscountType] = useState("percent"); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [note, setNote] = useState("");

  // 1. Reset state mỗi khi mở modal với order mới
  useEffect(() => {
    if (isOpen) {
        setDiscountType("percent");
        setDiscountValue(0);
        setTaxAmount(0);
        setNote("");
    }
  }, [isOpen, order]);
  
  // 2. Tính toán Subtotal (Tổng tiền món chưa giảm)
  const calculateSubtotal = () => {
    if (!order.items) return 0;
    return order.items.reduce((acc, item) => {
      if (item.status === 'cancelled') return acc;
      // Cộng giá gốc
      let price = parseFloat(item.menu_item?.price || 0);
      // Cộng giá modifier (nếu có)
      if (item.modifiers) {
        item.modifiers.forEach(mod => {
            price += parseFloat(mod.modifier_option?.price_adjustment || 0);
        });
      }
      return acc + (price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();

  // 3. Tính toán Giảm giá (Xử lý an toàn NaN)
  const calculateDiscount = () => {
    const val = parseFloat(discountValue || 0);
    if (discountType === 'percent') {
        // Giới hạn max 100%
        const safePercent = val > 100 ? 100 : val; 
        return (subtotal * safePercent) / 100;
    }
    return val;
  };

  const discountAmount = calculateDiscount();
  
  // 4. Tính Tổng cuối (Chặn số âm)
  const tax = parseFloat(taxAmount || 0);
  const finalTotal = Math.max(0, subtotal + tax - discountAmount);

  // Xử lý Gửi (Confirm)
  const handleConfirm = () => {
    const billData = {
        discount_type: discountType,
        discount_value: parseFloat(discountValue || 0),
        tax_amount: parseFloat(taxAmount || 0),
        note: note,
    };
    onConfirm(order.id, billData);
  };

  // Xử lý In hóa đơn
  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=400');
    printWindow.document.write('<html><head><title>Hóa đơn</title>');
    printWindow.document.write('<style>body{font-family: monospace; padding: 20px;} .line{display:flex;justify-content:space-between;margin-bottom:5px;} .bold{font-weight:bold;} hr{border-top: 1px dashed #000; margin: 10px 0;}</style>');
    printWindow.document.write('</head><body>');
    
    // Header
    printWindow.document.write('<div style="text-align:center"><h2>RESTAURANT APP</h2><p>ĐC: 123 ABC, XYZ City</p></div>');
    printWindow.document.write('<hr/>');
    printWindow.document.write(`<div class="line"><span>Bàn:</span> <span class="bold">${order.table?.table_number}</span></div>`);
    printWindow.document.write(`<div class="line"><span>Ngày:</span> <span>${new Date().toLocaleString('vi-VN')}</span></div>`);
    printWindow.document.write('<hr/>');

    // List món
    order.items.forEach(item => {
        if(item.status !== 'cancelled') {
             const itemTotal = (parseFloat(item.menu_item?.price || 0) * item.quantity);
             // Note: Chưa tính giá modifier vào hiển thị chi tiết cho gọn, nhưng tổng tiền vẫn đúng
             printWindow.document.write(`<div class="line"><span class="bold">${item.quantity}x ${item.menu_item?.name}</span> <span>${itemTotal.toLocaleString()}</span></div>`);
        }
    });
    
    // Footer Tiền
    printWindow.document.write('<hr/>');
    printWindow.document.write(`<div class="line"><span>Tạm tính:</span> <span>${subtotal.toLocaleString()}</span></div>`);
    if(discountAmount > 0) printWindow.document.write(`<div class="line"><span>Giảm giá (${discountType === 'percent' ? discountValue + '%' : 'Fixed'}):</span> <span>-${discountAmount.toLocaleString()}</span></div>`);
    if(tax > 0) printWindow.document.write(`<div class="line"><span>Thuế:</span> <span>+${tax.toLocaleString()}</span></div>`);
    
    printWindow.document.write('<hr/>');
    printWindow.document.write(`<div class="line" style="font-size: 1.2em"><span class="bold">TỔNG CỘNG:</span> <span class="bold">${finalTotal.toLocaleString()} đ</span></div>`);
    
    // Note
    if(note) printWindow.document.write(`<br/><div style="font-style:italic; font-size:0.8em">Ghi chú: ${note}</div>`);

    printWindow.document.write('<br/><div style="text-align:center">Cảm ơn quý khách!</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2">
            <Calculator size={20}/> Xác nhận hóa đơn - Bàn {order.table?.table_number}
          </h3>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
            {/* Summary List */}
            <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto border">
                {order.items?.map((item, idx) => (
                    item.status !== 'cancelled' && (
                        <div key={idx} className="flex justify-between mb-1">
                            <span>{item.quantity}x {item.menu_item?.name}</span>
                            <span className="font-medium">{(item.menu_item?.price * item.quantity).toLocaleString()}</span>
                        </div>
                    )
                ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Loại giảm giá</label>
                    <select 
                        value={discountType} 
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="percent">Phần trăm (%)</option>
                        <option value="fixed">Tiền mặt (VNĐ)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá trị giảm</label>
                    <input 
                        type="number" 
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full border p-2 rounded font-bold text-red-600 focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="0"
                        min="0"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Thuế (VAT/Service)</label>
                <input 
                    type="number" 
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nhập số tiền thuế..."
                    min="0"
                />
            </div>

            <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ghi chú hóa đơn</label>
                 <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="2"
                    placeholder="VD: Khách VIP, Voucher..."
                 ></textarea>
            </div>

            {/* Final Total Display */}
            <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Tạm tính:</span>
                    <span>{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-sm text-red-500">
                    <span>Giảm giá:</span>
                    <span>-{discountAmount.toLocaleString()} đ</span>
                </div>
                 <div className="flex justify-between text-sm text-gray-500">
                    <span>Thuế:</span>
                    <span>+{parseFloat(taxAmount || 0).toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-blue-800 mt-2 border-t border-dashed pt-2">
                    <span>TỔNG CỘNG:</span>
                    <span>{finalTotal.toLocaleString()} đ</span>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex gap-3">
            <button 
                onClick={handlePrint}
                className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
            >
                <Printer size={18}/> In Phiếu
            </button>
            <button 
                onClick={handleConfirm}
                className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow flex items-center justify-center gap-2 transition-colors"
            >
                <Send size={18}/> Gửi Khách Hàng
            </button>
        </div>
      </div>
    </div>
  );
};

export default BillConfirmModal;