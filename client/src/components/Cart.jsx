import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

export default function Cart({ token }) {
  const [cartItems, setCartItems] = useState([])
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartItems(savedCart)
  }, [])

  const updateCart = (newCart) => {
    setCartItems(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const removeFromCart = (id) => {
    const updated = cartItems.filter(item => item._id !== id)
    updateCart(updated)
    showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info')
  }

  const changeQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id)
      return
    }
    const updated = cartItems.map(item =>
      item._id === id ? { ...item, quantity: newQuantity } : item
    )
    updateCart(updated)
  }

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const goToCheckout = () => {
    if (cartItems.length === 0) {
      showToast('Giỏ hàng của bạn đang trống', 'warning')
      return
    }
    navigate('/checkout')
  }

  if (!token) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg border-0 text-center p-5" style={{ borderRadius: '15px' }}>
              <i className="bi bi-lock display-1 text-muted mb-3"></i>
              <h4 className="mb-3">Bạn cần đăng nhập để xem giỏ hàng</h4>
              <p className="text-muted mb-4">Vui lòng đăng nhập để tiếp tục mua sắm</p>
              <Link to="/login" className="btn btn-lg" style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '10px' }}>
                <i className="bi bi-box-arrow-in-right me-2"></i>Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-5 mb-5">
      <h2 className="mb-5 fw-bold text-center" style={{ color: '#5cbdb0' }}>
        <i className="bi bi-cart3 me-2"></i>Giỏ hàng của bạn
      </h2>

      {cartItems.length === 0 ? (
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-lg border-0 text-center p-5" style={{ borderRadius: '15px', backgroundColor: '#f8fff9' }}>
              <div className="mb-4">
                <i className="bi bi-cart-x display-1" style={{ color: '#5cbdb0', fontSize: '6rem' }}></i>
              </div>
              <h3 className="mb-3 fw-bold">Giỏ hàng trống</h3>
              <p className="text-muted mb-4">Chưa có sản phẩm nào trong giỏ hàng của bạn. Hãy bắt đầu mua sắm ngay!</p>
              <Link to="/" className="btn btn-lg px-5" style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '10px' }}>
                <i className="bi bi-house me-2"></i>Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-lg-8 mb-4">
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-bag me-2" style={{ color: '#5cbdb0' }}></i>Sản phẩm ({cartItems.length})
                </h5>
                
                {cartItems.map(item => (
                  <div key={item._id} className="card mb-3 border-0" style={{ backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-2">
                          <img 
                            src={`http://localhost:5000/uploads/${item.image}`} 
                            alt={item.title}
                            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        </div>
                        <div className="col-md-5">
                          <h6 className="fw-bold mb-2">{item.title}</h6>
                          <p className="text-muted mb-1" style={{ fontSize: '14px' }}>
                            <i className="bi bi-person me-1"></i>Tác giả: {item.author}
                          </p>
                          <p className="fw-bold text-success mb-0" style={{ fontSize: '1.1rem' }}>
                            {item.price.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                        <div className="col-md-3">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={() => changeQuantity(item._id, item.quantity - 1)}
                              style={{ width: '35px', height: '35px', borderRadius: '8px' }}
                            >
                              −
                            </button>
                            <span className="fw-bold mx-2" style={{ fontSize: '1.1rem' }}>{item.quantity}</span>
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={() => changeQuantity(item._id, item.quantity + 1)}
                              style={{ width: '35px', height: '35px', borderRadius: '8px' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="col-md-2 text-end">
                          <p className="fw-bold mb-2" style={{ color: '#5cbdb0' }}>
                            {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                          </p>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeFromCart(item._id)}
                            style={{ borderRadius: '8px' }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-lg border-0 sticky-top" style={{ borderRadius: '12px', top: '100px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-receipt me-2" style={{ color: '#5cbdb0' }}></i>Tổng kết đơn hàng
                </h5>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tạm tính:</span>
                    <span className="fw-bold">{totalPrice.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí vận chuyển:</span>
                    <span className="text-success fw-bold">Miễn phí</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Tổng cộng:</h5>
                    <h4 className="mb-0 fw-bold" style={{ color: '#5cbdb0' }}>
                      {totalPrice.toLocaleString('vi-VN')} ₫
                    </h4>
                  </div>
                </div>

                <button 
                  className="btn w-100 fw-bold py-3 mb-3" 
                  style={{ 
                    backgroundColor: '#5cbdb0', 
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4aa8a0'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#5cbdb0'
                    e.target.style.transform = 'translateY(0)'
                  }}
                  onClick={goToCheckout}
                >
                  <i className="bi bi-credit-card me-2"></i>Thanh toán ngay
                </button>

                <Link 
                  to="/" 
                  className="btn btn-outline-secondary w-100 py-2"
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-arrow-left me-2"></i>Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}