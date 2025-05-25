'use client'
import React, { useState, useEffect } from 'react';
import { useCart, Product as BaseProduct } from '../cart/CartContext';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';

// Mở rộng Product để có inventory và barcode
export type Product = BaseProduct & {
    inventory?: number;
    barcode?: string;
    image_links?: string[];
    _id?: string;
};

const discounts = [
    { code: 'GIAM10', value: 0.1, label: 'Giảm 10%' },
    { code: 'GIAM20', value: 0.2, label: 'Giảm 20%' },
];

const paymentMethods = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'bank', label: 'Chuyển khoản' },
    { value: 'card', label: 'Quẹt thẻ' },
    { value: 'momo', label: 'Ví MoMo' },
];

const getLabelColor = (label: string) => {
    switch (label) {
        case 'Bán chạy': return '#FFC107';
        case 'Hết hàng': return '#9E9E9E';
        case 'Mới': return '#4CAF50';
        case 'Giảm giá': return '#F44336';
        default: return '#FFC107';
    }
};

interface ProductDetail extends Product {
    // Bổ sung các trường chi tiết nếu cần
    inventory?: number;
    barcode?: string;
}

// Màu sắc chủ đạo mới
const primaryColor = '#3f51b5';
const accentColor = '#ff4081';
const successColor = '#4caf50';
const errorColor = '#f44336';

