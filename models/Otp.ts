import { models, model, Schema } from 'mongoose';

const OTPSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Email là bắt buộc!'],
        trim: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: [true, 'Mã OTP là bắt buộc!']
    },
    created_at: {
        type: Date,
        default: Date.now,
        expires: 300 // Mã OTP hết hạn sau 5 phút (300 giây)
    },
    is_used: {
        type: Boolean,
        default: false
    }
});

export const OTPModel = models.OTP || model('OTP', OTPSchema); 