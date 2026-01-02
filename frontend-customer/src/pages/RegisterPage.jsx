import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import customerService from "../services/customerService";

const RegisterPage = () => {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: ""
	});
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	// Lấy URL gốc đã được truyền từ Login sang (VD: /menu?table=...)
	const from = location.state?.from || "/";

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		setError("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		if (formData.password !== formData.confirmPassword) {
			setError("Mật khẩu xác nhận không khớp");
			setLoading(false);
			return;
		}

		try {
			await customerService.register(formData.username, formData.email, formData.password);
			setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
			
			setTimeout(() => {
				navigate("/customer/login", { 
					state: { 
						registeredUsername: formData.username,
						from: from, // TRUYỀN NGƯỢC LẠI ĐỂ LOGIN BIẾT ĐƯỜNG VỀ MENU
						message: "Đăng ký thành công! Vui lòng đăng nhập." 
					}
				});
			}, 2000);

		} catch (err) {
			setError(err.message || "Đăng ký thất bại");
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
					<h2 className="text-xl font-semibold mt-2 text-gray-700">Đăng Ký Khách Hàng</h2>
				</div>
				
				{error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">{error}</div>}
				{success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">{success}</div>}
				
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">Tên đăng nhập</label>
						<input name="username" type="text" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nhập tên đăng nhập" required disabled={loading} />
					</div>
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
						<input name="email" type="email" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nhập email" required disabled={loading} />
					</div>
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">Mật khẩu</label>
						<input name="password" type="password" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Ít nhất 6 ký tự" required disabled={loading} />
					</div>
					<div>
						<label className="block text-gray-700 text-sm font-bold mb-2">Xác nhận mật khẩu</label>
						<input name="confirmPassword" type="password" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nhập lại mật khẩu" required disabled={loading} />
					</div>

					<button type="submit" disabled={loading} className={`w-full text-white font-bold py-3 px-4 rounded-lg transition ${loading ? "bg-gray-400" : "bg-amber-600 hover:bg-amber-700"}`}>
						{loading ? "Đang đăng ký..." : "Đăng Ký"}
					</button>
				</form>

				<div className="mt-8 text-center">
					<p className="text-gray-600">
						Đã có tài khoản?
						<Link to="/customer/login" state={{ from: from }} className="ml-2 text-amber-600 font-semibold hover:text-amber-700">Đăng nhập ngay</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default RegisterPage;