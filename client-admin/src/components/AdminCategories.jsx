import { useState, useEffect } from 'react'
import axios from 'axios'
export default function AdminCategories({ token }) {
  const [categories, setCategories] = useState([])
  const [books, setBooks] = useState([])
  const [name, setName] = useState('')
  const [editingCat, setEditingCat] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [sortType, setSortType] = useState('latest')
  const themeColor = '#5cbdb0'

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books/categories')
      setCategories(res.data)
      setLoading(false)
    } catch (err) {
      setError('Lỗi tải danh mục.')
      setLoading(false)
    }
  }

  const fetchBooks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books?limit=500')
      setBooks(res.data.books || res.data)
    } catch (err) {
      console.error('Lỗi tải sách:', err)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchBooks()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Tên danh mục không được để trống')
      return
    }

    try {
      if (editingCat) {
        await axios.put(`http://localhost:5000/api/books/categories/${editingCat._id}`, 
          { name: name.trim() }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        await axios.post('http://localhost:5000/api/books/categories', 
          { name: name.trim() }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      await fetchCategories()
      setName('')
      setEditingCat(null)
    } catch (err) {
      setError(err.response?.data?.msg || 'Lỗi xử lý danh mục.')
    }
  }

  const handleEdit = (cat) => {
    setEditingCat(cat)
    setName(cat.name)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setEditingCat(null)
    setName('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa danh mục này?')) return
    try {
      await axios.delete(`http://localhost:5000/api/books/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCategories(categories.filter(c => c._id !== id))
      setError(null)
    } catch (err) {
      const msg = err.response?.data?.msg || 'Lỗi khi xóa. Danh mục này có thể đang chứa sách.'
      setError(msg)
    }
  }

  const getCategoryBookCount = (categoryId) => {
    return books.filter(book => 
      book.category?._id === categoryId || book.category === categoryId
    ).length
  }

  const sortedCategories = [...categories].sort((a, b) => {
    if (sortType === 'alphabet') {
      return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
    } else {
      return b._id.toString().localeCompare(a._id.toString())
    }
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedCategories.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage)

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: themeColor, width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
      <p className="mt-3 text-muted">Đang tải danh mục...</p>
    </div>
  )

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 fw-bold text-center" style={{ color: themeColor }}>Quản lý danh mục</h2>

      {error && <div className="alert alert-danger shadow-sm border-0 mb-4">{error}</div>}

      {/* Form thêm / sửa */}
      <div className="card shadow-sm mb-5" style={{ borderRadius: '15px', border: 'none' }}>
        <div className="card-body p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0 fw-bold">{editingCat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h4>
            {/* ✅ ĐÃ XÓA NÚT "← Quản lý sách" */}
          </div>

          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-12 col-md">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Ví dụ: Tiểu thuyết, Kỹ năng sống..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ borderRadius: '10px', fontSize: '16px' }}
              />
            </div>
            <div className="col-12 col-md-auto d-flex gap-2">
              {editingCat && (
                <button type="button" onClick={handleCancel} className="btn btn-lg btn-outline-danger px-4 fw-bold shadow-sm" style={{ borderRadius: '10px' }}>
                  Hủy
                </button>
              )}
              <button type="submit" className="btn btn-lg px-4 fw-bold shadow-sm text-white" style={{ backgroundColor: themeColor, borderRadius: '10px' }}>
                {editingCat ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Danh sách danh mục */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <h4 className="mb-0 fw-bold text-dark">Danh sách danh mục ({sortedCategories.length})</h4>
        
        <div className="d-flex align-items-center gap-2 p-1 bg-white shadow-sm border" style={{ borderRadius: '30px' }}>
          <div className="d-flex align-items-center gap-2 px-3 py-1 text-muted fw-bold border-end" style={{ fontSize: '13px' }}>
            <i className="bi bi-funnel"></i> Sắp xếp
          </div>

          <button 
            onClick={() => { setSortType('alphabet'); setCurrentPage(1); }}
            className="btn btn-sm d-flex align-items-center gap-1 px-3 py-2 border-0 transition-all"
            style={{ 
              borderRadius: '25px',
              backgroundColor: sortType === 'alphabet' ? themeColor : 'transparent',
              color: sortType === 'alphabet' ? 'white' : '#666',
              fontWeight: '600'
            }}
          >
            <i className="bi bi-sort-alpha-down"></i> A-Z
          </button>

          <button 
            onClick={() => { setSortType('latest'); setCurrentPage(1); }}
            className="btn btn-sm px-3 py-2 border-0 transition-all"
            style={{ 
              borderRadius: '25px',
              backgroundColor: sortType === 'latest' ? themeColor : 'transparent',
              color: sortType === 'latest' ? 'white' : '#666',
              fontWeight: '600'
            }}
          >
            Mới nhất
          </button>
        </div>
      </div>

      <div className="table-responsive shadow-sm rounded-3">
        <table className="table table-hover table-bordered mb-0 align-middle">
          <thead className="table-dark">
            <tr>
              <th className="px-4 py-3">Tên danh mục</th>
              <th className="px-4 py-3 text-center">Số sách</th>
              <th className="px-4 py-3 text-center" style={{ width: '180px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? currentItems.map(cat => {
              const bookCount = getCategoryBookCount(cat._id)
              return (
                <tr key={cat._id}>
                  <td className="px-4 py-3 fw-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="badge" style={{ 
                      backgroundColor: bookCount > 0 ? themeColor : '#6c757d',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}>
                      <i className="bi bi-book me-1"></i>{bookCount} cuốn
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      className="btn btn-sm btn-warning me-2 fw-bold" 
                      onClick={() => handleEdit(cat)}
                      style={{ borderRadius: '6px' }}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-sm btn-danger fw-bold" 
                      onClick={() => handleDelete(cat._id)}
                      style={{ borderRadius: '6px' }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-muted">Chưa có dữ liệu hiển thị.</td>
              </tr>
            )}
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