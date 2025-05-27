'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';

interface CustomerData {
    _id?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
    is_active?: boolean;
    is_verified?: boolean;
    created_at?: string;
    updated_at?: string;
    last_login?: string;
}

export default function ThongTinCaNhanPage() {
    const [customerData, setCustomerData] = useState<CustomerData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<CustomerData>({
        name: '',
        email: '',
        phone: '',
        address: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const token = localStorage.getItem('token');
        const storedCustomerData = localStorage.getItem('customerData');

        if (!token || !storedCustomerData) {
            router.push('/home/dang-nhap');
            return;
        }

        try {
            const parsedData = JSON.parse(storedCustomerData);
            setCustomerData(parsedData);
            setFormData({
                name: parsedData.name || '',
                email: parsedData.email || '',
                phone: parsedData.phone || '',
                address: parsedData.address || '',
            });
        } catch (error) {
            console.error('Lỗi khi phân tích dữ liệu khách hàng:', error);
            router.push('/home/dang-nhap');
        }
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Gọi API cập nhật thông tin
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/customers/${customerData?._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Cập nhật dữ liệu người dùng trong localStorage
                const updatedCustomerData = { ...customerData, ...formData };
                localStorage.setItem('customerData', JSON.stringify(updatedCustomerData));
                setCustomerData(updatedCustomerData);

                setShowAlert({
                    type: 'success',
                    message: 'Cập nhật thông tin thành công!'
                });

                setIsEditing(false);
            } else {
                setShowAlert({
                    type: 'error',
                    message: data.message || 'Có lỗi xảy ra khi cập nhật thông tin!'
                });
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật thông tin:', error);
            setShowAlert({
                type: 'error',
                message: 'Có lỗi xảy ra khi cập nhật thông tin!'
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => setShowAlert(null), 3000);
        }
    };

    if (!customerData) {
        return (
            <div style={{ minHeight: '100vh' }}>
                <Header />
                <div className="flex-center" style={{ height: 'calc(100vh - 80px)' }}>
                    <div className="flex-center flex-col gap-md">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
                        <p>Đang tải thông tin...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background-color)' }}>
            <Header />

            {/* Alert message */}
            {showAlert && (
                <div className="fade-in" style={{
                    position: 'fixed',
                    top: 100,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: showAlert.type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
                    color: '#fff',
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    borderRadius: 'var(--border-radius-full)',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                }}>
                    {showAlert.type === 'success' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    )}
                    {showAlert.message}
                </div>
            )}

            <div className="container" style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: 'var(--spacing-2xl) var(--spacing-lg)'
            }}>
                <div className="bg-surface" style={{
                    borderRadius: 'var(--border-radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden'
                }}>
                    {/* Phần header */}
                    <div style={{
                        background: 'var(--primary-color)',
                        padding: 'var(--spacing-xl)',
                        color: 'white',
                        position: 'relative'
                    }}>
                        <h1 style={{
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 700,
                            marginBottom: 'var(--spacing-xs)'
                        }}>Thông tin cá nhân</h1>
                        <p style={{ opacity: 0.8 }}>Xem và cập nhật thông tin tài khoản của bạn</p>
                    </div>

                    {/* Phần thông tin */}
                    <div style={{ padding: 'var(--spacing-xl)' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: 'var(--primary-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    border: '4px solid white',
                                    boxShadow: 'var(--shadow-md)'
                                }}>
                                    {customerData.avatar ? (
                                        <img
                                            src={customerData.avatar}
                                            alt={customerData.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        customerData.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h2 style={{
                                        fontSize: 'var(--font-size-xl)',
                                        fontWeight: 700,
                                        marginBottom: 'var(--spacing-xs)'
                                    }}>{customerData.name}</h2>
                                    <p style={{ color: 'var(--text-secondary)' }}>{customerData.email}</p>
                                    {customerData.is_verified && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-xs)',
                                            background: 'var(--success-color)',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            marginTop: 'var(--spacing-xs)'
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                            Đã xác thực
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{
                                    display: 'block',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-xs)'
                                }}>Họ và tên</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid #ddd',
                                        fontSize: 'var(--font-size-md)',
                                        backgroundColor: isEditing ? 'white' : '#f9f9f9'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{
                                    display: 'block',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-xs)'
                                }}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={true} // Email không thể thay đổi
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid #ddd',
                                        fontSize: 'var(--font-size-md)',
                                        backgroundColor: '#f9f9f9'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{
                                    display: 'block',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-xs)'
                                }}>Số điện thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid #ddd',
                                        fontSize: 'var(--font-size-md)',
                                        backgroundColor: isEditing ? 'white' : '#f9f9f9'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <label style={{
                                    display: 'block',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-xs)'
                                }}>Địa chỉ</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid #ddd',
                                        fontSize: 'var(--font-size-md)',
                                        resize: 'vertical',
                                        backgroundColor: isEditing ? 'white' : '#f9f9f9'
                                    }}
                                />
                            </div>

                            {isEditing && (
                                <div className="flex gap-md">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        style={{
                                            background: 'var(--success-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 'var(--border-radius-md)',
                                            padding: 'var(--spacing-md) var(--spacing-xl)',
                                            fontWeight: 600,
                                            cursor: isLoading ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-xs)'
                                        }}
                                    >
                                        {isLoading && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                        )}
                                        Lưu thay đổi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                name: customerData.name || '',
                                                email: customerData.email || '',
                                                phone: customerData.phone || '',
                                                address: customerData.address || '',
                                            });
                                        }}
                                        style={{
                                            background: '#f3f4f6',
                                            color: '#374151',
                                            border: 'none',
                                            borderRadius: 'var(--border-radius-md)',
                                            padding: 'var(--spacing-md) var(--spacing-xl)',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            )}
                        </form>
                        {!isEditing && (
                            <div className="flex gap-md" style={{ marginTop: 16 }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--border-radius-md)',
                                        padding: 'var(--spacing-md) var(--spacing-xl)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)'
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Chỉnh sửa thông tin
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer với thông tin thêm */}
                    <div style={{
                        borderTop: '1px solid #eee',
                        padding: 'var(--spacing-lg) var(--spacing-xl)',
                        background: '#f9f9f9'
                    }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <span style={{ fontWeight: 600 }}>Ngày tham gia:</span>
                            <span>{new Date(customerData.created_at || '').toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span style={{ fontWeight: 600 }}>Đăng nhập gần nhất:</span>
                            <span>{customerData.last_login ? new Date(customerData.last_login).toLocaleDateString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            }) : 'Không có dữ liệu'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 