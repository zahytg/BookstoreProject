const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');

// Lấy giỏ hàng
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.book');
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi' });
  }
});

// Thêm vào giỏ
router.post('/add', protect, async (req, res) => {
  const { bookId, quantity = 1 } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    const itemIndex = cart.items.findIndex(item => item.book.toString() === bookId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ book: bookId, quantity });
    }
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi' });
  }
});

// Xóa item (bạn tự thêm DELETE)

module.exports = router;