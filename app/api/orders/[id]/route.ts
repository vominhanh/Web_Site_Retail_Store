import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../untils/mongodb';
import { ProductModel } from '../../../../models/Product';

// Định nghĩa schema cho Order
const orderSchema = new mongoose.Schema({
    order_code: String,
    items: [{
        product_id: String,
        product_name: String,
        quantity: Number,
        price: Number
    }],
    total_amount: Number,
    payment_method: String,
    status: String,
    created_at: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export async function GET(request: Request, context: { params: { id: string } }) {
    try {
        const { id } = (await context).params;
        await connectDB();

        // Kiểm tra id hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
        }

        // Truy vấn đơn hàng
        const order = await Order.findById(id).lean();

        if (!order) {
            return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
        }

        const orderAny = order as any;
        // Lấy danh sách product_id từ order
        const productIds = orderAny.items.map((item: any) => {
            try {
                return new mongoose.Types.ObjectId(item.product_id);
            } catch {
                return null;
            }
        }).filter(Boolean);

        // Truy vấn Product theo _id hoặc id
        const products = await ProductModel.find({
            $or: [
                { _id: { $in: productIds } },
                { id: { $in: productIds } }
            ]
        }).lean();

        // Gán tên sản phẩm vào từng item
        orderAny.items = orderAny.items.map((item: any) => {
            const product = products.find((p: any) =>
                (p._id?.toString() === item.product_id?.toString()) ||
                (p.id?.toString() === item.product_id?.toString())
            );
            return {
                ...item,
                product_name: product ? product.name : item.product_id
            };
        });

        return NextResponse.json({ order: orderAny });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
} 