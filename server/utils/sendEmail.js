const nodemailer = require('nodemailer');

const sendEmail = async (userEmail, details) => {
    try {
        // 1. Transporter configuration
        const transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com', 
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.BREVO_USER,
                pass: process.env.BREVO_PASS
            }
        });

        // 2. HTML Template logic
        const htmlTemplate = details.message 
            ? `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; max-width: 600px; margin: auto;">
                    <h2 style="color: #6f42c1; border-bottom: 2px solid #6f42c1; padding-bottom: 10px;">Treasure to Charity 🎁</h2>
                    <p style="font-size: 16px; color: #444; line-height: 1.6;">${details.message}</p>
                    <div style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
                        <p style="font-size: 12px; color: #888; font-style: italic;">Note: If you did not initiate this request, please disregard this email or contact our support team.</p>
                    </div>
                </div>
            `
            : `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; max-width: 600px; margin: auto;">
                    <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">Payment Successful! 👋</h2>
                    <p style="font-size: 16px; color: #333;">Thank you for your contribution. Your order has been successfully placed and is being processed.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #555;">Transaction Summary</h4>
                        <table style="width: 100%; font-size: 14px; color: #555; border-spacing: 0 8px;">
                            <tr><td style="font-weight: bold;">Item Name:</td><td>${details.itemName}</td></tr>
                            <tr><td style="font-weight: bold;">Amount Paid:</td><td style="color: #28a745; font-weight: bold;">₹${details.price}</td></tr>
                            <tr><td style="font-weight: bold;">Transaction ID:</td><td>${details.razorpayPaymentId}</td></tr>
                            <tr><td style="font-weight: bold;">Delivery Address:</td><td>${details.shippingAddress}</td></tr>
                        </table>
                    </div>

                    <p style="font-size: 15px; color: #444;">Our logistics team will contact you shortly regarding the pickup/delivery schedule.</p>
                    <p style="font-size: 15px; color: #333; margin-top: 20px;">Best Regards,<br/><strong>Team Treasure to Charity</strong></p>
                </div>
            `;

        // 3. Mail Options
        const mailOptions = {
            from: `"Treasure to Charity" <${process.env.BREVO_USER}>`,
            to: userEmail,
            subject: details.subject || 'Official Notification - Treasure to Charity',
            html: htmlTemplate
        };

        // 4. Send Email and Log result
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully: %s", info.messageId);
        return info;

    } catch (error) {
        // ERROR LOGGING: Ye Render ke 'Logs' tab mein dikhega
        console.error("❌ NODEMAILER ERROR details:");
        console.error("Error Message:", error.message);
        console.error("Email User used:", process.env.EMAIL_USER);
        
        // Isse front-end ko pata chalega ki mail nahi gaya
        throw new Error("Email sending failed: " + error.message);
    }
};

module.exports = sendEmail;