import { NextRequest, NextResponse } from 'next/server';
import { CustomerModel } from '../../../../models/Customer';
import connectDB from '../../../../untils/mongodb';
import jwt from 'jsonwebtoken';

// Tạo JWT token
function generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'your-default-secret-key';
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export async function POST(req: NextRequest) {
    try {
        // Kết nối đến database
        await connectDB();

        // Lấy dữ liệu từ request
        const { email, otp, password } = await req.json();

        // Kiểm tra dữ liệu đầu vào
        if (!email || !otp) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email và mã xác nhận là bắt buộc!'
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

        // Kiểm tra mã OTP
        if (!customer.otp || !customer.otp.code) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Bạn chưa yêu cầu mã xác nhận!'
                },
                { status: 400 }
            );
        }

        // Kiểm tra thời gian hết hạn
        if (customer.otp.expires_at && new Date() > new Date(customer.otp.expires_at)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Mã xác nhận đã hết hạn! Vui lòng yêu cầu mã mới.'
                },
                { status: 400 }
            );
        }

        // Kiểm tra mã OTP có chính xác không
        if (customer.otp.code !== otp) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Mã xác nhận không chính xác!'
                },
                { status: 400 }
            );
        }

        // Nếu có mật khẩu mới, cập nhật
        if (password && password.length >= 6) {
            customer.password = password;
        }

        // Cập nhật trạng thái tài khoản
        customer.is_verified = true;
        customer.otp = undefined; // Xóa OTP sau khi xác thực
        customer.last_login = new Date();

        await customer.save();

        // Tạo token đăng nhập
        const token = generateToken(customer._id.toString());

        // Trả về kết quả thành công và thông tin không nhạy cảm
        const customerData = customer.toObject();
        delete customerData.password;
        delete customerData.otp;

        return NextResponse.json(
            {
                success: true,
                message: 'Xác thực thành công!',
                token: token,
                customer: customerData
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Lỗi xác thực OTP:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Đã xảy ra lỗi khi xác thực!',
                error: error.message
            },
            { status: 500 }
        );
    }
} 