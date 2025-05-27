import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Danh sách các đường dẫn công khai không cần xác thực
const PUBLIC_PATHS = [
    '/home/dang-nhap',
    '/home/dang-ky',
    '/home/quen-mat-khau',
    '/home/xac-thuc',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/reset-password',
    '/api/auth/verify',
    '/api/auth/send-otp',      // Cho phép gửi OTP không cần đăng nhập
    '/api/auth/verify-otp',    // Cho phép xác thực OTP không cần đăng nhập
    '/home/ban-hang', // Cho phép truy cập trang bán hàng không cần đăng nhập
    '/home/gio-hang', // Cho phép truy cập giỏ hàng không cần đăng nhập
];

// Danh sách các đường dẫn công khai liên quan đến sản phẩm
const PUBLIC_PRODUCT_PATHS = [
    '/api/products',
    '/api/product-detail',
];

// Đường dẫn yêu cầu xác thực khi thanh toán
const CHECKOUT_PATHS = [
    '/home/thanh-toan',
    '/api/orders',
    '/api/checkout',
];

// Đường dẫn API
const API_PATHS = ['/api/'];

// Kiểm tra đường dẫn có thuộc danh sách công khai
const isPublicPath = (path: string) => {
    return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath)) ||
        PUBLIC_PRODUCT_PATHS.some(productPath => path.startsWith(productPath));
};

// Kiểm tra đường dẫn là API
const isApiPath = (path: string) => {
    return API_PATHS.some(apiPath => path.startsWith(apiPath));
};

// Kiểm tra đường dẫn là thanh toán
const isCheckoutPath = (path: string) => {
    return CHECKOUT_PATHS.some(checkoutPath => path.startsWith(checkoutPath));
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Cho phép truy cập các đường dẫn công khai
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // Lấy token từ cookie hoặc header Authorization
    const token = request.cookies.get('token')?.value ||
        request.headers.get('Authorization')?.split(' ')[1];

    // Kiểm tra nếu không có token
    if (!token) {
        // Nếu là API, trả về lỗi 401
        if (isApiPath(pathname)) {
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Chưa xác thực! Vui lòng đăng nhập.' }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'WWW-Authenticate': 'Bearer'
                    }
                }
            );
        }

        // Nếu không phải API, chuyển hướng về trang đăng nhập
        const url = new URL('/home/ban-hang', request.url);
        url.searchParams.set('callbackUrl', encodeURI(request.url));
        return NextResponse.redirect(url);
    }

    // Xác thực token
    try {
        const secretKey = new TextEncoder().encode(
            process.env.JWT_SECRET || 'your-default-secret-key'
        );

        await jwtVerify(token, secretKey);

        // Token hợp lệ, cho phép tiếp tục
        return NextResponse.next();
    } catch (error) {
        console.error('Lỗi xác thực token:', error);

        // Nếu là API, trả về lỗi 401
        if (isApiPath(pathname)) {
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'WWW-Authenticate': 'Bearer'
                    }
                }
            );
        }

        // Nếu không phải API, chuyển hướng về trang đăng nhập
        const url = new URL('/home/dang-nhap', request.url);
        url.searchParams.set('callbackUrl', encodeURI(request.url));
        url.searchParams.set('error', 'session_expired');
        return NextResponse.redirect(url);
    }
}

// Chỉ áp dụng middleware cho các đường dẫn cần thiết
export const config = {
    matcher: [
        // Áp dụng cho tất cả các đường dẫn
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 