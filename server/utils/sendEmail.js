const nodemailer = require('nodemailer')

const sendEmail = async (to, subject, html) => {
  try {
    // Tạo transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Cấu hình email
    const mailOptions = {
      from: `"Bookstore - Nhà Sách Online" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    }

    // Gửi email
    await transporter.sendMail(mailOptions)
    console.log('Email sent successfully to:', to)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

module.exports = sendEmail