import { NextRequest, NextResponse } from 'next/server';
import { CustomerModel } from '../../../../models/Customer';
import connectDB from '../../../../untils/mongodb';
import jwt from 'jsonwebtoken';

// Tạo JWT token
function generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'your-default-secret-key';
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

// Kiểm tra yêu cầu đăng nhập
function validateLoginRequest(email: string, password: string): { isValid: boolean; message?: string } {
    if (!email) {
        return { isValid: false, message: 'Email là bắt buộc!' };
    }

    if (!password) {
        return { isValid: false, message: 'Mật khẩu là bắt buộc!' };
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Email không hợp lệ!' };
    }

    return { isValid: true };
}

export async function POST(req: NextRequest) {
    try {
        // Kiểm tra phương thức
        if (req.method !== 'POST') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Phương thức không được hỗ trợ!'
                },
                { status: 405 }
            );
        }

        // Kết nối đến database
        await connectDB();

        // Lấy dữ liệu từ request
        const { email, password } = await req.json();

        // Kiểm tra dữ liệu đầu vào
        const validation = validateLoginRequest(email, password);
        if (!validation.isValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.message
                },
                { status: 400 }
            );
        }

        // Tìm khách hàng với email
        const customer = await CustomerModel.findOne({ email });
        if (!customer) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email không tồn tại trong hệ thống!'
                },
                { status: 404 }
            );
        }

        // Kiểm tra trạng thái xác thực
        if (!customer.is_verified) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Tài khoản chưa được xác thực! Vui lòng xác thực email trước khi đăng nhập.',
                    needVerification: true,
                    email: email
                },
                { status: 401 }
            );
        }

        // Kiểm tra trạng thái hoạt động
        if (!customer.is_active) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Tài khoản đã bị khóa! Vui lòng liên hệ quản trị viên để được hỗ trợ.'
                },
                { status: 403 }
            );
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await customer.comparePassword(password);
        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Mật khẩu không chính xác!'
                },
                { status: 401 }
            );
        }

        // Cập nhật thời gian đăng nhập
        customer.last_login = new Date();
        await customer.save();

        // Tạo token đăng nhập
        const token = generateToken(customer._id.toString());

        // Trả về kết quả thành công và thông tin không nhạy cảm
        const customerData = customer.toObject();
        delete customerData.password;
        delete customerData.otp;
        delete customerData.verification_token;
        delete customerData.verification_token_expires;

        // Thiết lập các header bảo mật
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
        };

        return NextResponse.json(
            {
                success: true,
                message: 'Đăng nhập thành công!',
                token: token,
                customer: customerData
            },
            {
                status: 200,
                headers
            }
        );

    } catch (error: any) {
        console.error('Lỗi đăng nhập:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Đã xảy ra lỗi khi đăng nhập!',
                error: error.message
            },
            { status: 500 }
        );
    }
} 