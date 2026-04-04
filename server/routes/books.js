const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middleware/auth');

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsPath = path.join(__dirname, '../uploads');
    
    // Tạo folder uploads nếu chưa tồn tại
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Chỉ chấp nhận file ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'), false);
    }
  }
});

// ====================== GET ALL BOOKS với phân trang ======================
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sortBy = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    const sortString = order === 'desc' ? `-${sortBy}` : sortBy;
    const skip = (page - 1) * limit;

    // Xây dựng query
    const query = {};

    // Filter theo category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Tìm kiếm theo title hoặc author
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const [books, total] = await Promise.all([
      Book.find(query)
        .populate('category', 'name')
        .sort(sortString)
        .skip(skip)
        .limit(limit),
      Book.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      books,
      currentPage: page,
      totalPages,
      totalBooks: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách sách:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ msg: 'Lỗi server' });
  }
});

// GET chi tiết sách
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('category', 'name');
    
    if (!book) {
      return res.status(404).json({ msg: 'Không tìm thấy sách' });
    }

    res.json(book);
  } catch (err) {
    console.error('Lỗi chi tiết sách:', err);
    res.status(500).json({ msg: 'Lỗi server', error: err.message });
  }
});

// POST thêm sách
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { title, author, price, description, stock, category, publisher } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!title || !author || !price || !category) {
      return res.status(400).json({ msg: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    let imageName = 'default-book.jpg';
    
    if (req.file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ msg: 'Chỉ chấp nhận file ảnh (jpg, png, webp, gif)' });
      }
      imageName = req.file.filename;
    }

    const book = new Book({
      title,
      author,
      price: Number(price),
      description: description || '',
      stock: Number(stock) || 10,
      category,
      publisher: publisher || '',
      image: imageName
    });

    await book.save();
    res.status(201).json(book);
  } catch (err) {
    console.error('Lỗi thêm sách:', err);
    res.status(500).json({ msg: 'Lỗi khi thêm sách', error: err.message });
  }
});

// PUT sửa sách
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ msg: 'Không tìm thấy sách' });
    }

    const { title, author, price, description, stock, category, publisher } = req.body;

    book.title = title || book.title;
    book.author = author || book.author;
    book.price = price ? Number(price) : book.price;
    book.description = description !== undefined ? description : book.description;
    book.stock = stock ? Number(stock) : book.stock;
    book.category = category || book.category;
    book.publisher = publisher !== undefined ? publisher : book.publisher;

    if (req.file) {
      book.image = req.file.filename;
    }

    await book.save();
    
    // Populate category trước khi trả về
    const updatedBook = await Book.findById(book._id).populate('category', 'name');
    
    res.json(updatedBook);
  } catch (err) {
    console.error('Lỗi cập nhật sách:', err);
    res.status(500).json({ msg: 'Lỗi khi cập nhật sách', error: err.message });
  }
});

// DELETE xóa sách
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ msg: 'Không tìm thấy sách' });
    }

    // Xóa file ảnh nếu tồn tại (không xóa default-book.jpg)
    if (book.image && book.image !== 'default-book.jpg') {
      const imagePath = path.join(__dirname, '../uploads', book.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await book.deleteOne();
    res.json({ msg: 'Xóa sách thành công' });
  } catch (err) {
    console.error('Lỗi xóa sách:', err);
    res.status(500).json({ msg: 'Lỗi khi xóa sách' });
  }
});

// ====================== QUẢN LÝ DANH MỤC ======================
router.post('/categories', protect, admin, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Tên danh mục không được để trống' });
    }

    const existing = await Category.findOne({ name: new RegExp('^' + name.trim() + '$', 'i') });
    
    if (existing) {
      return res.status(400).json({ msg: 'Danh mục này đã tồn tại' });
    }

    const category = new Category({ name: name.trim() });
    await category.save();

    res.status(201).json(category);
  } catch (err) {
    console.error('Lỗi thêm danh mục:', err);
    res.status(500).json({ msg: 'Lỗi server khi thêm danh mục' });
  }
});

router.put('/categories/:id', protect, admin, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Tên danh mục không được để trống' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ msg: 'Không tìm thấy danh mục' });
    }

    res.json(category);
  } catch (err) {
    console.error('Lỗi cập nhật danh mục:', err);
    res.status(500).json({ msg: 'Lỗi server khi cập nhật danh mục' });
  }
});

router.delete('/categories/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: 'Không tìm thấy danh mục' });
    }

    // Kiểm tra xem danh mục có đang được sử dụng không
    const bookCount = await Book.countDocuments({ category: req.params.id });
    
    if (bookCount > 0) {
      return res.status(400).json({ 
        msg: `Không thể xóa danh mục này vì đang có ${bookCount} sách thuộc danh mục.` 
      });
    }

    await category.deleteOne();
    res.json({ msg: 'Xóa danh mục thành công' });
  } catch (err) {
    console.error('Lỗi xóa danh mục:', err);
    res.status(500).json({ msg: 'Lỗi server khi xóa danh mục' });
  }
});

module.exports = router;