const nodemailer = require('nodemailer');

// Create transporter - using Gmail as example
// For production, use a proper email service like SendGrid, Mailgun, etc.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Use App Password for Gmail (not regular password)
    }
});

// Send OTP Email
const sendOTPEmail = async (to, otp, purpose = 'verification') => {
    const subjects = {
        verification: '🔐 Verify Your SecureVote Account',
        login: '🔑 Your Login Verification Code',
        password_reset: '🔄 Password Reset Code'
    };

    const messages = {
        verification: `Welcome to SecureVote! Please verify your email to complete registration.`,
        login: `Someone is trying to log into your account. If this was you, use the code below.`,
        password_reset: `You requested a password reset. Use the code below to reset your password.`
    };

    const mailOptions = {
        from: `"SecureVote System" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subjects[purpose] || subjects.verification,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🛡️ SecureVote</h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Secure Digital Voting System</p>
                </div>
                
                <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        ${messages[purpose] || messages.verification}
                    </p>
                    
                    <div style="background: #F3F4F6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                        <p style="color: #6B7280; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
                        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; font-family: 'Courier New', monospace;">
                            ${otp}
                        </div>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 14px; text-align: center;">
                        ⏰ This code expires in <strong>10 minutes</strong>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                        If you didn't request this code, please ignore this email.<br>
                        Do not share this code with anyone.
                    </p>
                </div>
                
                <div style="background: #F9FAFB; padding: 20px; border-radius: 0 0 16px 16px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
                    <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
                        © ${new Date().getFullYear()} SecureVote - AASTU Security Project
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Email failed to ${to}:`, error.message);
        // Still log OTP to console as fallback during development
        console.log(`\n📧 [FALLBACK] OTP for ${to}: ${otp}\n`);
        return { success: false, error: error.message };
    }
};

module.exports = { sendOTPEmail };
