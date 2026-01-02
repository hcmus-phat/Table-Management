import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const MenuHeader = ({ tableNumber, cartItemCount }) => {
    const [customer, setCustomer] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Kiểm tra thông tin khách hàng khi component mount
    useEffect(() => {
        const customerInfo = localStorage.getItem("customer_info");
        if (customerInfo) {
            try {
                setCustomer(JSON.parse(customerInfo));
            } catch (error) {
                console.error("Error parsing customer info:", error);
                localStorage.removeItem("customer_info");
                localStorage.removeItem("customer_token");
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_info");
        setCustomer(null);
        setShowDropdown(false);
        // Reload trang để xóa các trạng thái cũ
        window.location.reload();
    };

    // Hàm tiện ích để tạo state chứa URL hiện tại (bao gồm cả params table/token)
    const navigationState = { from: location.pathname + location.search };

    return (
        <header className="bg-linear-to-r from-amber-600 to-orange-600 shadow-lg sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            🍽️ Table {tableNumber}
                        </h1>
                        <p className="text-amber-100">
                            Welcome to our restaurant
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {customer ? (
                                <>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-amber-600 font-bold">
                                            {customer.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="hidden sm:inline">
                                            {customer.username}
                                        </span>
                                        <svg
                                            className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/customer/login"
                                    // TRUYỀN THAM SỐ: Lưu lại URL hiện tại kèm params QR
                                    state={navigationState}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="hidden sm:inline">Đăng nhập</span>
                                </Link>
                            )}

                            {showDropdown && customer && (
                                <>
                                    <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setShowDropdown(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 border">
                                        <div className="p-4 border-b">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {customer.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{customer.username}</p>
                                                    <p className="text-sm text-gray-500">Khách hàng</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    // TRUYỀN THAM SỐ: Sang Profile và kèm URL gốc
                                                    navigate("/customer/profile", { state: navigationState });
                                                }}
                                                className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-left"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Thông tin của bạn
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    // TRUYỀN THAM SỐ: Sang Orders và kèm URL gốc
                                                    navigate("/customer/orders", { state: navigationState });
                                                }}
                                                className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-left"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Lịch sử đặt món
                                            </button>
                                        </div>

                                        <div className="p-2 border-t">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-center px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified
                        </div>

                        {cartItemCount > 0 && (
                            <div className="hidden md:block px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                                {cartItemCount} items in cart
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default MenuHeader;