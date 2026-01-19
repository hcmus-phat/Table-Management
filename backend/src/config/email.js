// backend/src/config/email.js
import sgMail from '@sendgrid/mail';

// Khởi tạo SendGrid với API key từ .env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Địa chỉ email gửi đi (dùng từ .env)
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'nhatduy123n@gmail.com';

/**
 * Tạo transporter tương thích với nodemailer
 */
const transporter = {
  /**
   * Gửi email sử dụng SendGrid
   * @param {Object} mailOptions - Các tùy chọn email
   * @returns {Promise}
   */
  sendMail: async (mailOptions) => {
    try {
      const msg = {
        to: mailOptions.to,
        from: SENDGRID_FROM,
        subject: mailOptions.subject || 'No Subject',
        text: mailOptions.text || '',
        html: mailOptions.html || mailOptions.text || '',
        ...(mailOptions.attachments && { attachments: mailOptions.attachments })
      };

      console.log(`📧 Sending email via SendGrid to: ${mailOptions.to}`);
      const response = await sgMail.send(msg);
      
      console.log(`✅ Email sent successfully. Status: ${response[0].statusCode}`);
      return {
        messageId: response[0].headers['x-message-id'],
        response: response[0]
      };
    } catch (error) {
      console.error('❌ SendGrid error:', error.message);
      
      // Log chi tiết lỗi nếu có
      if (error.response) {
        console.error('SendGrid response:', error.response.body);
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  /**
   * Kiểm tra kết nối SendGrid (tương tự nodemailer.verify())
   * @param {Function} callback - Callback function
   */
  verify: (callback) => {
    // Kiểm tra API key có tồn tại không
    if (!process.env.SENDGRID_API_KEY) {
      const error = new Error('SENDGRID_API_KEY is not defined in environment variables');
      console.error('❌', error.message);
      return callback(error, false);
    }

    // Gửi email test để kiểm tra
    const testMsg = {
      to: SENDGRID_FROM, // Gửi cho chính mình để test
      from: SENDGRID_FROM,
      subject: 'SendGrid Connection Test',
      text: 'This is a test email to verify SendGrid connection.',
      html: '<p>This is a test email to verify SendGrid connection.</p>'
    };

    sgMail.send(testMsg)
      .then(() => {
        console.log('✅ SendGrid connection verified successfully');
        callback(null, true);
      })
      .catch((error) => {
        console.error('❌ SendGrid verification failed:', error.message);
        callback(error, false);
      });
  }
};

// Tự động kiểm tra kết nối khi khởi động
console.log('🔄 Initializing SendGrid email service...');

// Kiểm tra cấu hình
if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️  SENDGRID_API_KEY is missing. Email service may not work.');
} else {
  console.log('✅ SendGrid API key loaded');
}

if (!SENDGRID_FROM) {
  console.warn('⚠️  SENDGRID_FROM is not set. Using default sender.');
}

console.log('📧 SendGrid transporter ready');

export default transporter;