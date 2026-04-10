const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Book = require('../models/Book');
const { protect, admin } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { generateOrderConfirmationEmail } = require('../utils/emailTemplates');

// ====================== 1. ĐẶT HÀNG ======================
router.post('/', protect, async (req, res) => {
  const { items, shippingInfo, totalAmount, originalAmount, discountAmount, voucherCode, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ msg: 'Giỏ hàng trống' });
  }

  if (!shippingInfo || !shippingInfo.name || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.address) {
    return res.status(400).json({ msg: 'Vui lòng điền đầy đủ thông tin nhận hàng' });
  }

  try {
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const book = await Book.findById(item.book);
        return {
          book: item.book,
          title: book ? book.title : 'Sách',
          quantity: item.quantity,
          price: item.price
        };
      })
    );

    const order = new Order({
      user: req.user.id,
      items: items.map(item => ({
        book: item.book,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: totalAmount,
      originalAmount: originalAmount || totalAmount,
      discountAmount: discountAmount || 0,
      voucherCode: voucherCode,
      shippingInfo: {
        name: shippingInfo.name,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        address: shippingInfo.address
      },
      paymentMethod: paymentMethod || 'cod',
      status: 'pending'
    });

    await order.save();
    console.log('✅ Order created:', order._id);

    for (const item of items) {
      await Book.findByIdAndUpdate(item.book, { 
        $inc: { stock: -item.quantity } 
      });
    }

    try {
      const emailHtml = generateOrderConfirmationEmail(shippingInfo.name, {
        items: itemsWithDetails,
        totalAmount: totalAmount,
        originalAmount: originalAmount || totalAmount,
        discountAmount: discountAmount || 0,
        voucherCode: voucherCode,
        paymentMethod: paymentMethod === 'online' ? 'Online' : 'COD',
        shippingInfo: shippingInfo
      });

      await sendEmail(
        shippingInfo.email,
        '🎉 Xác nhận đơn hàng từ Bookstore - Cảm ơn bạn đã mua hàng!',
        emailHtml
      );
      console.log('✅ Email sent to:', shippingInfo.email);
    } catch (emailErr) {
      console.error('❌ Email error:', emailErr);
    }

    res.status(201).json({ 
      msg: 'Đặt hàng thành công!',
      order 
    });
  } catch (err) {
    console.error('❌ Lỗi tạo đơn hàng:', err);
    res.status(500).json({ msg: 'Lỗi server khi tạo đơn hàng', error: err.message });
  }
});

// ====================== 2. LẤY ĐƠN HÀNG ======================
router.get('/', protect, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.find({})
        .populate('items.book', 'title image price')
        .populate('user', 'name email')
        .sort('-createdAt');
    } else {
      orders = await Order.find({ user: req.user.id })
        .populate('items.book', 'title image price')
        .sort('-createdAt');
    }
    res.json(orders);
  } catch (err) {
    console.error('Lỗi lấy đơn hàng:', err);
    res.status(500).json({ msg: 'Lỗi server khi lấy đơn hàng' });
  }
});

// ====================== 3. LẤY CHI TIẾT ĐƠN HÀNG ======================
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.book', 'title image price reviews')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });
    }

    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Bạn không có quyền xem đơn hàng này' });
    }

    res.json(order);
  } catch (err) {
    console.error('Lỗi lấy chi tiết đơn hàng:', err);
    res.status(500).json({ msg: 'Lỗi server' });
  }
});

// ====================== 4. ADMIN CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ======================
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ msg: 'Trạng thái không hợp lệ' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });
    }

    res.json({ msg: 'Cập nhật trạng thái thành công', order });
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái:', err);
    res.status(500).json({ msg: 'Lỗi server khi cập nhật trạng thái' });
  }
});

// ====================== 5. ADMIN LƯU GHI CHÚ ======================
router.put('/:id/notes', protect, admin, async (req, res) => {
  try {
    const { notes } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { notes },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });
    }
    res.json({ msg: 'Cập nhật ghi chú thành công', order });
  } catch (err) {
    console.error('Lỗi cập nhật ghi chú:', err);
    res.status(500).json({ msg: 'Lỗi server khi cập nhật ghi chú' });
  }
});

// ====================== 6. USER XÁC NHẬN ĐÃ NHẬN HÀNG ======================
router.put('/:id/receive', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Bạn không có quyền thực hiện hành động này' });
    }

    if (order.status !== 'shipping') {
      return res.status(400).json({ msg: 'Đơn hàng chưa ở trạng thái đang giao' });
    }

    order.status = 'delivered';
    order.isReceived = true;
    await order.save();

    res.json({ msg: 'Xác nhận nhận hàng thành công!', order });
  } catch (err) {
    console.error('Lỗi xác nhận nhận hàng:', err);
    res.status(500).json({ msg: 'Lỗi server khi xác nhận nhận hàng' });
  }
});

// ====================== 7. USER ĐÁNH GIÁ SẢN PHẨM ======================
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { itemId, rating, comment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Bạn không có quyền đánh giá đơn này' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ msg: 'Chỉ có thể đánh giá khi đơn hàng đã giao thành công' });
    }

    const item = order.items.find(i => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ msg: 'Không tìm thấy sản phẩm trong đơn' });
    }

    // Thêm đánh giá vào Book
    await Book.findByIdAndUpdate(item.book, {
      $push: {
        reviews: {
          user: req.user.id,
          userName: req.user.name || 'User',
          rating,
          comment,
          date: new Date()
        }
      }
    });

    res.json({ msg: 'Đánh giá thành công!' });
  } catch (err) {
    console.error('Lỗi đánh giá:', err);
    res.status(500).json({ msg: 'Lỗi server khi đánh giá' });
  }
});

// ====================== 8. HỦY ĐƠN HÀNG (User) ======================
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Bạn không có quyền hủy đơn hàng này' });
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ msg: 'Chỉ có thể hủy đơn hàng ở trạng thái "Đã đặt" hoặc "Đã xác nhận"' });
    }

    order.status = 'cancelled';
    await order.save();

    for (const item of order.items) {
      await Book.findByIdAndUpdate(item.book, { $inc: { stock: item.quantity } });
    }

    res.json({ msg: 'Đã hủy đơn hàng thành công', order });
  } catch (err) {
    console.error('Lỗi hủy đơn hàng:', err);
    res.status(500).json({ msg: 'Lỗi server khi hủy đơn hàng', error: err.message });
  }
});

module.exports = router;