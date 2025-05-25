import { NextRequest, NextResponse } from 'next/server';
import { CustomerModel } from '../../../../models/Customer';
import connectDB from '../../../../untils/mongodb';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Hàm tạo mã OTP gồm 6 chữ số
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Cấu hình Nodemailer để gửi email thực tế
async function sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    try {
        console.log('Bắt đầu gửi email đến:', to);

        // Tạo transporter với cấu hình Gmail
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USER, // Email dùng để gửi
                pass: process.env.MAIL_PASS // Mật khẩu ứng dụng Gmail mới
            },
            tls: {
                rejectUnauthorized: false // Chấp nhận certificate tự ký
            }
        });

        // Kiểm tra kết nối
        console.log('Đang kiểm tra kết nối SMTP...');
        await transporter.verify();
        console.log('Kết nối SMTP thành công');

        // Cấu hình email
        const mailOptions = {
            from: '"Hệ thống bán hàng" <avminh824@gmail.com>',
            to: to,
            subject: subject,
            html: content
        };

        // Gửi email
        console.log('Đang gửi email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email đã gửi thành công:', info.messageId);
        return true;
    } catch (error) {
        console.error('Lỗi chi tiết khi gửi email:', error);
        // In ra thông tin chi tiết của lỗi
        if (error instanceof Error) {
            console.error('Tên lỗi:', error.name);
            console.error('Thông báo lỗi:', error.message);
            console.error('Stack trace:', error.stack);
        }
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        console.log('Bắt đầu xử lý yêu cầu gửi OTP');

        // Kết nối đến database
        await connectDB();
        console.log('Đã kết nối tới database');

        // Lấy dữ liệu từ request
        const data = await req.json();
        const { email, name } = data;
        console.log('Dữ liệu nhận được:', { email, name });

        // Kiểm tra dữ liệu đầu vào
        if (!email) {
            console.log('Lỗi: Thiếu địa chỉ email');
            return NextResponse.json(
                {
                    success: false,
                    message: 'Vui lòng nhập địa chỉ email!'
                },
                { status: 400 }
            );
        }

        // Kiểm tra định dạng email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            console.log('Lỗi: Định dạng email không hợp lệ');
            return NextResponse.json(
                {
                    success: false,
                    message: 'Địa chỉ email không hợp lệ!'
                },
                { status: 400 }
            );
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingCustomer = await CustomerModel.findOne({ email });
        console.log('Kết quả kiểm tra email tồn tại:', existingCustomer ? 'Đã tồn tại' : 'Chưa tồn tại');

        if (existingCustomer && existingCustomer.is_verified) {
            console.log('Lỗi: Email đã được xác thực trước đó');
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email này đã được đăng ký! Vui lòng sử dụng email khác hoặc đăng nhập.'
                },
                { status: 409 }
            );
        }

        // Tạo mã OTP
        const otp = generateOTP();
        console.log('Đã tạo mã OTP:', otp);

        // Thời gian hết hạn OTP (10 phút)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Lưu hoặc cập nhật thông tin khách hàng
        let customer;

        if (existingCustomer) {
            // Cập nhật OTP cho tài khoản đã tồn tại nhưng chưa xác thực
            customer = existingCustomer;
            customer.otp = {
                code: otp,
                expires_at: expiresAt
            };
            if (name) customer.name = name;
            console.log('Cập nhật OTP cho tài khoản hiện có');
        } else {
            // Tạo tài khoản mới với OTP
            customer = new CustomerModel({
                email,
                name: name || 'Khách hàng mới',
                // Tạo mật khẩu ngẫu nhiên tạm thời
                password: crypto.randomBytes(8).toString('hex'),
                otp: {
                    code: otp,
                    expires_at: expiresAt
                }
            });
            console.log('Tạo tài khoản mới với OTP');
        }

        await customer.save();
        console.log('Đã lưu thông tin khách hàng vào database');

        // Tạo nội dung email đẹp hơn với HTML
        const emailSubject = 'Xác nhận đăng ký tài khoản';
        const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Xác nhận đăng ký tài khoản</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        padding: 30px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #eee;
                        margin-bottom: 20px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #3f51b5;
                    }
                    .code {
                        font-size: 32px;
                        font-weight: bold;
                        color: #3f51b5;
                        text-align: center;
                        letter-spacing: 5px;
                        padding: 15px;
                        margin: 20px 0;
                        background-color: #f0f2ff;
                        border-radius: 4px;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 14px;
                        color: #777;
                        border-top: 1px solid #eee;
                        padding-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">HỆ THỐNG BÁN HÀNG TRỰC TUYẾN</div>
                    </div>
                    
                    <h2>Xin chào ${customer.name || 'bạn'}!</h2>
                    
                    <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống của chúng tôi.</p>
                    
                    <p>Dưới đây là mã xác nhận của bạn:</p>
                    
                    <div class="code">${otp}</div>
                    
                    <p><strong>Lưu ý:</strong> Mã này sẽ hết hạn sau 10 phút.</p>
                    
                    <p>Vui lòng không chia sẻ mã này cho bất kỳ ai để bảo vệ tài khoản của bạn.</p>
                    
                    <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                    
                    <div class="footer">
                        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
                        <p>© 2023 Hệ thống bán hàng trực tuyến. Tất cả các quyền được bảo lưu.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Gửi email thực tế
        console.log('Bắt đầu gửi email...');
        const emailSent = await sendEmail(email, emailSubject, emailContent);

        if (!emailSent) {
            console.log('Lỗi: Không thể gửi email');
            return NextResponse.json(
                {
                    success: false,
                    message: 'Không thể gửi mã xác nhận qua email. Vui lòng thử lại sau!'
                },
                { status: 500 }
            );
        }

        console.log('Gửi OTP thành công');
        return NextResponse.json(
            {
                success: true,
                message: 'Mã xác nhận đã được gửi đến email của bạn!',
                email: email,
                expires: expiresAt
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Lỗi gửi mã OTP:', error);
        console.error('Stack trace:', error.stack);

        return NextResponse.json(
            {
                success: false,
                message: 'Đã xảy ra lỗi khi gửi mã xác nhận!',
                error: error.message
            },
            { status: 500 }
        );
    }
} 