export default function BanHangPage() {
    const { addToCart, getTotalQty } = useCart();
    const [search, setSearch] = useState('');
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [payment, setPayment] = useState('cash');
    const [discount, setDiscount] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showOrderSuccess, setShowOrderSuccess] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const token = localStorage.getItem('token');
        const storedCustomerData = localStorage.getItem('customerData');

        if (token && storedCustomerData) {
            setIsLoggedIn(true);
        }

        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                // Lấy inventory và barcode cho từng sản phẩm
                const productsWithDetail = await Promise.all(data.map(async (p: any) => {
                    const detail = await getProductDetail(p._id || p.id);
                    return {
                        ...p,
                        id: p.id || p._id || Date.now(), // Đảm bảo luôn có id
                        _id: p._id || String(p.id || Date.now()), // Đảm bảo luôn có _id
                        inventory: detail?.inventory ?? 0,
                        barcode: detail?.barcode ?? '',
                    };
                }));
                console.log("Products loaded:", productsWithDetail);
                setProducts(productsWithDetail);
            } catch (err) {
                setShowAlert({ type: 'error', message: 'Không thể tải sản phẩm!' });
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleShowDetail = async (id: string) => {
        setLoadingDetail(true);
        console.log("Hiển thị chi tiết sản phẩm ID:", id);

        try {
            // Tìm sản phẩm từ mảng sản phẩm đã tải
            const productFromList = products.find(p => String(p.id) === id || String(p._id) === id);

            if (!productFromList) {
                setShowAlert({ type: 'error', message: 'Không tìm thấy thông tin sản phẩm!' });
                setLoadingDetail(false);
                return;
            }

            // Chuẩn bị dữ liệu sản phẩm với giá trị mặc định cho các trường
            const productData: ProductDetail = {
                id: productFromList.id,
                _id: productFromList._id,
                name: productFromList.name || 'Sản phẩm không có tên',
                price: productFromList.price || 0,
                desc: productFromList.desc || 'Không có mô tả cho sản phẩm này',
                image: Array.isArray(productFromList.image_links) && productFromList.image_links[0]
                    ? productFromList.image_links[0]
                    : productFromList.image || 'https://via.placeholder.com/400x300?text=No+Image',
                inventory: productFromList.inventory || 0,
                barcode: productFromList.barcode || 'Chưa có mã',
                stock: productFromList.stock || 0,
                label: productFromList.label || '',
                qty: 1 // Thêm trường qty theo yêu cầu của interface Product
            };

            // Gán dữ liệu đã chuẩn hóa
            setSelectedProduct(productData);

            // Cố gắng lấy thêm thông tin chi tiết từ API nếu có
            try {
                const res = await fetch(`/api/product-detail?id=${id}`);
                if (res.ok) {
                    const apiData = await res.json();
                    // Cập nhật lại với thông tin API nếu có
                    setSelectedProduct((prev) => {
                        if (!prev) return productData;
                        return {
                            ...prev,
                            ...apiData,
                            // Đảm bảo giữ một số trường quan trọng nếu API không trả về
                            image: apiData.image || prev.image,
                            inventory: apiData.inventory || prev.inventory,
                            price: apiData.price || prev.price,
                            qty: 1 // Đảm bảo luôn có trường qty
                        };
                    });
                }
            } catch (apiError) {
                console.error("Không thể lấy chi tiết từ API:", apiError);
                // Đã có dữ liệu từ danh sách sản phẩm nên không cần thông báo lỗi
            }
        } catch (err) {
            console.error("Lỗi khi xem chi tiết sản phẩm:", err);
            setShowAlert({ type: 'error', message: 'Không thể tải chi tiết sản phẩm!' });
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCloseDetail = () => setSelectedProduct(null);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.desc && p.desc.toLowerCase().includes(search.toLowerCase()))
    );

    const handleAddToCart = (product: Product) => {
        if (product.inventory === 0) {
            setShowAlert({ type: 'error', message: 'Sản phẩm đã hết hàng!' });
            setTimeout(() => setShowAlert(null), 2000);
            return;
        }

        // Đảm bảo lấy đủ thông tin sản phẩm và thêm trường qty theo yêu cầu của interface Product
        const productToAdd = {
            id: product.id || Number(product._id),
            _id: product._id || String(product.id),
            name: product.name,
            price: typeof (product as any).output_price === 'number'
                ? (product as any).output_price
                : (typeof product.price === 'number' ? product.price : 0),
            stock: product.inventory || product.stock || 99,
            inventory: product.inventory || 99,
            image: Array.isArray(product.image_links) && product.image_links[0]
                ? product.image_links[0]
                : product.image,
            desc: product.desc || '',
            label: product.label || '',
            barcode: product.barcode || '',
            qty: 1 // Thêm trường qty theo yêu cầu của interface Product
        };

        addToCart(productToAdd);
        setShowAlert({ type: 'success', message: 'Đã thêm vào giỏ hàng!' });

        // Chỉ hiển thị thông báo thành công, không tự động chuyển trang
        setTimeout(() => {
            setShowAlert(null);
        }, 2000);
    };

    const handleQtyChange = (id: number, qty: number) => {
        // Implementation of handleQtyChange
    };

    const handleRemove = (id: number) => {
        // Implementation of handleRemove
    };

    const handleIncrease = (id: number) => {
        // Implementation of handleIncrease
    };

    const handleDecrease = (id: number) => {
        // Implementation of handleDecrease
    };

    const getDiscountValue = () => {
        const found = discounts.find((d) => d.code === discount);
        return found ? found.value : 0;
    };

    const total = products.reduce((sum, item) => sum + item.price, 0);
    const discountValue = getDiscountValue();
    const totalAfterDiscount = total * (1 - discountValue);

    const handleCreateOrder = () => {
        if (!customer.name || !customer.phone) {
            setShowAlert({ type: 'error', message: 'Vui lòng nhập đủ thông tin!' });
            setTimeout(() => setShowAlert(null), 2000);
            return;
        }
        setShowOrderSuccess(true);
        setTimeout(() => setShowOrderSuccess(false), 2000);
    };

    // Thêm hàm lấy thông tin chi tiết sản phẩm
    const getProductDetail = async (productId: string) => {
        try {
            const res = await fetch(`/api/product-detail?id=${productId}`);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            {/* Sử dụng component Header mới */}
            <Header />

            {/* Alert */}
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
                    gap: 'var(--spacing-sm)',
                    minWidth: '200px',
                    textAlign: 'center',
                    justifyContent: 'center'
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

            {/* Popup Order Success */}
            {showOrderSuccess && (
                <div className="fade-in flex-center" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 2000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="slide-up flex-column gap-md" style={{
                        background: 'var(--surface-color)',
                        borderRadius: 'var(--border-radius-xl)',
                        padding: 'var(--spacing-2xl)',
                        boxShadow: 'var(--shadow-xl)',
                        textAlign: 'center',
                        maxWidth: 500
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'rgba(76, 175, 80, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <h2 style={{
                            color: 'var(--text-primary)',
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 700
                        }}>Đơn hàng đã được tạo thành công!</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi.</p>
                        <button style={{
                            background: 'var(--primary-color)',
                            color: '#fff',
                            padding: 'var(--spacing-md) var(--spacing-xl)',
                            borderRadius: 'var(--border-radius-md)',
                            fontWeight: 600,
                            marginTop: 'var(--spacing-md)'
                        }} onClick={() => setShowOrderSuccess(false)}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* Cart Icon - chỉ hiển thị khi đã đăng nhập */}

            <div
                className="slide-up"
                style={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 1100,
                    cursor: 'pointer',
                    transition: 'transform var(--transition-fast)'
                }}
                onClick={() => router.push('/home/gio-hang')}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <div style={{
                    position: 'relative',
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--primary-color)',
                    borderRadius: '50%',
                    boxShadow: 'var(--shadow-lg)',
                    color: '#fff'
                }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="9" cy="21" r="1.5" />
                        <circle cx="19" cy="21" r="1.5" />
                        <path d="M2.5 3h2l2.68 13.39A2 2 0 0 0 9.13 18h7.74a2 2 0 0 0 1.95-1.61l1.68-8.39H6.16" />
                    </svg>
                    {getTotalQty() > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            background: 'var(--accent-color)',
                            color: '#fff',
                            borderRadius: '50%',
                            minWidth: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 'var(--font-size-xs)',
                            border: '2px solid #fff',
                            boxShadow: 'var(--shadow-md)'
                        }}>{getTotalQty()}</span>
                    )}
                </div>
            </div>


            {/* Sản phẩm */}
            <div className="container" style={{ padding: 'var(--spacing-3xl) var(--spacing-xl)' }}>
                {/* Tìm kiếm */}
                <div className="slide-up" style={{ marginBottom: 'var(--spacing-3xl)', maxWidth: 700, margin: '0 auto' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm sản phẩm..."
                            style={{
                                width: '100%',
                                padding: '16px 20px 16px 55px',
                                borderRadius: 'var(--border-radius-full)',
                                border: 'none',
                                fontSize: 'var(--font-size-md)',
                                fontWeight: 500,
                                outline: 'none',
                                boxShadow: 'var(--shadow-lg)',
                                background: 'var(--surface-color)',
                                transition: 'all var(--transition-normal)'
                            }}
                            onFocus={e => e.target.style.boxShadow = '0 8px 32px rgba(63,81,181,0.12)'}
                            onBlur={e => e.target.style.boxShadow = 'var(--shadow-lg)'}
                        />
                        <svg style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>

                {/* Khoảng cách thêm vào */}
                <div style={{ marginBottom: 'var(--spacing-3xl)' }}></div>

                {loading ? (
                    <div className="flex-center" style={{ padding: 'var(--spacing-3xl) 0' }}>
                        <div className="flex-column gap-md" style={{ alignItems: 'center' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                <line x1="18" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                            </svg>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>Đang tải sản phẩm...</div>
                        </div>
                    </div>
                ) : (
                    <div className="product-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--spacing-2xl)',
                        animationDelay: '0.2s'
                    }}>
                        {filteredProducts.length === 0 && (
                            <div className="text-center" style={{
                                gridColumn: '1/-1',
                                color: 'var(--text-secondary)',
                                fontSize: 'var(--font-size-lg)',
                                fontStyle: 'italic',
                                padding: 'var(--spacing-3xl) 0'
                            }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <p>Không tìm thấy sản phẩm phù hợp.</p>
                            </div>
                        )}
                        {filteredProducts.map((p, index) => (
                            <div
                                key={p._id || p.id}
                                className="product-card slide-up"
                                style={{
                                    background: 'var(--surface-color)',
                                    borderRadius: 'var(--border-radius-xl)',
                                    overflow: 'hidden',
                                    boxShadow: 'var(--shadow-md)',
                                    position: 'relative',
                                    opacity: p.inventory === 0 ? 0.7 : 1,
                                    cursor: 'pointer',
                                    transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
                                    border: '1px solid var(--divider-color)',
                                    animationDelay: `${index * 0.05}s`
                                }}
                                onClick={() => handleShowDetail(String(p.id || p._id))}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                            >
                                {/* Nhãn */}
                                {p.label && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'var(--spacing-md)',
                                        left: 'var(--spacing-md)',
                                        background: getLabelColor(p.label),
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: 'var(--font-size-xs)',
                                        borderRadius: 'var(--border-radius-full)',
                                        padding: 'var(--spacing-xs) var(--spacing-md)',
                                        boxShadow: 'var(--shadow-md)',
                                        zIndex: 1
                                    }}>{p.label}</div>
                                )}

                                {/* Ảnh sản phẩm */}
                                <div className="product-image-container" style={{
                                    width: '100%',
                                    height: 220,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    background: 'var(--surface-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 'var(--border-radius-xl) var(--border-radius-xl) 0 0',
                                    borderBottom: `1px solid var(--divider-color)`,
                                    padding: 'var(--spacing-md)'
                                }}>
                                    <img
                                        className="product-image"
                                        src={Array.isArray(p.image_links) && p.image_links[0] && p.image_links[0].startsWith('http') ? p.image_links[0] : 'https://via.placeholder.com/340x200?text=No+Image'}
                                        alt={p.name}
                                        style={{
                                            maxWidth: '85%',
                                            maxHeight: '85%',
                                            objectFit: 'contain',
                                            borderRadius: 'var(--border-radius-md)',
                                            transition: 'transform var(--transition-normal)',
                                            display: 'block',
                                            margin: '0 auto'
                                        }}
                                        onError={e => (e.currentTarget.src = 'https://via.placeholder.com/340x200?text=No+Image')}
                                        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    />
                                </div>

                                {/* Thông tin sản phẩm */}
                                <div className="product-info" style={{ padding: 'var(--spacing-lg)' }}>
                                    <h3 style={{
                                        margin: '0 0 var(--spacing-sm)',
                                        fontSize: 'var(--font-size-lg)',
                                        fontWeight: 700,
                                        letterSpacing: 0.5,
                                        color: 'var(--text-primary)'
                                    }}>{p.name}</h3>

                                    <p style={{
                                        margin: '0 0 var(--spacing-lg)',
                                        fontSize: 'var(--font-size-sm)',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        height: 42
                                    }}>{p.desc}</p>

                                    <div className="flex-between" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <div style={{
                                            fontSize: 'var(--font-size-xl)',
                                            fontWeight: 700,
                                            color: 'var(--accent-color)'
                                        }}>{typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}</div>

                                        <div style={{
                                            fontSize: 'var(--font-size-xs)',
                                            color: p.inventory === 0 ? 'var(--error-color)' : 'var(--success-color)',
                                            fontWeight: 600,
                                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                                            borderRadius: 'var(--border-radius-full)',
                                            background: p.inventory === 0 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)'
                                        }}>
                                            {typeof p.inventory === 'number' ? (p.inventory === 0 ? 'Hết hàng' : `Còn ${p.inventory} sản phẩm`) : 'Không rõ tồn kho'}
                                        </div>
                                    </div>

                                    <div className="flex gap-sm" style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--text-secondary)',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                        <span>{p.barcode || 'Chưa có mã'}</span>
                                    </div>

                                    <button
                                        onClick={e => { e.stopPropagation(); handleAddToCart(p); }}
                                        disabled={p.inventory === 0}
                                        className="flex-center gap-sm"
                                        style={{
                                            width: '100%',
                                            background: p.inventory === 0 ? '#e0e0e0' : 'var(--primary-color)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 'var(--border-radius-md)',
                                            padding: 'var(--spacing-md) 0',
                                            fontWeight: 600,
                                            fontSize: 'var(--font-size-sm)',
                                            cursor: p.inventory === 0 ? 'not-allowed' : 'pointer',
                                            letterSpacing: 0.5,
                                            transition: 'all var(--transition-fast)',
                                            boxShadow: p.inventory === 0 ? 'none' : 'var(--shadow-md)'
                                        }}
                                        onMouseOver={e => {
                                            if (p.inventory !== 0) {
                                                e.currentTarget.style.background = 'var(--primary-dark)';
                                                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                            }
                                        }}
                                        onMouseOut={e => {
                                            if (p.inventory !== 0) {
                                                e.currentTarget.style.background = 'var(--primary-color)';
                                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                            }
                                        }}
                                    >
                                        {p.inventory === 0 ? (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                                </svg>
                                                Hết Hàng
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="9" cy="21" r="1"></circle>
                                                    <circle cx="20" cy="21" r="1"></circle>
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                                </svg>
                                                Thêm Vào Giỏ
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal chi tiết sản phẩm */}
            {selectedProduct && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={handleCloseDetail}
                    className="fade-in"
                >
                    <div
                        className="slide-up"
                        style={{
                            background: 'var(--surface-color)',
                            borderRadius: 'var(--border-radius-xl)',
                            padding: 'var(--spacing-2xl)',
                            width: '90%',
                            maxWidth: 700,
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: 'var(--shadow-xl)',
                            position: 'relative'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseDetail}
                            style={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                background: 'rgba(0,0,0,0.05)',
                                color: 'var(--text-secondary)',
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all var(--transition-fast)'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        {loadingDetail ? (
                            <div className="flex-center" style={{ padding: 'var(--spacing-3xl) 0' }}>
                                <div className="flex-column gap-md" style={{ alignItems: 'center' }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                        <line x1="12" y1="2" x2="12" y2="6"></line>
                                        <line x1="12" y1="18" x2="12" y2="22"></line>
                                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                        <line x1="2" y1="12" x2="6" y2="12"></line>
                                        <line x1="18" y1="12" x2="22" y2="12"></line>
                                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                    </svg>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>Đang tải chi tiết sản phẩm...</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-column gap-lg">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    <h2 style={{
                                        fontSize: 'var(--font-size-2xl)',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        marginRight: 40,
                                        marginBottom: 0
                                    }}>{selectedProduct.name || 'Chi tiết sản phẩm'}</h2>

                                    {selectedProduct.label && (
                                        <div style={{
                                            padding: 'var(--spacing-xs) var(--spacing-md)',
                                            background: getLabelColor(selectedProduct.label),
                                            color: '#fff',
                                            borderRadius: 'var(--border-radius-full)',
                                            fontSize: 'var(--font-size-xs)',
                                            fontWeight: 600
                                        }}>
                                            {selectedProduct.label}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-xl" style={{ flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 300px', minWidth: 300 }}>
                                        <div style={{
                                            borderRadius: 'var(--border-radius-lg)',
                                            overflow: 'hidden',
                                            background: 'var(--background-color)',
                                            padding: 'var(--spacing-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: 300
                                        }}>
                                            <img
                                                src={selectedProduct.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                                                alt={selectedProduct.name}
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain',
                                                    borderRadius: 'var(--border-radius-md)'
                                                }}
                                                onError={e => (e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image')}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ flex: '1 1 300px' }}>
                                        <div className="flex-column gap-md">
                                            <div style={{
                                                fontSize: 'var(--font-size-2xl)',
                                                color: 'var(--accent-color)',
                                                fontWeight: 700
                                            }}>
                                                {typeof selectedProduct.price === 'number' ?
                                                    selectedProduct.price.toLocaleString('vi-VN') + 'đ' :
                                                    'Liên hệ'}
                                            </div>

                                            <div style={{
                                                padding: 'var(--spacing-md)',
                                                background: 'var(--background-color)',
                                                borderRadius: 'var(--border-radius-md)',
                                                fontSize: 'var(--font-size-md)',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.6
                                            }}>
                                                {selectedProduct.desc || 'Không có mô tả cho sản phẩm này.'}
                                            </div>

                                            <div className="flex gap-md" style={{ alignItems: 'center' }}>
                                                <div style={{
                                                    fontSize: 'var(--font-size-md)',
                                                    fontWeight: 600,
                                                    color: selectedProduct.inventory === 0 ? 'var(--error-color)' : 'var(--success-color)',
                                                    padding: 'var(--spacing-xs) var(--spacing-md)',
                                                    borderRadius: 'var(--border-radius-full)',
                                                    background: selectedProduct.inventory === 0 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)'
                                                }}>
                                                    {selectedProduct.inventory === 0 ? 'Hết hàng' : `Còn ${selectedProduct.inventory} sản phẩm`}
                                                </div>

                                                <div className="flex gap-sm" style={{ alignItems: 'center', color: 'var(--text-secondary)' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                    </svg>
                                                    <span>{selectedProduct.barcode || 'Chưa có mã'}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => { handleAddToCart(selectedProduct); handleCloseDetail(); }}
                                                disabled={selectedProduct.inventory === 0}
                                                className="flex-center gap-sm"
                                                style={{
                                                    width: '100%',
                                                    background: selectedProduct.inventory === 0 ? '#e0e0e0' : 'var(--primary-color)',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: 'var(--border-radius-md)',
                                                    padding: 'var(--spacing-md) 0',
                                                    fontWeight: 600,
                                                    fontSize: 'var(--font-size-md)',
                                                    cursor: selectedProduct.inventory === 0 ? 'not-allowed' : 'pointer',
                                                    marginTop: 'var(--spacing-md)',
                                                    letterSpacing: 0.5,
                                                    transition: 'all var(--transition-fast)',
                                                    boxShadow: selectedProduct.inventory === 0 ? 'none' : 'var(--shadow-md)'
                                                }}
                                                onMouseOver={e => {
                                                    if (selectedProduct.inventory !== 0) {
                                                        e.currentTarget.style.background = 'var(--primary-dark)';
                                                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                                    }
                                                }}
                                                onMouseOut={e => {
                                                    if (selectedProduct.inventory !== 0) {
                                                        e.currentTarget.style.background = 'var(--primary-color)';
                                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                                    }
                                                }}
                                            >
                                                {selectedProduct.inventory === 0 ? (
                                                    <>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                                        </svg>
                                                        Sản phẩm đã hết hàng
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="9" cy="21" r="1"></circle>
                                                            <circle cx="20" cy="21" r="1"></circle>
                                                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                                        </svg>
                                                        Thêm vào giỏ hàng
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 