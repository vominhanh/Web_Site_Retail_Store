'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderShipping {
    _id: string;
    order_id: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    shipping_address: string;
    status: string;
    shipping_fee: number;
    payment_method: string;
    created_at: string;
    updated_at: string;
    order_code?: string;
}

function getStatusDisplay(status: string) {
    if (status === 'pending') {
        return <span style={{ background: '#fffbe6', color: '#ff9800', padding: '4px 12px', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2" /><circle cx="12" cy="12" r="5" fill="#ff9800" /></svg>
            Chờ xác nhận
        </span>;
    }
    if (status === 'confirmed') {
        return <span style={{ background: '#e3fcec', color: '#388e3c', padding: '4px 12px', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#388e3c" strokeWidth="2" /><polyline points="8 12 11 15 16 10" stroke="#388e3c" strokeWidth="2" fill="none" /></svg>
            Đã xác nhận
        </span>;
    }
    if (status === 'shipping') {
        return <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 12px', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#1976d2" strokeWidth="2" /><path d="M8 12h8" stroke="#1976d2" strokeWidth="2" /></svg>
            Đang giao hàng
        </span>;
    }
    if (status === 'delivered') {
        return <span style={{ background: '#e8f5e9', color: '#43a047', padding: '4px 12px', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#43a047" strokeWidth="2" /><polyline points="8 12 11 15 16 10" stroke="#43a047" strokeWidth="2" fill="none" /></svg>
            Đã giao
        </span>;
    }
    if (status === 'cancelled') {
        return <span style={{ background: '#ffebee', color: '#d32f2f', padding: '4px 12px', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#d32f2f" strokeWidth="2" /><line x1="8" y1="8" x2="16" y2="16" stroke="#d32f2f" strokeWidth="2" /><line x1="16" y1="8" x2="8" y2="16" stroke="#d32f2f" strokeWidth="2" /></svg>
            Đã hủy
        </span>;
    }
    return status;
}

export default function DonHangPage() {
    const [orders, setOrders] = useState<OrderShipping[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [selectedOrder, setSelectedOrder] = useState<OrderShipping | null>(null);
    const [orderDetail, setOrderDetail] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        const storedCustomerData = localStorage.getItem('customerData');
        if (!storedCustomerData) {
            setError('Bạn chưa đăng nhập!');
            setLoading(false);
            return;
        }
        const customer = JSON.parse(storedCustomerData);
        const customerId = customer._id;
        if (!customerId) {
            setError('Không tìm thấy thông tin khách hàng!');
            setLoading(false);
            return;
        }
        fetch(`/api/order-shipping?customer_id=${customerId}`)
            .then(res => res.json())
            .then(data => {
                setOrders(data.orders || []);
                setLoading(false);
            })
            .catch(() => {
                setError('Lỗi khi tải đơn hàng!');
                setLoading(false);
            });
    }, []);

    const handleShowDetail = async (order: OrderShipping) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/orders/${order.order_id}`);
            const data = await res.json();
            setOrderDetail(data.order);
        } catch {
            setOrderDetail(null);
        }
        setLoadingDetail(false);
    };

    if (loading) return <div style={{ padding: 40 }}>Đang tải đơn hàng...</div>;
    if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>;

    return (
        <div style={{ maxWidth: 1600, margin: '40px auto', background: '#fff', borderRadius: 20, boxShadow: '0 6px 32px rgba(0,0,0,0.10)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
                <button
                    onClick={() => router.push('/home/ban-hang')}
                    style={{
                        background: '#f3f6fa',
                        color: '#222',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 24px',
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: 'pointer',
                        marginRight: 20,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                    &larr; Quay lại mua hàng
                </button>
                <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: 0.5, color: '#222' }}>Đơn hàng của tôi</h1>
            </div>
            {orders.length === 0 ? (
                <div style={{ color: '#888', fontSize: 18, textAlign: 'center', padding: 40 }}>Chưa có đơn hàng nào.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fafbfc', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        <thead>
                            <tr style={{ background: '#f3f6fa' }}>
                                <th style={{ padding: 16, borderBottom: '2px solid #eee', fontWeight: 800, fontSize: 17, color: '#222', textAlign: 'center' }}>Tên khách</th>
                                <th style={{ padding: 16, borderBottom: '2px solid #eee', fontWeight: 800, fontSize: 17, color: '#222', textAlign: 'center' }}>SĐT</th>
                                <th style={{ padding: 16, borderBottom: '2px solid #eee', fontWeight: 800, fontSize: 17, color: '#222', textAlign: 'center' }}>Địa chỉ giao</th>
                                <th style={{ padding: 16, borderBottom: '2px solid #eee', fontWeight: 800, fontSize: 17, color: '#222', textAlign: 'center' }}>Phí ship</th>
                                <th style={{ padding: 16, borderBottom: '2px solid #eee', fontWeight: 800, fontSize: 17, color: '#222', textAlign: 'center' }}>Thanh toán</th>
                                <th style={{ padding: 16, borderBottom: '2px solid #eee', fontWeight: 800, fontSize: 17, color: '#222', textAlign: 'center' }}>Trạng thái</th>
                                <th style={{ padding: 16, borderBottom: '2px solid #eee', fontWeight: 800, fontSize: 17, color: '#222', textAlign: 'center' }}>Mã đơn hàng</th>
                                <th style={{ padding: 16, borderBottom: '2px solid #eee', fontWeight: 800, fontSize: 17, color: '#222', textAlign: 'center' }}>Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id} style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f6f8fa')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                                >
                                    <td style={{ padding: 14, textAlign: 'center' }}>{order.customer_name}</td>
                                    <td style={{ padding: 14, textAlign: 'center' }}>{order.customer_phone}</td>
                                    <td style={{ padding: 14, textAlign: 'center' }}>{order.shipping_address}</td>
                                    <td style={{ padding: 14, textAlign: 'right', color: '#1976d2', fontWeight: 700 }}>{order.shipping_fee.toLocaleString('vi-VN')}đ</td>
                                    <td style={{
                                        padding: 14,
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        color: order.payment_method === 'cash' ? '#388e3c'
                                            : order.payment_method === 'bank' ? '#1976d2'
                                                : order.payment_method === 'momo' ? '#d81b60'
                                                    : '#222',
                                        fontSize: 16,
                                        letterSpacing: 0.5
                                    }}>
                                        {order.payment_method === 'cash' && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" fill="#388e3c" opacity="0.15" /><rect x="3" y="7" width="18" height="10" rx="2" stroke="#388e3c" strokeWidth="2" /><circle cx="12" cy="12" r="2" fill="#388e3c" /></svg>
                                                Tiền mặt
                                            </span>
                                        )}
                                        {order.payment_method === 'bank' && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" fill="#1976d2" opacity="0.15" /><rect x="3" y="7" width="18" height="10" rx="2" stroke="#1976d2" strokeWidth="2" /><rect x="7" y="11" width="10" height="2" fill="#1976d2" /></svg>
                                                Chuyển khoản
                                            </span>
                                        )}
                                        {order.payment_method === 'momo' && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" fill="#d81b60" opacity="0.15" /><rect x="3" y="7" width="18" height="10" rx="2" stroke="#d81b60" strokeWidth="2" /><circle cx="12" cy="12" r="2" fill="#d81b60" /></svg>
                                                Ví MoMo
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: 14, textAlign: 'center' }}>{getStatusDisplay(order.status)}</td>
                                    <td style={{ padding: 14, textAlign: 'center', fontWeight: 700, color: '#3f51b5', fontSize: 16, cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => handleShowDetail(order)}>
                                        {order.order_code || order.order_id}
                                    </td>
                                    <td style={{ padding: 14, textAlign: 'center', color: '#555' }}>{new Date(order.created_at).toLocaleTimeString('vi-VN') + ' ' + new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showDetailModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 400, maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => setShowDetailModal(false)} style={{ position: 'absolute', top: 16, right: 16, fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 16 }}>Chi tiết đơn hàng</h2>
                        {loadingDetail ? (
                            <div>Đang tải...</div>
                        ) : orderDetail ? (
                            <>
                                <div style={{ marginBottom: 16 }}>
                                    <strong>Mã đơn:</strong> <span style={{ color: '#3f51b5', fontWeight: 700 }}>{orderDetail.order_code}</span><br />
                                    <strong>Ngày tạo:</strong> <span style={{ color: '#555' }}>{new Date(orderDetail.created_at).toLocaleString('vi-VN')}</span>
                                </div>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'separate',
                                    borderSpacing: 0,
                                    background: '#f8fafc',
                                    borderRadius: 14,
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 12px rgba(63,81,181,0.07)',
                                    marginBottom: 18,
                                    fontFamily: 'Montserrat, Arial, sans-serif',
                                    fontSize: 16
                                }}>
                                    <thead>
                                        <tr style={{ background: '#e3e8f0' }}>
                                            <th style={{ borderBottom: '2px solid #e0e7ef', padding: 12, textAlign: 'left', fontWeight: 800, color: '#222' }}>Sản phẩm</th>
                                            <th style={{ borderBottom: '2px solid #e0e7ef', padding: 12, textAlign: 'center', fontWeight: 800, color: '#222' }}>SL</th>
                                            <th style={{ borderBottom: '2px solid #e0e7ef', padding: 12, textAlign: 'right', fontWeight: 800, color: '#222' }}>Đơn giá</th>
                                            <th style={{ borderBottom: '2px solid #e0e7ef', padding: 12, textAlign: 'right', fontWeight: 800, color: '#222' }}>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderDetail.items.map((item: any, idx: number) => (
                                            <tr key={idx} style={{
                                                background: '#fff',
                                                borderBottom: '1px solid #f0f0f0',
                                                transition: 'background 0.2s'
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#f6f8fa')}
                                                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                                            >
                                                <td style={{ padding: 12, fontWeight: 700, color: '#1976d2' }}>{item.product_name || item.name || item.product_id}</td>
                                                <td style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                                                <td style={{ padding: 12, textAlign: 'right', color: '#222' }}>{item.price.toLocaleString('vi-VN')}đ</td>
                                                <td style={{ padding: 12, textAlign: 'right', fontWeight: 700 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ textAlign: 'right', fontWeight: 900, fontSize: 22, color: '#ff6b35', marginTop: 10, letterSpacing: 0.5 }}>
                                    Tổng tiền: {(orderDetail.total_amount).toLocaleString('vi-VN')}đ
                                </div>
                            </>
                        ) : (
                            <div>Không tìm thấy chi tiết đơn hàng.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 