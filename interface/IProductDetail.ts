import { ObjectId } from 'mongodb';

// Định nghĩa interface IProductDetail
export interface IProductDetail {
    product_id: ObjectId;
    input_quantity: number;
    output_quantity: number;
    inventory?: number;
    date_of_manufacture?: Date;
    expiry_date?: Date;
    batch_number?: string;
    barcode?: string;
}