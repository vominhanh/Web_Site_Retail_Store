"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerData {
    name: string;
    avatar?: string;
    email?: string;
    _id?: string;
}

export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [customerData, setCustomerData] = useState<CustomerData | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const token = localStorage.getItem('token');
        const storedCustomerData = localStorage.getItem('customerData');

        if (token && storedCustomerData) {
            try {
                const parsedData = JSON.parse(storedCustomerData);
                setCustomerData(parsedData);
                setIsLoggedIn(true);
            } catch (error) {
                console.error('Lỗi khi phân tích dữ liệu khách hàng:', error);
                handleLogout(); // Xóa dữ liệu không hợp lệ
            }
        }
    }, []);

    const handleLogout = () => {
        // Xóa thông tin đăng nhập khỏi localStorage và cookie
        localStorage.removeItem('token');
        localStorage.removeItem('customerData');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

        // Cập nhật trạng thái
        setIsLoggedIn(false);
        setCustomerData(null);

        // Chuyển hướng về trang đăng nhập
        router.push('/home/dang-nhap');
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    return (
        <header className="bg-surface flex-between" style={{
            padding: '0 var(--spacing-2xl)',
            height: 80,
            boxShadow: 'var(--shadow-md)',
            position: 'sticky',
            top: 0,
            zIndex: 1200
        }}>
            <div className="flex gap-md">
                {/* Logo */}
                <div className="flex-center" style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--border-radius-md)',
                    background: '#f5f7fa',
                    padding: 'var(--spacing-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform var(--transition-fast)'
                }}
                    onClick={() => router.push('/home/ban-hang')}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/891/891419.png"
                        alt="Logo"
                        style={{
                            width: 32,
                            height: 32,
                            objectFit: 'cover',
                        }}
                    />
                </div>
                <h1 style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 800,
                    background: `linear-gradient(45deg, var(--primary-color), var(--accent-color))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: 0.5,
                    margin: 0,
                    cursor: 'pointer'
                }} onClick={() => router.push('/home/ban-hang')}>Bán hàng trực tuyến</h1>
            </div>

            <div className="flex gap-md items-center">
                {isLoggedIn && customerData ? (
                    <div className="relative">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={toggleDropdown}
                        >
                            <div className="flex flex-col items-end">
                                <span className="font-semibold text-gray-800">{customerData.name}</span>
                                <span className="text-xs text-gray-500">{customerData.email}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                                {customerData.avatar ? (
                                    <img
                                        src={customerData.avatar}
                                        alt={customerData.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-primary-color flex items-center justify-center text-white font-bold">
                                        {customerData.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    transition: 'transform 0.2s',
                                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                <a
                                    href="#"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => {
                                        setShowDropdown(false);
                                        router.push('/home/thong-tin-ca-nhan');
                                    }}
                                >
                                    Thông tin cá nhân
                                </a>
                                <a
                                    href="#"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => {
                                        setShowDropdown(false);
                                        router.push('/home/don-hang');
                                    }}
                                >
                                    Đơn hàng của tôi
                                </a>
                                <a
                                    href="#"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => {
                                        setShowDropdown(false);
                                        router.push('/home/gio-hang');
                                    }}
                                >
                                    Giỏ hàng
                                </a>
                                <hr className="my-1" />
                                <a
                                    href="#"
                                    className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    onClick={() => {
                                        setShowDropdown(false);
                                        handleLogout();
                                    }}
                                >
                                    Đăng xuất
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => router.push('/home/dang-nhap')}
                            className="flex-center gap-sm"
                            style={{
                                background: '#fff',
                                color: 'var(--primary-color)',
                                border: `1.5px solid var(--primary-color)`,
                                borderRadius: 'var(--border-radius-md)',
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                fontWeight: 600,
                                fontSize: 'var(--font-size-sm)',
                                transition: 'all var(--transition-fast)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = 'var(--primary-color)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.color = 'var(--primary-color)';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            Đăng nhập
                        </button>
                        <button
                            onClick={() => router.push('/home/dang-ky')}
                            className="flex-center gap-sm"
                            style={{
                                background: 'var(--primary-color)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 'var(--border-radius-md)',
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                fontWeight: 600,
                                fontSize: 'var(--font-size-sm)',
                                transition: 'all var(--transition-fast)',
                                boxShadow: '0 4px 8px rgba(63,81,181,0.2)'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = 'var(--primary-dark)';
                                e.currentTarget.style.boxShadow = '0 6px 12px rgba(63,81,181,0.3)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'var(--primary-color)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(63,81,181,0.2)';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                            Đăng ký
                        </button>
                    </>
                )}
            </div>
        </header>
    );
} 