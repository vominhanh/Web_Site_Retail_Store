import { NextResponse } from 'next/server';
import connectDB from '../../../untils/mongodb';
import { ProductDetailModel } from '../../../models/ProductDetail';
import { ObjectId } from 'mongodb';

// Lấy thông tin chi tiết sản phẩm theo product_id
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await connectDB();

        // Tìm sản phẩm chi tiết có product_id trùng với id sản phẩm
        const productDetail = await ProductDetailModel.findOne({ product_id: new ObjectId(id) });

        if (!productDetail) {
            return NextResponse.json({
                inventory: 0,
                barcode: '',
                message: 'Product detail not found'
            }, { status: 200 });
        }

        return NextResponse.json({
            inventory: productDetail.inventory || 0,
            barcode: productDetail.barcode || '',
            date_of_manufacture: productDetail.date_of_manufacture,
            expiry_date: productDetail.expiry_date,
            batch_number: productDetail.batch_number
        });
    } catch (error) {
        console.error('Error fetching product detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 