import { useState, useEffect } from 'react'
import axios from 'axios'
import Select from 'react-select'

export default function AdminBooks({ token }) {
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: '', author: '', price: '', description: '', stock: 20, category: '', publisher: '', image: null
  })
  const [editingBook, setEditingBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [sortType, setSortType] = useState('latest')
  const [showLowStock, setShowLowStock] = useState(false)
  const themeColor = '#5cbdb0'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, catsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/books?limit=100', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/books/categories')
        ])
        setBooks(booksRes.data.books || booksRes.data)
        setCategories(catsRes.data)
        setLoading(false)
      } catch (err) {
        setError('Lỗi tải dữ liệu admin.')
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  const handlePriceChange = (e) => {
    const value = e.target.value
    if (!/^\d*$/.test(value)) return
    setFormData(prev => ({ ...prev, price: value }))
  }

  const handlePriceBlur = () => {
    if (formData.price && formData.price.length > 0) {
      const numValue = parseInt(formData.price)
      if (numValue > 0 && numValue < 1000) {
        setFormData(prev => ({ ...prev, price: (numValue * 1000).toString() }))
      }
    }
  }

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') handlePriceBlur()
  }

  const handlePriceStep = (direction) => {
    const currentValue = parseInt(formData.price) || 0
    const newValue = direction === 'up' ? currentValue + 500 : currentValue - 500
    if (newValue >= 0) {
      setFormData(prev => ({ ...prev, price: newValue.toString() }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) { setError('Vui lòng nhập tên sách'); return }
    if (!formData.author.trim()) { setError('Vui lòng nhập tác giả'); return }
    if (!formData.price || parseInt(formData.price) <= 0) { setError('Vui lòng nhập giá hợp lệ'); return }
    if (!formData.stock || parseInt(formData.stock) < 0) { setError('Vui lòng nhập số lượng tồn kho hợp lệ'); return }
    if (!formData.category) { setError('Vui lòng chọn danh mục'); return }
    if (!formData.description.trim()) { setError('Vui lòng nhập mô tả'); return }
    if (!editingBook && (!formData.image || formData.image === null)) {
      setError('Vui lòng chọn ảnh bìa cho sách'); return
    }

    const data = new FormData()
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key])
      }
    })

    try {
      if (editingBook) {
        await axios.put(`http://localhost:5000/api/books/${editingBook._id}`, data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await axios.post('http://localhost:5000/api/books', data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
      }

      const res = await axios.get('http://localhost:5000/api/books?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBooks(res.data.books || res.data)
      setFormData({ title: '', author: '', price: '', description: '', stock: 20, category: '', publisher: '', image: null })
      setEditingBook(null)
    } catch (err) {
      setError(err.response?.data?.msg || 'Lỗi khi lưu sách.')
    }
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    setFormData({
      title: book.title, author: book.author, price: book.price, description: book.description,
      stock: book.stock, category: book.category?._id || book.category, publisher: book.publisher || '', image: null
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa sách này?')) return
    try {
      await axios.delete(`http://localhost:5000/api/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBooks(books.filter(b => b._id !== id))
    } catch (err) {
      setError('Lỗi khi xóa sách.')
    }
  }

  const handleCancel = () => {
    setEditingBook(null)
    setFormData({ title: '', author: '', price: '', description: '', stock: 20, category: '', publisher: '', image: null })
  }

  const handleUpdateStock = async (bookId, newStock) => {
    try {
      await axios.put(
        `http://localhost:5000/api/books/${bookId}`,
        { stock: newStock },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const res = await axios.get('http://localhost:5000/api/books?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBooks(res.data.books || res.data)
      alert('Cập nhật số lượng thành công!')
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.response?.data?.msg || 'Lỗi server'))
    }
  }

  const categoryOptions = categories.map(cat => ({ value: cat._id, label: cat.name }))

  const sortedBooks = [...books].sort((a, b) => {
    if (sortType === 'alphabet') return a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })
    else if (sortType === 'price_asc') return a.price - b.price
    else if (sortType === 'price_desc') return b.price - a.price
    else return b._id.toString().localeCompare(a._id.toString())
  })

  const lowStockBooks = books.filter(book => book.stock <= 2)
  const displayBooks = showLowStock ? lowStockBooks : sortedBooks

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = displayBooks.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(displayBooks.length / itemsPerPage)

  const stats = {
    totalBooks: books.length,
    totalCategories: categories.length,
    lowStock: books.filter(b => b.stock <= 2).length
  }

  if (loading) return <div className="text-center py-5">Đang tải...</div>

  return (
    <div className="container-fluid py-4">
      <h2 className="text-center mb-5 fw-bold" style={{ color: themeColor }}>Quản lý sách</h2>

      {error && <div className="alert alert-danger shadow-sm border-0 mb-4">{error}</div>}

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100" style={{ 
            borderRadius: '15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '14px', opacity: 0.9 }}>Tổng số sách</h6>
                  <h2 className="mb-0 fw-bold" style={{ fontSize: '2.5rem' }}>{stats.totalBooks}</h2>
                </div>
                <i className="bi bi-book" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100" style={{ 
            borderRadius: '15px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '14px', opacity: 0.9 }}>Danh mục</h6>
                  <h2 className="mb-0 fw-bold" style={{ fontSize: '2.5rem' }}>{stats.totalCategories}</h2>
                </div>
                <i className="bi bi-folder" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100" style={{ 
            borderRadius: '15px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '14px', opacity: 0.9 }}>Sắp hết hàng</h6>
                  <h2 className="mb-0 fw-bold" style={{ fontSize: '2.5rem' }}>{stats.lowStock}</h2>
                </div>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form thêm / chỉnh sửa sách */}
      <div className="card shadow mb-5" style={{ borderRadius: '15px', border: 'none' }}>
        <div className="card-body p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0 fw-bold">{editingBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}</h4>
            {/* ✅ ĐÃ XÓA NÚT "← Quản lý danh mục" */}
          </div>

          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium">Tên sách <span className="text-danger">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-control form-control-lg" required style={{ borderRadius: '10px' }} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Tác giả <span className="text-danger">*</span></label>
              <input type="text" name="author" value={formData.author} onChange={handleChange} className="form-control form-control-lg" required style={{ borderRadius: '10px' }} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-medium">Giá (₫)</label>
              <div className="input-group">
                <input type="text" name="price" value={formData.price} onChange={handlePriceChange} onBlur={handlePriceBlur} onKeyDown={handlePriceKeyDown} className="form-control" required placeholder="Enter để thêm nhanh 000" style={{ borderRadius: '10px 0 0 10px' }} />
                <button className="btn btn-outline-secondary" type="button" onClick={() => handlePriceStep('up')} style={{ borderTop: '1px solid #ced4da', borderRight: 'none', borderBottom: '1px solid #ced4da' }}>▲</button>
                <button className="btn btn-outline-secondary" type="button" onClick={() => handlePriceStep('down')} style={{ borderTop: '1px solid #ced4da', borderLeft: 'none', borderBottom: '1px solid #ced4da', borderRadius: '0 10px 10px 0' }}>▼</button>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-medium">Số lượng tồn kho <span className="text-danger">*</span></label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="form-control" required min="0" style={{ borderRadius: '10px' }} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-medium">Danh mục <span className="text-danger">*</span></label>
              <Select options={categoryOptions} placeholder="Chọn hoặc gõ để tìm danh mục..." isSearchable={true} isClearable={true} value={categoryOptions.find(opt => opt.value === formData.category) || null} onChange={(selectedOption) => { setFormData({ ...formData, category: selectedOption ? selectedOption.value : '' }) }} styles={{ control: (base) => ({ ...base, borderRadius: '10px', borderColor: '#dee2e6', minHeight: '48px', fontSize: '16px' }), menu: (base) => ({ ...base, borderRadius: '10px', zIndex: 9999 }) }} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Nhà xuất bản</label>
              <input type="text" name="publisher" value={formData.publisher} onChange={handleChange} className="form-control" style={{ borderRadius: '10px' }} />
            </div>
            <div className="col-12">
              <label className="form-label fw-medium">Mô tả <span className="text-danger">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="form-control" rows="3" required style={{ borderRadius: '10px' }} />
            </div>
            <div className="col-12">
              <label className="form-label fw-medium">Ảnh bìa <span className="text-danger">*</span></label>
              <input type="file" name="image" onChange={handleChange} className="form-control" accept="image/*" required={!editingBook} style={{ borderRadius: '10px' }} />
              {editingBook && formData.image === null && editingBook.image && (
                <small className="text-muted d-block mt-2"><i className="bi bi-info-circle me-1"></i>Ảnh hiện tại: {editingBook.image}<br/><strong>Để giữ ảnh cũ:</strong> Không chọn file mới<br/><strong>Để thay đổi:</strong> Chọn file ảnh mới</small>
              )}
            </div>
            <div className="col-12 d-flex gap-2 mt-4">
              {editingBook && (<button type="button" onClick={handleCancel} className="btn btn-lg btn-outline-danger px-4 fw-bold shadow-sm" style={{ borderRadius: '10px' }}>Hủy</button>)}
              <button type="submit" className="btn btn-lg px-4 fw-bold shadow-sm text-white" style={{ backgroundColor: themeColor, borderRadius: '10px' }}>{editingBook ? 'Cập nhật sách' : 'Thêm sách'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* NÚT LỌC SÁCH SẮP HẾT */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <h4 className="mb-0 fw-bold text-dark">
          {showLowStock ? 'Sách sắp hết hàng' : 'Danh sách sách hiện có'} ({displayBooks.length} cuốn)
        </h4>
        
        <div className="d-flex gap-2">
          <button 
            onClick={() => { setShowLowStock(false); setSortType('latest'); setCurrentPage(1); }}
            className={`btn px-4 py-2 fw-bold ${!showLowStock ? 'btn-success' : 'btn-outline-secondary'}`}
            style={{ borderRadius: '25px' }}
          >
            Tất cả sách
          </button>
          <button 
            onClick={() => { setShowLowStock(true); setCurrentPage(1); }}
            className={`btn px-4 py-2 fw-bold ${showLowStock ? 'btn-danger' : 'btn-outline-secondary'}`}
            style={{ borderRadius: '25px' }}
          >
            <i className="bi bi-exclamation-triangle me-1"></i>Sắp hết hàng ({lowStockBooks.length})
          </button>
        </div>
      </div>

      <div className="table-responsive shadow-sm rounded-3">
        <table className="table table-hover table-bordered mb-0 align-middle">
          <thead className="table-dark">
            <tr>
              <th className="px-4 py-3">Ảnh</th>
              <th className="px-4 py-3">Tên sách</th>
              <th className="px-4 py-3">Tác giả</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3 text-center">Tồn kho</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3 text-center" style={{ width: '250px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? currentItems.map(book => (
              <tr key={book._id}>
                <td className="px-4 py-3">{book.image ? (<img src={`http://localhost:5000/uploads/${book.image}`} alt={book.title} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />) : (<span className="text-muted">Không có ảnh</span>)}</td>
                <td className="px-4 py-3 fw-medium">{book.title}</td>
                <td className="px-4 py-3">{book.author}</td>
                <td className="px-4 py-3">{book.price.toLocaleString()} ₫</td>
                <td className="px-4 py-3 text-center">
                  <span className={`badge ${book.stock <= 2 ? 'bg-danger' : book.stock <= 5 ? 'bg-warning' : 'bg-success'}`} style={{ padding: '8px 12px', borderRadius: '20px' }}>
                    {book.stock} cuốn {book.stock <= 2 && '(Sắp hết)'}
                  </span>
                </td>
                <td className="px-4 py-3">{book.category?.name || book.category || 'Chưa có'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="d-flex gap-2 justify-content-center">
                    <button className="btn btn-sm btn-warning fw-bold" onClick={() => handleEdit(book)} style={{ borderRadius: '6px' }}>Sửa</button>
                    <button className="btn btn-sm btn-danger fw-bold" onClick={() => handleDelete(book._id)} style={{ borderRadius: '6px' }}>Xóa</button>
                    <button 
                      className="btn btn-sm btn-info fw-bold" 
                      onClick={() => {
                        const newStock = prompt(`Cập nhật số lượng cho "${book.title}":`, book.stock)
                        if (newStock !== null && !isNaN(newStock)) {
                          handleUpdateStock(book._id, parseInt(newStock))
                        }
                      }}
                      style={{ borderRadius: '6px' }}
                    >
                      Sửa stock
                    </button>
                  </div>
                </td>
              </tr>
            )) : (<tr><td colSpan="7" className="text-center py-4 text-muted">Chưa có dữ liệu hiển thị.</td></tr>)}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-5">
          <ul className="pagination justify-content-center">
            {[...Array(totalPages)].map((_, i) => (
              <li key={i} className={`page-item mx-1 ${currentPage === i + 1 ? 'active' : ''}`}>
                <button 
                  className="page-link shadow-sm rounded-circle" 
                  onClick={() => {
                    setCurrentPage(i + 1)
                    window.scrollTo({ top: 400, behavior: 'smooth' })
                  }}
                  style={currentPage === i + 1 ? 
                    { backgroundColor: themeColor, borderColor: themeColor, color: 'white', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : 
                    { color: themeColor, borderColor: themeColor, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                  }
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}