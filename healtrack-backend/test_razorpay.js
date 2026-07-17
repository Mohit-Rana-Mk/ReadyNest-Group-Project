require('dotenv').config();
const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

async function run() {
    try {
        console.log('Testing Razorpay with keys:', process.env.RAZORPAY_KEY_ID);
        const order = await razorpayInstance.orders.create({
            amount: 1000, // 10 INR
            currency: 'INR',
            receipt: 'test_receipt_123'
        });
        console.log('Success!', order);
    } catch (err) {
        console.error('Razorpay Error:', err);
    }
}

run();
