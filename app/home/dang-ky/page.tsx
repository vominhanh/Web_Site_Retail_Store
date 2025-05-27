"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function DangKyPage() {
    const [step, setStep] = useState<'info' | 'otp'>('info');
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", phone: "", address: "" });
    const [otpValue, setOtpValue] = useState<string>('');
    const [showAlert, setShowAlert] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<'success' | 'error'>('error');
    const [isLoading, setIsLoading] = useState(false);
    const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const router = useRouter();

    // Gửi yêu cầu OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        // Kiểm tra email
        if (!form.email) {
            setAlertType('error');
            setShowAlert("Vui lòng nhập địa chỉ email!");
            setTimeout(() => setShowAlert(null), 3000);
            return;
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(form.email)) {
            setAlertType('error');
            setShowAlert("Email không hợp lệ!");
            setTimeout(() => setShowAlert(null), 3000);
            return;
        }

        try {
            setIsLoading(true);

            // Gọi API để gửi OTP
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: form.email,
                    name: form.name
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đã xảy ra lỗi khi gửi mã xác nhận');
            }

            // Đặt thời gian hết hạn để hiển thị đếm ngược
            setOtpExpiry(new Date(data.expires));
            startTimer(new Date(data.expires));

            // Chuyển sang bước nhập OTP
            setStep('otp');
            setAlertType('success');
            setShowAlert(`Mã xác nhận đã được gửi đến ${form.email}!`);
            setTimeout(() => setShowAlert(null), 3000);

        } catch (error: any) {
            setAlertType('error');
            setShowAlert(error.message || "Không thể gửi mã xác nhận. Vui lòng thử lại sau!");
            setTimeout(() => setShowAlert(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    // Xác thực OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otpValue || otpValue.length !== 6) {
            setAlertType('error');
            setShowAlert("Vui lòng nhập đúng mã xác nhận 6 chữ số!");
            setTimeout(() => setShowAlert(null), 3000);
            return;
        }

        try {
            setIsLoading(true);

            // Đặt mật khẩu mới nếu được cung cấp
            const userData: any = {
                email: form.email,
                otp: otpValue
            };

            // Nếu người dùng đã nhập mật khẩu, gửi cùng với xác thực
            if (form.password && form.password.length >= 6) {
                userData.password = form.password;
            }

            // Gọi API để xác thực OTP
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Xác thực không thành công');
            }

            // Lưu token vào localStorage nếu cần
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
            }

            // Đăng ký thành công
            setAlertType('success');
            setShowAlert("Xác thực thành công! Đang chuyển hướng...");

            // Chuyển đến trang bán hàng sau khi đăng ký thành công
            setTimeout(() => {
                router.push('/home/dang-nhap');
            }, 1500);

        } catch (error: any) {
            setAlertType('error');
            setShowAlert(error.message || "Xác thực thất bại. Vui lòng thử lại!");
            setTimeout(() => setShowAlert(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    // Khởi động đếm ngược
    const startTimer = (expiryTime: Date) => {
        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.max(0, Math.floor((expiryTime.getTime() - now.getTime()) / 1000));

            if (diff <= 0) {
                clearInterval(interval);
                setTimer(0);
            } else {
                setTimer(diff);
            }
        }, 1000);

        // Cleanup
        return () => clearInterval(interval);
    };

    // Format thời gian còn lại
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
                        background: alertType === 'success' ? 'var(--success-color, #43a047)' : 'var(--error-color, #d32f2f)',
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
                    {alertType === 'success' ? (
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
                    maxWidth: 480,
                    width: '100%'
                }}
            >
                <button
                    type="button"
                    onClick={() => router.push('/home/ban-hang')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-color, #3f51b5)',
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: 'pointer',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Trở về
                </button>
                <h2 style={{
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 28,
                    color: 'var(--text-primary, #222)',
                    textAlign: 'center',
                    letterSpacing: 1
                }}>
                    {step === 'info' ? 'Đăng ký tài khoản' : 'Xác nhận email'}
                </h2>

                {step === 'info' ? (
                    // Bước 1: Nhập thông tin cơ bản
                    <form onSubmit={handleSendOTP}>
                        <div className="form-field" style={{ marginBottom: 20 }}>
                            <label style={{
                                fontWeight: 600,
                                fontSize: 15,
                                marginBottom: 6,
                                display: 'block',
                                color: 'var(--text-secondary, #444)'
                            }}>
                                Email <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="Nhập địa chỉ email của bạn"
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
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="form-field" style={{ marginBottom: 20 }}>
                            <label style={{
                                fontWeight: 600,
                                fontSize: 15,
                                marginBottom: 6,
                                display: 'block',
                                color: 'var(--text-secondary, #444)'
                            }}>
                                Họ tên
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Nhập họ tên của bạn"
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
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-field" style={{ marginBottom: 20 }}>
                            <label style={{
                                fontWeight: 600,
                                fontSize: 15,
                                marginBottom: 6,
                                display: 'block',
                                color: 'var(--text-secondary, #444)'
                            }}>
                                Mật khẩu (tùy chọn)
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
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
                                disabled={isLoading}
                            />
                            <p style={{ fontSize: 13, color: 'var(--text-secondary, #666)', marginTop: 4 }}>
                                Bạn có thể đặt mật khẩu ngay hoặc thiết lập sau.
                            </p>
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
                                marginTop: 20,
                                letterSpacing: 0.5,
                                opacity: isLoading ? 0.8 : 1,
                                boxShadow: '0 4px 12px rgba(63,81,181,0.2)',
                                transition: 'all 0.2s',
                                position: 'relative'
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
                            {isLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                        style={{ animation: 'spin 1s linear infinite' }}>
                                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                                        <path d="M12 2C6.5 2 2 6.5 2 12"></path>
                                    </svg>
                                    Đang gửi mã...
                                </div>
                            ) : 'Tiếp tục'}
                        </button>
                    </form>
                ) : (
                    // Bước 2: Nhập mã OTP
                    <form onSubmit={handleVerifyOTP}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <p style={{ fontSize: 15, color: 'var(--text-secondary, #666)', marginBottom: 8 }}>
                                Vui lòng nhập mã xác nhận đã được gửi đến
                            </p>
                            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary-color, #3f51b5)' }}>
                                {form.email}
                            </p>
                        </div>

                        <div className="form-field" style={{ marginBottom: 20 }}>
                            <label style={{
                                fontWeight: 600,
                                fontSize: 15,
                                marginBottom: 6,
                                display: 'block',
                                color: 'var(--text-secondary, #444)'
                            }}>
                                Mã xác nhận
                            </label>
                            <input
                                type="text"
                                value={otpValue}
                                onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Nhập mã 6 chữ số"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 'var(--border-radius-md, 8px)',
                                    border: '1px solid #ddd',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    marginTop: 4,
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    letterSpacing: 4,
                                    textAlign: 'center'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary-color, #3f51b5)'}
                                onBlur={e => e.target.style.borderColor = '#ddd'}
                                disabled={isLoading}
                                maxLength={6}
                                autoFocus
                            />

                            {timer > 0 && (
                                <p style={{ fontSize: 13, color: 'var(--text-secondary, #666)', marginTop: 4, textAlign: 'center' }}>
                                    Mã xác nhận sẽ hết hạn sau {formatTime(timer)}
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button
                                type="button"
                                onClick={() => setStep('info')}
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    background: '#f5f5f5',
                                    color: 'var(--text-secondary, #666)',
                                    border: 'none',
                                    borderRadius: 'var(--border-radius-md, 8px)',
                                    padding: '14px 0',
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                    if (!isLoading) e.currentTarget.style.background = '#ececec';
                                }}
                                onMouseOut={e => {
                                    if (!isLoading) e.currentTarget.style.background = '#f5f5f5';
                                }}
                            >
                                Quay lại
                            </button>

                            <button
                                type="submit"
                                disabled={isLoading || otpValue.length !== 6}
                                style={{
                                    flex: 2,
                                    background: 'var(--primary-color, #3f51b5)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 'var(--border-radius-md, 8px)',
                                    padding: '14px 0',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    cursor: (isLoading || otpValue.length !== 6) ? 'not-allowed' : 'pointer',
                                    opacity: (isLoading || otpValue.length !== 6) ? 0.7 : 1,
                                    boxShadow: '0 4px 12px rgba(63,81,181,0.2)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                    if (!isLoading && otpValue.length === 6) {
                                        e.currentTarget.style.background = 'var(--primary-dark, #303f9f)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(63,81,181,0.3)';
                                    }
                                }}
                                onMouseOut={e => {
                                    if (!isLoading && otpValue.length === 6) {
                                        e.currentTarget.style.background = 'var(--primary-color, #3f51b5)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(63,81,181,0.2)';
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            style={{ animation: 'spin 1s linear infinite' }}>
                                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                                            <path d="M12 2C6.5 2 2 6.5 2 12"></path>
                                        </svg>
                                        Đang xác thực...
                                    </div>
                                ) : 'Xác nhận'}
                            </button>
                        </div>

                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={isLoading || timer > 0}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: timer > 0 ? 'var(--text-secondary, #999)' : 'var(--primary-color, #3f51b5)',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: timer > 0 || isLoading ? 'not-allowed' : 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline',
                                    opacity: timer > 0 ? 0.7 : 1
                                }}
                            >
                                {timer > 0 ? `Gửi lại sau ${formatTime(timer)}` : 'Gửi lại mã xác nhận'}
                            </button>
                        </div>
                    </form>
                )}

                <div style={{
                    textAlign: 'center',
                    marginTop: 28,
                    fontSize: 15,
                    color: 'var(--text-secondary, #666)'
                }}>
                    Đã có tài khoản?{' '}
                    <span style={{
                        color: 'var(--primary-color, #3f51b5)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                    }}
                        onClick={() => router.push('/home/dang-nhap')}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--primary-dark, #303f9f)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--primary-color, #3f51b5)'}
                    >
                        Đăng nhập
                    </span>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                .slide-up {
                    animation: slideUp 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
} 