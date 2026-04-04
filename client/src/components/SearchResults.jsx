import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'

export default function SearchResults({ token }) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setBooks([])
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`http://localhost:5000/api/books?search=${encodeURIComponent(query.trim())}&limit=100`)
        setBooks(res.data.books || [])
      } catch (err) {
        setError('Lỗi tải kết quả tìm kiếm.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query])

  const addToCart = (book) => {
    if (!token) {
      alert('Bạn cần đăng nhập để thêm vào giỏ hàng!')
      return
    }
    let cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(item => item._id === book._id)

    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({ ...book, quantity: 1 })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    alert(`Đã thêm "${book.title}" vào giỏ hàng!`)
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4 fw-bold" style={{ color: '#5cbdb0' }}>
        Kết quả tìm kiếm cho: "{query}"
      </h2>

      {loading && <div className="text-center mt-5">Đang tải...</div>}
      
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && books.length === 0 && (
        <div className="text-center mt-5">
          <h4 className="text-muted">Không tìm thấy kết quả nào</h4>
          <p className="text-muted">Thử tìm kiếm với từ khóa khác</p>
          <Link to="/" className="btn btn-primary mt-3">Quay lại trang chủ</Link>
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        <>
          <p className="text-muted mb-4">Tìm thấy {books.length} kết quả</p>
          
          {/* Container giống homepage */}
          <div className="row justify-content-center">
            <div className="col-12 col-lg-11">
              <div className="bg-white rounded shadow-lg p-4 p-md-5">
                <div className="row g-4">
                  {books.map(book => (
                    <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={book._id}>
                      <div className="card h-100 border-0 shadow-sm hover-shadow">
                        <img 
                          src={`http://localhost:5000/uploads/${book.image || 'default-book.jpg'}`} 
                          className="card-img-top" 
                          alt={book.title} 
                          style={{ height: '280px', objectFit: 'cover' }} 
                        />
                        <div className="card-body d-flex flex-column text-center">
                          <h5 className="card-title">{book.title}</h5>
                          <p className="card-text text-muted">Tác giả: {book.author}</p>
                          <p className="card-text fw-bold text-success mt-auto">
                            {book.price.toLocaleString('vi-VN')} ₫
                          </p>
                          <div className="d-flex gap-2 mt-3">
                            <Link 
                              to={`/book/${book._id}`} 
                              className="btn flex-grow-1 fw-bold" 
                              style={{ backgroundColor: '#5cbdb0', color: 'white' }}
                            >
                              Chi tiết
                            </Link>
                            <button 
                              className="btn flex-grow-1 fw-bold" 
                              style={{ backgroundColor: '#28a745', color: 'white' }}
                              onClick={() => addToCart(book)}
                            >
                              Thêm giỏ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}