import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../context/ToastContext'

export default function BookDetail({ token: propToken }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const token = propToken || localStorage.getItem('token')
  const { showToast } = useToast()

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/books/${id}`)
        setBook(res.data)
        setLoading(false)
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
        setIsFavorite(favorites.some(fav => fav._id === res.data._id))
      } catch (err) {
        setError(err.response?.data?.msg || 'Không tìm thấy sách')
        setLoading(false)
      }
    }
    fetchBook()
  }, [id])

  const addToCart = () => {
    if (!token) {
      showToast('Bạn cần đăng nhập để thêm vào giỏ hàng!', 'warning')
      return
    }
    if (!book) return
    let cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(item => item._id === book._id)
    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({ ...book, quantity: 1 })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    showToast(`Đã thêm "${book.title}" vào giỏ hàng!`, 'success')
  }

  const toggleFavorite = () => {
    if (!token) {
      showToast('Bạn cần đăng nhập để thêm vào yêu thích!', 'warning')
      return
    }
    if (!book) return
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    if (isFavorite) {
      favorites = favorites.filter(fav => fav._id !== book._id)
      setIsFavorite(false)
      showToast('Đã xóa khỏi danh sách yêu thích', 'info')
    } else {
      favorites.push({ _id: book._id, title: book.title, author: book.author, price: book.price, image: book.image })
      setIsFavorite(true)
      showToast('Đã thêm vào danh sách yêu thích', 'success')
    }
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }

  if (loading) return <div className="text-center mt-5">Đang tải sách...</div>
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>

  const description = book.description || 'Không có mô tả'
  const shortDesc = description.length > 150 ? description.substring(0, 150) + '...' : description

  // Tính trung bình rating
  const avgRating = book.reviews && book.reviews.length > 0 
    ? (book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length).toFixed(1) 
    : 0

  return (
    <div className="container mt-5 mb-5">
      <div className="card shadow-lg border-0" style={{ borderRadius: '15px', backgroundColor: '#fafafa' }}>
        <div className="row g-0">
          <div className="col-md-3 p-4">
            <img src={`http://localhost:5000/uploads/${book.image || 'default-book.jpg'}`} alt={book.title} className="img-fluid rounded shadow-lg" style={{ maxHeight: '400px', objectFit: 'cover', border: '3px solid #5cbdb0' }} />
          </div>
          <div className="col-md-9">
            <div className="card-body p-4 p-md-5">
              <h2 className="mb-3 fw-bold" style={{ color: '#5cbdb0' }}>{book.title}</h2>
              <div className="mb-3">
                <p className="lead text-muted mb-2"><i className="bi bi-person me-2"></i>Tác giả: <strong>{book.author}</strong></p>
                <p className="lead fw-bold" style={{ color: '#28a745', fontSize: '1.8rem' }}>{book.price.toLocaleString('vi-VN')} ₫</p>
                {/* ✅ HIỂN THỊ SAO ĐÁNH GIÁ */}
                {book.reviews && book.reviews.length > 0 && (
                  <div className="d-flex align-items-center gap-2">
                    <div className="text-warning">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`bi bi-star${i < Math.round(avgRating) ? '-fill' : ''}`}></i>
                      ))}
                    </div>
                    <span className="text-muted small">({book.reviews.length} đánh giá)</span>
                  </div>
                )}
              </div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="fw-bold mb-2" style={{ color: '#5cbdb0' }}><i className="bi bi-folder me-2"></i>Danh mục</h6>
                  <p className="text-muted">{book.category?.name || 'Chưa có danh mục'}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold mb-2" style={{ color: '#5cbdb0' }}><i className="bi bi-building me-2"></i>Nhà xuất bản</h6>
                  <p className="text-muted">{book.publisher || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="mb-4">
                <h6 className="fw-bold mb-2" style={{ color: '#5cbdb0' }}><i className="bi bi-file-text me-2"></i>Mô tả sách</h6>
                <p className="text-muted">{showFullDescription ? description : shortDesc}
                  {description.length > 150 && (<button className="btn btn-link p-0 ms-2" style={{ color: '#5cbdb0', textDecoration: 'none' }} onClick={() => setShowFullDescription(!showFullDescription)}>{showFullDescription ? 'Thu gọn' : 'Xem thêm'}</button>)}
                </p>
              </div>
              <div className="d-flex gap-3 flex-wrap">
                <button className="btn btn-lg fw-bold px-4" style={{ backgroundColor: '#28a745', color: 'white', borderRadius: '10px' }} onClick={addToCart}><i className="bi bi-cart-plus me-2"></i>Thêm vào giỏ hàng</button>
                <button className={`btn btn-lg fw-bold px-4 ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}`} style={{ borderRadius: '10px' }} onClick={toggleFavorite}><i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'} me-2`}></i>{isFavorite ? 'Đã yêu thích' : 'Yêu thích'}</button>
                <button className="btn btn-lg fw-bold px-4 btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={() => setShowReviews(true)}><i className="bi bi-chat-square-text me-2"></i>Đánh giá ({book.reviews?.length || 0})</button>
                <button className="btn btn-lg fw-bold px-4 btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={() => navigate(-1)}><i className="bi bi-arrow-left me-2"></i>Quay lại</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Modal */}
      {showReviews && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '15px' }}>
              <div className="modal-header border-0" style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '15px 15px 0 0' }}>
                <h5 className="modal-title fw-bold"><i className="bi bi-chat-square-text me-2"></i>Đánh giá về "{book.title}"</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReviews(false)}></button>
              </div>
              <div className="modal-body p-4">
                {(!book.reviews || book.reviews.length === 0) ? (
                  <div className="text-center py-4">
                    <i className="bi bi-chat-square display-1 text-muted"></i>
                    <p className="mt-3 text-muted">Chưa có đánh giá nào cho sách này</p>
                    <p className="text-muted small">Hãy là người đầu tiên đánh giá!</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {book.reviews.map((review, index) => (
                      <div key={index} className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                <h6 className="mb-0 fw-bold"><i className="bi bi-person-circle me-2" style={{ color: '#5cbdb0' }}></i>{review.userName || 'User'}</h6>
                                <small className="text-muted">{new Date(review.date).toLocaleDateString('vi-VN')}</small>
                              </div>
                              <div className="text-warning">
                                {[...Array(5)].map((_, i) => (<i key={i} className={`bi ${i < review.rating ? 'bi-star-fill' : 'bi-star'}`}></i>))}
                              </div>
                            </div>
                            <p className="mb-0 text-muted">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReviews(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}