import { NextResponse } from 'next/server';
import connectDB from '../../../untils/mongodb';
import User from '@/models/User';

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        const query = role ? { role } : {};
        const users = await User.find(query).select('-password');
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const user = await User.create(body);
        const { password, ...userWithoutPassword } = user.toObject();
        return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 