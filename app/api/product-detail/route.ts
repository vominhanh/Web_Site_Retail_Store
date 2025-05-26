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

        // Lấy tất cả các lô của sản phẩm, sắp xếp theo hạn sử dụng tăng dần
        const productDetails = await ProductDetailModel.find({ product_id: new ObjectId(id) }).sort({ expiry_date: 1 });

        if (!productDetails || productDetails.length === 0) {
            return NextResponse.json({ lots: [], message: 'No product lots found' }, { status: 200 });
        }

        // Trả về danh sách các lô với các trường cần thiết
        const lots = productDetails.map(lot => ({
            inventory: lot.inventory || 0,
            barcode: lot.barcode || '',
            date_of_manufacture: lot.date_of_manufacture,
            expiry_date: lot.expiry_date,
            batch_number: lot.batch_number
        }));

        return NextResponse.json({ lots });
    } catch (error) {
        console.error('Error fetching product lots:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 