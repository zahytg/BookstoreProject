const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  image: String,
  stock: { type: Number, default: 10 },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'  // ← Dòng này rất quan trọng để populate hoạt động
  },
  publisher: String
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);