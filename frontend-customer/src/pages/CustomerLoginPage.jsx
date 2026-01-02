import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import customerService from "../services/customerService";

const CustomerLoginPage = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	// 1. Xác định địa chỉ quay về: ưu tiên location.state.from (giữ cả params)
	// Nếu không có, mới dùng logic searchParams để fallback
	const getFromPath = () => {
		if (location.state?.from) {
			return location.state.from;
		}
		
		const searchParams = new URLSearchParams(location.search);
		const tableId = searchParams.get('table');
		const token = searchParams.get('token');
		
		if (tableId || token) {
			let url = "/menu";
			const params = new URLSearchParams();
			if (tableId) params.append('table', tableId);
			if (token) params.append('token', token);
			return `${url}?${params.toString()}`;
		}
		
		return "/";
	};

	const from = getFromPath();

	useEffect(() => {
		if (location.state?.message) {
			setSuccess(location.state.message);
		}
		if (location.state?.registeredUsername) {
			setUsername(location.state.registeredUsername);
		}
	}, [location]);

	const handleLogin = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			await customerService.login(username, password);
			// Điều hướng về URL gốc đã lưu (có đầy đủ query params)
			navigate(from, { replace: true });
		} catch (err) {
			setError(err.message || "Đăng nhập thất bại");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
						<span className="text-white text-2xl font-bold">R</span>
					</div>
					<h1 className="text-3xl font-bold text-gray-900">Smart Restaurant</h1>
					<h2 className="text-xl font-semibold mt-2 text-gray-700">Đăng Nhập Khách Hàng</h2>
					<p className="text-gray-600 mt-2">Đăng nhập để lưu đơn hàng và nhận ưu đãi</p>
				</div>
				
				{error && (
					<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
						{error}
					</div>
				)}
				{success && (
					<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
						{success}
					</div>
				)}
				
				<form onSubmit={handleLogin} className="space-y-6">
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">Tên đăng nhập</label>
						<input
							type="text"
							className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Nhập tên đăng nhập hoặc email"
							required
							disabled={loading}
						/>
					</div>
					
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">Mật khẩu</label>
						<input
							type="password"
							className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Nhập mật khẩu"
							required
							disabled={loading}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className={`w-full text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"}`}
					>
						{loading ? "Đang đăng nhập..." : "Đăng Nhập"}
					</button>
				</form>

				<div className="mt-8 text-center">
					<p className="text-gray-600">
						Chưa có tài khoản?
						<Link
							to="/customer/register"
							// QUAN TRỌNG: Truyền tiếp URL gốc sang trang Register
							state={{ from: from }}
							className="ml-2 text-amber-600 font-semibold hover:text-amber-700"
						>
							Đăng ký ngay
						</Link>
					</p>
					<div className="mt-4 pt-4 border-t border-gray-200">
						<button onClick={() => navigate(from)} className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center mx-auto">
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
							Quay lại
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CustomerLoginPage;