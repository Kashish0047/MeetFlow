const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: process.env.SMTP_PASS
    }
});

console.log("Attempting to verify SMTP connection...");
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Test Failed:", error.message);
    } else {
        console.log("✅ Test Successful! Connection is working.");
    }
    process.exit();
});
