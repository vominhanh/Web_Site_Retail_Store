import { NextResponse } from 'next/server';
import connectDB from '../../../untils/mongodb';
import { OrderModel } from '../../../models/Order';

export async function POST(request: Request) {
    try {
        await connectDB();
        const data = await request.json();

        // Tạo đơn hàng mới
        const order = await OrderModel.create({
            order_code: data.order_code,
            items: data.items,
            total_amount: data.total_amount,
            payment_method: data.payment_method,
            status: data.status,
            // Thêm các trường khác nếu cần
        });

        return NextResponse.json({
            success: true,
            message: 'Đơn hàng đã được tạo thành công',
            order
        });
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        return NextResponse.json(
            { success: false, message: 'Có lỗi xảy ra khi tạo đơn hàng' },
            { status: 500 }
        );
    }
} 