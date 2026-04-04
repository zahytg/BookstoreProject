const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/auth');

router.get('/orders', protect, admin, async (req, res) => {
  const orders = await Order.find().populate('user', 'username email').sort('-createdAt');
  res.json(orders);
});

router.put('/orders/:id', protect, admin, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(order);
});

module.exports = router;