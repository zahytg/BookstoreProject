const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,       // đảm bảo không trùng tên danh mục
    trim: true          // loại bỏ khoảng trắng thừa
  }
}, {
  timestamps: true      // tự động thêm createdAt, updatedAt
});

module.exports = mongoose.model('Category', categorySchema);