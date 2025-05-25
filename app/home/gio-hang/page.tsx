"use client";
import React, { useState, useEffect } from "react";
import { useCart, Product } from "../cart/CartContext";
import { useRouter } from "next/navigation";

// Danh sách mã giảm giá
const discountCodes = [
    { code: "GIAMGIA10", value: 0.1, name: "Giảm 10%" },
    { code: "GIAMGIA20", value: 0.2, name: "Giảm 20%" },
    { code: "SALE30", value: 0.3, name: "Giảm 30%" },
    { code: "WELCOME", value: 0.15, name: "Chào mừng - Giảm 15%" },
];

const paymentMethods = [
    { value: "cash", label: "Tiền mặt" },
    { value: "bank", label: "Chuyển khoản" },
    { value: "momo", label: "Ví MoMo" },
];

export default function GioHangPage() {
    const { cart, increaseQty, decreaseQty, removeFromCart, clearCart, getTotalQty } = useCart();
    const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
    const [payment, setPayment] = useState("cash");
    const [showOrderSuccess, setShowOrderSuccess] = useState(false);
    const [showAlert, setShowAlert] = useState<string | null>(null);
    const [discountCode, setDiscountCode] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; value: number; name: string } | null>(null);
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const subtotal = cart.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price * item.qty : 0), 0);
    const discountAmount = appliedDiscount ? subtotal * appliedDiscount.value : 0;
    const total = subtotal - discountAmount;

    useEffect(() => {
        // Kiểm tra trạng thái đăng nhập
        const token = localStorage.getItem('token');
        const storedCustomerData = localStorage.getItem('customerData');

        if (token && storedCustomerData) {
            setIsLoggedIn(true);

            try {
                // Nếu đăng nhập thành công và có giỏ hàng lưu trong localStorage, 
                // có thể xử lý logic đồng bộ giỏ hàng từ localStorage với giỏ hàng server ở đây
                const customerData = JSON.parse(storedCustomerData);
                setCustomer({
                    name: customerData.name || '',
                    phone: customerData.phone || '',
                    address: ''
                });
            } catch (error) {
                console.error('Lỗi khi phân tích dữ liệu khách hàng:', error);
            }
        }
    }, []);

    const handleApplyDiscount = () => {
        if (!discountCode.trim()) {
            setShowAlert("Vui lòng nhập mã giảm giá!");
            setTimeout(() => setShowAlert(null), 2000);
            return;
        }

        const discount = discountCodes.find(
            (d) => d.code.toLowerCase() === discountCode.trim().toLowerCase()
        );

        if (!discount) {
            setShowAlert("Mã giảm giá không hợp lệ!");
            setTimeout(() => setShowAlert(null), 2000);
            return;
        }

        setAppliedDiscount(discount);
        setShowAlert(`Đã áp dụng mã giảm giá: ${discount.name}`);
        setTimeout(() => setShowAlert(null), 2000);
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode("");
    };

    const handleCheckout = () => {
        if (!isLoggedIn) {
            // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
            const callbackUrl = encodeURIComponent('/home/gio-hang');
            router.push(`/home/dang-nhap?callbackUrl=${callbackUrl}`);
            return;
        }

        if (!customer.name || !customer.phone || !customer.address || cart.length === 0) {
            setShowAlert("Vui lòng nhập đủ thông tin và chọn sản phẩm!");
            setTimeout(() => setShowAlert(null), 2000);
            return;
        }

        // Tạo đơn hàng với thông tin giảm giá
        const orderData = {
            items: cart,
            customer,
            payment,
            subtotal,
            discount: appliedDiscount ? {
                code: appliedDiscount.code,
                value: appliedDiscount.value,
                amount: discountAmount
            } : null,
            total
        };

        // Log đơn hàng để kiểm tra (có thể gửi đến API sau này)
        console.log('Đơn hàng đã tạo:', orderData);

        setShowOrderSuccess(true);
        clearCart();
        setCustomer({ name: "", phone: "", address: "" });
        setPayment("cash");
        setAppliedDiscount(null);
        setDiscountCode("");

        setTimeout(() => {
            setShowOrderSuccess(false);
            router.push('/home/ban-hang');
        }, 2000);
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f3f6fa", fontFamily: 'Montserrat, Arial, sans-serif', position: 'relative', padding: '60px 0' }}>
            {/* Alert */}
            {showAlert && (
                <div style={{
                    position: 'fixed',
                    top: 30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: '#d32f2f',
                    color: '#fff',
                    padding: '12px 28px',
                    borderRadius: 100,
                    fontWeight: 600,
                    fontSize: 15,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    {showAlert}
                </div>
            )}
            {/* Popup Order Success */}
            {showOrderSuccess && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '40px 60px', boxShadow: '0 4px 32px rgba(0,0,0,0.15)', textAlign: 'center', maxWidth: 500 }}>
                        <div style={{ fontSize: 50, color: '#4CAF50', marginBottom: 20 }}>✓</div>
                        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#333', marginBottom: 16 }}>Đơn hàng đã được tạo thành công!</h2>
                        <p style={{ fontSize: 16, color: '#666', marginBottom: 0 }}>Cảm ơn bạn đã mua hàng!</p>
                    </div>
                </div>
            )}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
                    <button
                        onClick={() => router.push('/home/ban-hang')}
                        className="back-button"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'none',
                            border: 'none',
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#333',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: 8,
                            marginRight: 16
                        }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Tiếp tục mua hàng
                    </button>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: '#222', letterSpacing: 0.5, margin: 0 }}>Giỏ hàng & Thanh toán</h1>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: 30, marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Giỏ hàng của bạn</h2>
                            {cart.length > 0 && (
                                <div style={{ fontSize: 15, color: '#777', fontWeight: 500 }}>
                                    {getTotalQty()} sản phẩm
                                </div>
                            )}
                        </div>

                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                                <div style={{ fontSize: 80, marginBottom: 16, opacity: 0.2 }}>🛒</div>
                                <p style={{ fontSize: 20, fontStyle: 'italic', marginBottom: 24 }}>Chưa có sản phẩm nào trong giỏ hàng</p>
                                <button
                                    onClick={() => router.push('/home/ban-hang')}
                                    className="add-to-cart-btn"
                                    style={{
                                        background: '#222',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '12px 24px',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}>
                                    Mua sắm ngay
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
                                    {cart.map((item) => (
                                        <div key={item._id || item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
                                            <img
                                                className="product-image"
                                                src={item.image || 'https://via.placeholder.com/80?text=No+Image'}
                                                alt={item.name}
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: 8,
                                                    objectFit: 'cover',
                                                    marginRight: 20,
                                                    border: '1px solid #eee'
                                                }}
                                                onError={e => (e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image')}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>{item.name}</h3>
                                                {item.desc && <p style={{ fontSize: 14, color: '#666', margin: '0 0 6px' }}>{item.desc}</p>}
                                                <div style={{ color: '#ff6b35', fontWeight: 700, fontSize: 18 }}>
                                                    {typeof item.price === 'number' ? item.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', marginRight: 20 }}>
                                                <button
                                                    onClick={() => decreaseQty(item.id || item._id || 0)}
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        border: '1px solid #ddd',
                                                        background: '#f9f9f9',
                                                        color: '#222',
                                                        fontWeight: 700,
                                                        fontSize: 16,
                                                        cursor: 'pointer',
                                                        marginRight: 10,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                    -
                                                </button>
                                                <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 600, fontSize: 16 }}>{item.qty}</span>
                                                <button
                                                    onClick={() => increaseQty(item.id || item._id || 0)}
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        background: '#222',
                                                        color: '#fff',
                                                        fontWeight: 700,
                                                        fontSize: 16,
                                                        cursor: 'pointer',
                                                        marginLeft: 10,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                    +
                                                </button>
                                            </div>
                                            <div style={{ fontSize: 20, fontWeight: 700, width: 140, textAlign: 'right' }}>
                                                {(item.price * item.qty).toLocaleString('vi-VN')}đ
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id || item._id || 0)}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: -10,
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#999',
                                                    fontSize: 20,
                                                    cursor: 'pointer',
                                                    padding: 5
                                                }}>
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20 }}>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#666' }}>Tổng cộng:</div>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: '#ff6b35' }}>{total.toLocaleString('vi-VN')}đ</div>
                                </div>
                            </>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: 30 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Thông tin thanh toán</h2>

                            {/* Phần mã giảm giá */}
                            <div style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 12, border: '1px dashed #ddd' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#444' }}>Mã giảm giá</h3>

                                {appliedDiscount ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: '#4CAF50' }}>
                                                {appliedDiscount.name} đã được áp dụng
                                            </div>
                                            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                                                Bạn được giảm: {discountAmount.toLocaleString('vi-VN')}đ
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveDiscount}
                                            style={{
                                                background: 'none',
                                                border: '1px solid #ddd',
                                                borderRadius: 8,
                                                padding: '8px 16px',
                                                color: '#666',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            value={discountCode}
                                            onChange={(e) => setDiscountCode(e.target.value)}
                                            placeholder="Nhập mã giảm giá"
                                            style={{
                                                flex: 1,
                                                padding: '12px 16px',
                                                borderRadius: 8,
                                                border: '1px solid #ddd',
                                                fontSize: 15,
                                                outline: 'none'
                                            }}
                                        />
                                        <button
                                            onClick={handleApplyDiscount}
                                            style={{
                                                background: '#3f51b5',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '0 20px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Tổng tiền sau giảm giá */}
                            <div style={{ marginBottom: 24, padding: '16px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ color: '#666' }}>Tạm tính:</div>
                                    <div style={{ fontWeight: 600 }}>{subtotal.toLocaleString('vi-VN')}đ</div>
                                </div>

                                {appliedDiscount && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ color: '#666' }}>Giảm giá:</div>
                                        <div style={{ fontWeight: 600, color: '#4CAF50' }}>-{discountAmount.toLocaleString('vi-VN')}đ</div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
                                    <div>Tổng thanh toán:</div>
                                    <div style={{ color: '#ff6b35' }}>{total.toLocaleString('vi-VN')}đ</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                                <div style={{ flex: '1 1 300px' }}>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#555' }}>Họ tên</label>
                                    <input
                                        placeholder="Nhập họ tên khách hàng"
                                        value={customer.name}
                                        onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: 8,
                                            border: '1px solid #ddd',
                                            fontSize: 15,
                                            outline: 'none',
                                            fontWeight: 500,
                                            backgroundColor: isLoggedIn ? '#f9f9f9' : 'white'
                                        }}
                                        readOnly={isLoggedIn}
                                    />
                                </div>
                                <div style={{ flex: '1 1 300px' }}>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#555' }}>Số điện thoại</label>
                                    <input
                                        placeholder="Nhập số điện thoại"
                                        value={customer.phone}
                                        onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: 8,
                                            border: '1px solid #ddd',
                                            fontSize: 15,
                                            outline: 'none',
                                            fontWeight: 500
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#555' }}>Địa chỉ giao hàng</label>
                                <input
                                    placeholder="Nhập địa chỉ giao hàng"
                                    value={customer.address}
                                    onChange={e => setCustomer({ ...customer, address: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        border: '1px solid #ddd',
                                        fontSize: 15,
                                        outline: 'none',
                                        fontWeight: 500
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: 30 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#555' }}>Phương thức thanh toán</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                    {paymentMethods.map(m => (
                                        <div
                                            key={m.value}
                                            onClick={() => setPayment(m.value)}
                                            className="payment-method"
                                            style={{
                                                flex: '1 1 140px',
                                                padding: '12px 16px',
                                                border: `2px solid ${payment === m.value ? '#222' : '#ddd'}`,
                                                borderRadius: 8,
                                                fontSize: 15,
                                                fontWeight: 600,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                background: payment === m.value ? '#f9f9f9' : '#fff'
                                            }}
                                        >
                                            {m.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleCheckout}
                                className="checkout-button"
                                style={{
                                    width: '100%',
                                    background: '#4CAF50',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '16px 0',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
                                }}>
                                {isLoggedIn ? 'Thanh toán' : 'Đăng nhập để thanh toán'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 