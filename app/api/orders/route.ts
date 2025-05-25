import { NextResponse } from 'next/server';
import connectDB from '../../../untils/mongodb';
import Order from '@/models/Order';

export async function GET() {
    try {
        await connectDB();
        const orders = await Order.find()
            .populate('customer', 'username email')
            .populate('items.product', 'name price');
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const order = await Order.create(body);
        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 