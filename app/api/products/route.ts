import { NextResponse } from 'next/server';
import connectDB from '../../../untils/mongodb';
import { ProductModel } from '../../../models/Product';

export async function GET() {
    try {
        await connectDB();
        const products = await ProductModel.find({});
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const product = await ProductModel.create(body);
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 