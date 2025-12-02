const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Send admin invitation email
const sendAdminInvitation = async (email, token) => {
    const transporter = createTransporter();

    const registrationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/register/${token}`;

    const mailOptions = {
        from: `"GoCamp Team" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'You\'ve been invited to join GoCamp as an Admin',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏕️ GoCamp Admin Invitation</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome to GoCamp!</h2>
                        <p>You've been invited to join GoCamp as an administrator. As an admin, you'll have access to:</p>
                        <ul>
                            <li>Manage campgrounds and user queries</li>
                            <li>Handle live chat support</li>
                            <li>Invite other administrators</li>
                            <li>Full platform access</li>
                        </ul>
                        <p>Click the button below to create your admin account:</p>
                        <div style="text-align: center;">
                            <a href="${registrationLink}" class="button">Register as Admin</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${registrationLink}</p>
                        <div class="warning">
                            <strong>⚠️ Important:</strong> This invitation link will expire in 24 hours and can only be used once.
                        </div>
                    </div>
                    <div class="footer">
                        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                        <p>&copy; ${new Date().getFullYear()} GoCamp. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Admin invitation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending admin invitation email:', error);
        throw error;
    }
};

module.exports = {
    sendAdminInvitation
};
