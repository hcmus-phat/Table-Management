import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomerService from "../services/customerService";

const CustomerProfile = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();


  const getFromPath = () => {
    if (location.state?.from) return location.state.from;

    const searchParams = new URLSearchParams(location.search);
    const tableId = searchParams.get('table');
    const token = searchParams.get('token');
    
    if (tableId) {
      let path = `/menu?table=${tableId}`;
      if (token) path += `&token=${token}`;
      return path;
    }
    return "/menu";
  };

  const fromPath = getFromPath();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!CustomerService.isLoggedIn()) {
        navigate("/customer/login", { state: { from: fromPath } });
        return;
      }
      const data = CustomerService.getCurrentCustomer();
      setCustomer(data);
    } catch (err) {
      console.error("Lỗi tải hồ sơ:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-orange-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-12">
      {/* THANH ĐIỀU HƯỚNG CỐ ĐỊNH (STICKY HEADER) 
          Đảm bảo nút quay lại luôn nằm ở trên cùng 
      */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(fromPath)} 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-800 hover:bg-gray-100 active:scale-90 transition-all border border-gray-200"
            aria-label="Quay lại"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="font-bold text-lg text-gray-900">Hồ sơ của tôi</h1>
          
          <div className="w-10"></div> {/* Giữ cân bằng cho tiêu đề */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* Card Avatar & Tên */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-full p-1 shadow-xl shadow-orange-100">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-orange-500 text-4xl font-black border-4 border-white">
              {customer?.fullName?.charAt(0).toUpperCase() || customer?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
          
          <div className="mt-5 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {customer?.fullName || "Khách hàng"}
            </h2>
            <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">
              {customer?.username}
            </p>
          </div>
        </div>

        {/* Danh sách thông tin */}
        <div className="mt-8 space-y-4">
          <h3 className="px-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Thông tin tài khoản</h3>
          
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
            <InfoField 
              label="Họ và tên" 
              value={customer?.fullName || "Chưa cập nhật"} 
              icon={<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
            />
            <div className="mx-6 border-t border-gray-50"></div>
            <InfoField 
              label="Tên đăng nhập" 
              value={customer?.username} 
              icon={<path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />}
            />
            <div className="mx-6 border-t border-gray-50"></div>
            <InfoField 
              label="Địa chỉ Email" 
              value={customer?.email || "Chưa cập nhật"} 
              icon={<path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

const InfoField = ({ label, value, icon }) => (
  <div className="flex items-center p-5 gap-4">
    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        {icon}
      </svg>
    </div>
    <div>
      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">{label}</p>
      <p className="text-gray-900 font-bold text-sm">{value}</p>
    </div>
  </div>
);

export default CustomerProfile;