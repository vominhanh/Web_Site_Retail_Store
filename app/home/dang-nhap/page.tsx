"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DangNhapPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [showAlert, setShowAlert] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Xử lý các thông số từ URL
    useEffect(() => {
        // Kiểm tra thông báo lỗi từ middleware
        const error = searchParams.get('error');
        if (error === 'session_expired') {
            setShowAlert('Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.');
            setTimeout(() => setShowAlert(null), 3000);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setShowAlert("Vui lòng nhập đầy đủ thông tin!");
            setTimeout(() => setShowAlert(null), 2000);
            return;
        }
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Kiểm tra nếu tài khoản cần xác thực
                if (data.needVerification) {
                    setShowAlert("Tài khoản chưa được xác thực. Vui lòng kiểm tra email của bạn!");

                    // Chuyển đến trang xác thực nếu cần
                    setTimeout(() => {
                        router.push(`/home/xac-thuc?email=${encodeURIComponent(form.email)}`);
                    }, 2000);
                    return;
                }

                setShowAlert(data.message || "Đăng nhập thất bại!");
                setIsLoading(false);
                setTimeout(() => setShowAlert(null), 3000);
                return;
            }

            // Lưu token vào localStorage và cookie
            localStorage.setItem('token', data.token);
            localStorage.setItem('customerData', JSON.stringify(data.customer));

            // Lưu token vào cookie để middleware có thể truy cập
            document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 ngày

            setShowAlert("Đăng nhập thành công!");

            // Kiểm tra nếu có callbackUrl
            const callbackUrl = searchParams.get('callbackUrl');
            setTimeout(() => {
                setShowAlert(null);
                if (callbackUrl) {
                    router.push(decodeURI(callbackUrl));
                } else {
                    router.push('/home/ban-hang');
                }
            }, 1200);
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            setShowAlert("Đã xảy ra lỗi khi đăng nhập!");
            setTimeout(() => setShowAlert(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        setIsLoading(true);
        setShowAlert("Đang kết nối với Google...");

        // Mô phỏng quá trình đăng nhập Google
        setTimeout(() => {
            setIsLoading(false);
            setShowAlert("Đăng nhập bằng Google thành công!");
            setTimeout(() => {
                setShowAlert(null);
                router.push('/home/ban-hang');
            }, 1200);
        }, 1500);

        // Trong thực tế, bạn sẽ cần sử dụng OAuth với Google
        // Ví dụ: window.location.href = '/api/auth/google';
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--background-color, #f3f6fa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: 'Montserrat, Arial, sans-serif',
            padding: '20px'
        }}>
            {showAlert && (
                <div
                    className="fade-in"
                    style={{
                        position: 'fixed',
                        top: 40,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        background: showAlert.includes('thành công') ? 'var(--success-color, #43a047)' : 'var(--primary-color, #3f51b5)',
                        color: '#fff',
                        padding: '12px 28px',
                        borderRadius: 100,
                        fontWeight: 600,
                        fontSize: 15,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                >
                    {showAlert.includes('thành công') ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="12" y1="16" x2="12" y2="16"></line>
                        </svg>
                    )}
                    {showAlert}
                </div>
            )}
            <div
                className="slide-up"
                style={{
                    background: '#fff',
                    borderRadius: 'var(--border-radius-xl, 18px)',
                    boxShadow: 'var(--shadow-lg, 0 6px 24px rgba(0,0,0,0.1))',
                    padding: '48px 40px',
                    minWidth: 350,
                    maxWidth: 420,
                    width: '100%'
                }}
            >
                <h2 style={{
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 28,
                    color: 'var(--text-primary, #222)',
                    textAlign: 'center',
                    letterSpacing: 1
                }}>Đăng nhập</h2>

                {/* Đăng nhập với Google */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        background: '#fff',
                        color: '#444',
                        border: '1px solid #ddd',
                        borderRadius: 'var(--border-radius-md, 8px)',
                        padding: '12px 0',
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                        if (!isLoading) e.currentTarget.style.background = '#f5f5f5';
                    }}
                    onMouseOut={e => {
                        if (!isLoading) e.currentTarget.style.background = '#fff';
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                    </svg>
                    {isLoading && showAlert?.includes('Google') ? 'Đang xử lý...' : 'Đăng nhập với Google'}
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '20px 0',
                    color: 'var(--text-secondary, #666)',
                    fontSize: 14
                }}>
                    <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                    <div style={{ margin: '0 10px' }}>Hoặc đăng nhập với</div>
                    <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 18 }}>
                        <label style={{
                            fontWeight: 600,
                            fontSize: 15,
                            marginBottom: 6,
                            display: 'block',
                            color: 'var(--text-secondary, #444)'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            placeholder="Nhập địa chỉ email"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 'var(--border-radius-md, 8px)',
                                border: '1px solid #ddd',
                                fontSize: 15,
                                fontWeight: 500,
                                marginTop: 4,
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary-color, #3f51b5)'}
                            onBlur={e => e.target.style.borderColor = '#ddd'}
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label style={{
                                fontWeight: 600,
                                fontSize: 15,
                                color: 'var(--text-secondary, #444)'
                            }}>
                                Mật khẩu
                            </label>
                            <span style={{
                                color: 'var(--primary-color, #3f51b5)',
                                fontWeight: 500,
                                fontSize: 14,
                                cursor: 'pointer'
                            }}>
                                Quên mật khẩu?
                            </span>
                        </div>
                        <input
                            type="password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            placeholder="Nhập mật khẩu"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 'var(--border-radius-md, 8px)',
                                border: '1px solid #ddd',
                                fontSize: 15,
                                fontWeight: 500,
                                marginTop: 4,
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary-color, #3f51b5)'}
                            onBlur={e => e.target.style.borderColor = '#ddd'}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            background: 'var(--primary-color, #3f51b5)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--border-radius-md, 8px)',
                            padding: '14px 0',
                            fontWeight: 700,
                            fontSize: 16,
                            cursor: isLoading ? 'wait' : 'pointer',
                            marginTop: 10,
                            letterSpacing: 0.5,
                            opacity: isLoading ? 0.8 : 1,
                            boxShadow: '0 4px 12px rgba(63,81,181,0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => {
                            if (!isLoading) {
                                e.currentTarget.style.background = 'var(--primary-dark, #303f9f)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(63,81,181,0.3)';
                            }
                        }}
                        onMouseOut={e => {
                            if (!isLoading) {
                                e.currentTarget.style.background = 'var(--primary-color, #3f51b5)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(63,81,181,0.2)';
                            }
                        }}
                    >
                        {isLoading && !showAlert?.includes('Google') ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>
                <div style={{
                    textAlign: 'center',
                    marginTop: 24,
                    fontSize: 15,
                    color: 'var(--text-secondary, #666)'
                }}>
                    Chưa có tài khoản?{' '}
                    <span style={{
                        color: 'var(--primary-color, #3f51b5)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                    }}
                        onClick={() => router.push('/home/dang-ky')}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--primary-dark, #303f9f)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--primary-color, #3f51b5)'}
                    >
                        Đăng ký ngay
                    </span>
                </div>
            </div>
        </div>
    );
} 