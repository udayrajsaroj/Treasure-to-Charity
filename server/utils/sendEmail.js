const axios = require('axios');

const sendEmail = async (userEmail, details) => {
    try {
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

        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: { name: "Treasure to Charity", email: "udayrajsaroj55@gmail.com" },
                to: [{ email: userEmail }],
                subject: details.subject || 'Official Notification - Treasure to Charity',
                htmlContent: htmlTemplate
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("✅ Email sent successfully:", response.data.messageId);
        return response.data;

    } catch (error) {
        console.error("❌ EMAIL ERROR:", error.response?.data || error.message);
        throw new Error("Email sending failed: " + error.message);
    }
};

module.exports = sendEmail;