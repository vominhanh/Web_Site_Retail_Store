import { NextRequest, NextResponse } from 'next/server';
import { CustomerModel } from '../../../../models/Customer';
import connectDB from '../../../../untils/mongodb';
import { jwtVerify } from 'jose';

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Lấy customer ID từ params
        const customerId = params.id;

        if (!customerId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'ID khách hàng không hợp lệ!'
                },
                { status: 400 }
            );
        }

        // Kiểm tra xác thực người dùng
        const token = req.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Không tìm thấy token xác thực!'
                },
                { status: 401 }
            );
        }

        // Xác thực token
        const secretKey = new TextEncoder().encode(
            process.env.JWT_SECRET || 'your-default-secret-key'
        );

        try {
            const { payload } = await jwtVerify(token, secretKey);

            // Kiểm tra xem token thuộc về customer hiện tại không
            if (payload.userId !== customerId) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Bạn không có quyền cập nhật thông tin này!'
                    },
                    { status: 403 }
                );
            }
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn!'
                },
                { status: 401 }
            );
        }

        // Kết nối đến database
        await connectDB();

        // Lấy dữ liệu từ request
        const updateData = await req.json();

        // Xác thực dữ liệu đầu vào
        if (!updateData.name || updateData.name.trim() === '') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Họ và tên không được để trống!'
                },
                { status: 400 }
            );
        }

        // Kiểm tra số điện thoại (nếu có)
        if (updateData.phone && !/^(0|\+84)[0-9]{9,10}$/.test(updateData.phone)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Số điện thoại không hợp lệ!'
                },
                { status: 400 }
            );
        }

        // Loại bỏ các trường không được phép cập nhật
        const { email, is_verified, is_active, ...allowedUpdateData } = updateData;

        // Cập nhật thông tin trong database
        const updatedCustomer = await CustomerModel.findByIdAndUpdate(
            customerId,
            {
                ...allowedUpdateData,
                updated_at: new Date()
            },
            { new: true }
        );

        // Kiểm tra nếu không tìm thấy khách hàng
        if (!updatedCustomer) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Không tìm thấy thông tin khách hàng!'
                },
                { status: 404 }
            );
        }

        // Loại bỏ thông tin nhạy cảm trước khi trả về
        const customerData = updatedCustomer.toObject();
        delete customerData.password;
        delete customerData.verification_token;
        delete customerData.verification_token_expires;
        delete customerData.otp;

        return NextResponse.json(
            {
                success: true,
                message: 'Cập nhật thông tin thành công!',
                customer: customerData
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Lỗi cập nhật thông tin khách hàng:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Đã xảy ra lỗi khi cập nhật thông tin!',
                error: error.message
            },
            { status: 500 }
        );
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Lấy customer ID từ params
        const customerId = params.id;

        if (!customerId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'ID khách hàng không hợp lệ!'
                },
                { status: 400 }
            );
        }

        // Kiểm tra xác thực người dùng
        const token = req.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Không tìm thấy token xác thực!'
                },
                { status: 401 }
            );
        }

        // Xác thực token
        const secretKey = new TextEncoder().encode(
            process.env.JWT_SECRET || 'your-default-secret-key'
        );

        try {
            const { payload } = await jwtVerify(token, secretKey);

            // Kiểm tra xem token thuộc về customer hiện tại không
            if (payload.userId !== customerId) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Bạn không có quyền xem thông tin này!'
                    },
                    { status: 403 }
                );
            }
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn!'
                },
                { status: 401 }
            );
        }

        // Kết nối đến database
        await connectDB();

        // Lấy thông tin khách hàng
        const customer = await CustomerModel.findById(customerId);

        // Kiểm tra nếu không tìm thấy khách hàng
        if (!customer) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Không tìm thấy thông tin khách hàng!'
                },
                { status: 404 }
            );
        }

        // Loại bỏ thông tin nhạy cảm trước khi trả về
        const customerData = customer.toObject();
        delete customerData.password;
        delete customerData.verification_token;
        delete customerData.verification_token_expires;
        delete customerData.otp;

        return NextResponse.json(
            {
                success: true,
                customer: customerData
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Lỗi lấy thông tin khách hàng:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Đã xảy ra lỗi khi lấy thông tin!',
                error: error.message
            },
            { status: 500 }
        );
    }
} 