import { NextResponse } from 'next/server';
import connectDB from '../../../untils/mongodb';
import { OrderShippingModel } from '../../../models/OrderShipping';

export async function POST(request: Request) {
    try {
        await connectDB();
        const data = await request.json();

        // Đảm bảo status luôn là 'pending' nếu không truyền lên
        const status = data.status || 'pending';

        const orderShipping = await OrderShippingModel.create({
            order_id: data.order_id,
            customer_id: data.customer_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            shipping_address: data.shipping_address,
            status: status,
            shipping_fee: data.shipping_fee,
            payment_method: data.payment_method
        });

        return NextResponse.json({
            success: true,
            message: 'Tạo vận chuyển thành công!',
            orderShipping
        });
    } catch (error) {
        console.error('Lỗi khi tạo vận chuyển:', error);
        return NextResponse.json(
            { success: false, message: 'Có lỗi xảy ra khi tạo vận chuyển' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const customer_id = searchParams.get('customer_id');
        if (!customer_id) {
            return NextResponse.json({ orders: [] });
        }
        const orders = await OrderShippingModel.find({ customer_id });
        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách vận chuyển:', error);
        return NextResponse.json({ orders: [] }, { status: 500 });
    }
} 