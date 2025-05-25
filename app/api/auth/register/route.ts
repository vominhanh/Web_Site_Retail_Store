import { NextRequest, NextResponse } from 'next/server';
import { CustomerModel } from '../../../../models/Customer';
import connectDB from '../../../../untils/mongodb';

export async function POST(req: NextRequest) {
    try {
        // Kết nối đến database
        await connectDB();

        // Lấy dữ liệu từ request
        const { name, email, password, phone, address } = await req.json();

        // Kiểm tra dữ liệu đầu vào
        if (!name || !email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin bắt buộc!'
                },
                { status: 400 }
            );
        }

        // Kiểm tra email đã tồn tại chưa
        const existingCustomer = await CustomerModel.findOne({ email });
        if (existingCustomer) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email này đã được đăng ký! Vui lòng sử dụng email khác.'
                },
                { status: 409 }  // Conflict
            );
        }

        // Tạo khách hàng mới
        const newCustomer = new CustomerModel({
            name,
            email,
            password,  // Mật khẩu sẽ được hash tự động bởi middleware
            phone,
            address
        });

        // Lưu vào database
        await newCustomer.save();

        // Trả về kết quả thành công (không trả về password)
        const customerData = newCustomer.toObject();
        delete customerData.password;

        return NextResponse.json(
            {
                success: true,
                message: 'Đăng ký tài khoản thành công!',
                data: customerData
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Lỗi đăng ký:', error);

        // Xử lý lỗi validation từ Mongoose
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Dữ liệu không hợp lệ!',
                    errors: validationErrors
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Đã xảy ra lỗi khi đăng ký tài khoản!',
                error: error.message
            },
            { status: 500 }
        );
    }
} 