const generateOrderConfirmationEmail = (customerName, orderDetails) => {
  // Tạo danh sách sản phẩm với tên thật
  const itemsList = orderDetails.items.map(item => `
    <tr>
      <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">
        <strong>${item.title || item.book?.title || 'Sản phẩm'}</strong>
      </td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; text-align: right;">${(item.price * item.quantity).toLocaleString('vi-VN')} ₫</td>
    </tr>
  `).join('')

  // Tính toán discount
  const originalAmount = orderDetails.originalAmount || orderDetails.totalAmount
  const discountAmount = originalAmount - orderDetails.totalAmount
  const discountPercent = discountAmount > 0 ? Math.round((discountAmount / originalAmount) * 100) : 0
  const voucherCode = orderDetails.voucherCode || null

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #5cbdb0 0%, #4aa8a0 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .greeting { margin-bottom: 20px; }
        .order-info { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .order-info h3 { margin-top: 0; color: #5cbdb0; font-size: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        thead th { background: #5cbdb0; color: white; padding: 15px 12px; text-align: left; font-weight: 600; }
        tbody td { padding: 15px 12px; border-bottom: 1px solid #eee; }
        tbody tr:hover { background: #f8f9fa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
        .total-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .total-label { font-weight: 600; color: #666; }
        .total-value { font-weight: 700; color: #333; }
        .discount-row { color: #28a745; }
        .grand-total { background: #e8f8f5; padding: 15px; border-radius: 8px; margin-top: 15px; }
        .grand-total .total-value { color: #5cbdb0; font-size: 24px; }
        .voucher-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .voucher-box h4 { margin: 0 0 10px 0; color: #856404; }
        .voucher-code { font-family: monospace; background: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; color: #856404; }
        .shipping-box { background: #e8f8f5; border-left: 4px solid #5cbdb0; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .shipping-box h4 { margin: 0 0 15px 0; color: #5cbdb0; }
        .shipping-box p { margin: 8px 0; }
        .payment-info { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .payment-info strong { color: #5cbdb0; }
        .btn { display: inline-block; padding: 14px 35px; background: #5cbdb0; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 25px; text-align: center; color: #666; border-top: 3px solid #5cbdb0; }
        .footer strong { color: #5cbdb0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Cảm ơn bạn đã mua hàng!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Đơn hàng của bạn đã được xác nhận</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            <p>Kính chào <strong>${customerName}</strong>,</p>
            <p>Cảm ơn bạn đã tin tưởng và mua sắm tại <strong>Bookstore</strong>. Chúng tôi đã nhận được đơn hàng của bạn và sẽ xử lý trong thời gian sớm nhất.</p>
          </div>
          
          <div class="order-info">
            <h3>📦 Chi tiết đơn hàng:</h3>
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th class="text-center">SL</th>
                  <th class="text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <span class="total-label">Tổng tiền hàng:</span>
                <span class="total-value">${originalAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
              
              ${discountAmount > 0 ? `
              <div class="total-row discount-row">
                <span class="total-label">
                  <i style="color: #28a745;">🎫</i> Giảm giá ${voucherCode ? `(${voucherCode})` : ''}:
                </span>
                <span class="total-value">- ${discountAmount.toLocaleString('vi-VN')} ₫ ${discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
              </div>
              ` : ''}
              
              <div class="grand-total">
                <div class="total-row">
                  <span class="total-label" style="font-size: 18px;">Tổng cộng:</span>
                  <span class="total-value">${orderDetails.totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>

            ${voucherCode ? `
            <div class="voucher-box">
              <h4>🎫 Voucher đã sử dụng:</h4>
              <p><strong>Mã voucher:</strong> <span class="voucher-code">${voucherCode}</span></p>
              <p><strong>Giảm giá:</strong> ${discountAmount.toLocaleString('vi-VN')} ₫ ${discountPercent > 0 ? `(${discountPercent}%)` : ''}</p>
            </div>
            ` : ''}

            <div class="payment-info">
              <p><strong>Phương thức thanh toán:</strong> ${orderDetails.paymentMethod === 'COD' ? '💵 Thanh toán khi nhận hàng (COD)' : '💳 Thanh toán online'}</p>
            </div>
            
            <div class="shipping-box">
              <h4>📍 Địa chỉ giao hàng:</h4>
              <p><strong>${orderDetails.shippingInfo.name}</strong></p>
              <p>📞 ${orderDetails.shippingInfo.phone}</p>
              <p>📧 ${orderDetails.shippingInfo.email}</p>
              <p>🏠 ${orderDetails.shippingInfo.address}</p>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="http://localhost:5173/orders" class="btn">Xem đơn hàng của bạn</a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi qua email này hoặc hotline 1900 xxxx.</p>
          
          <p>Chúc bạn có những trải nghiệm đọc sách tuyệt vời!</p>
        </div>
        
        <div class="footer">
          <p><strong>Bookstore - Nhà Sách Trực Tuyến</strong></p>
          <p>📍 Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
          <p>📞 Hotline: 1900 xxxx | ✉️ Email: support@bookstore.com</p>
          <p>🌐 Website: www.bookstore.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}

module.exports = { generateOrderConfirmationEmail }