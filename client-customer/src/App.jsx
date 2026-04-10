import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import BookDetail from './components/BookDetail'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Orders from './components/Orders'
import Profile from './components/Profile'
import SearchResults from './components/SearchResults'
import { ToastProvider } from './context/ToastContext'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : {}
  })
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken) setToken(savedToken)
    if (savedUser) setUser(JSON.parse(savedUser))
  }, [])

  const logout = () => {
    localStorage.clear()
    setToken('')
    setUser({})
  }

  return (
    <ToastProvider>
      <Router>
        {/* ✅ NAVBAR - FULL WIDTH (nằm ngoài content-frame) */}
        <Navbar token={token} isAdmin={isAdmin} logout={logout} user={user} />
        
        {/* ✅ NỘI DUNG CHÍNH - CÓ KHUNG (wrap trong content-frame) */}
        <div className="content-frame">
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home token={token} />} />
              <Route path="/login" element={!token ? <Login setToken={setToken} setUser={setUser} /> : <Navigate to="/" />} />
              <Route path="/register" element={!token ? <Register setToken={setToken} setUser={setUser} /> : <Navigate to="/" />} />
              <Route path="/book/:id" element={<BookDetail token={token} />} />
              <Route path="/cart" element={token ? <Cart token={token} /> : <Navigate to="/login" />} />
              <Route path="/checkout" element={token ? <Checkout token={token} /> : <Navigate to="/login" />} />
              <Route path="/orders" element={token ? <Orders token={token} /> : <Navigate to="/login" />} />
              <Route path="/profile" element={token ? <Profile token={token} /> : <Navigate to="/login" />} />
              <Route path="/search" element={<SearchResults token={token} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
        
        {/* ✅ FOOTER - FULL WIDTH (nằm ngoài content-frame) */}
        <footer style={{ 
          backgroundColor: '#2c5f58', 
          color: 'white', 
          padding: '50px 0 20px',
          width: '100%',
          marginTop: 'auto'
        }}>
          <div className="container">
            <div className="row">
              <div className="col-lg-4 col-md-6 mb-4">
                <h4 className="fw-bold mb-3" style={{ color: '#5cbdb0' }}>
                  <i className="bi bi-book me-2"></i>Bookstore
                </h4>
                <p style={{ color: '#e0e0e0', lineHeight: '1.8' }}>
                  Nhà sách trực tuyến uy tín, cung cấp đa dạng các đầu sách chất lượng với giá cả phải chăng.
                </p>
                <div className="d-flex gap-3 mt-3">
                  <a href="#" className="text-decoration-none" style={{ color: '#5cbdb0', fontSize: '20px' }}>
                    <i className="bi bi-facebook"></i>
                  </a>
                  <a href="#" className="text-decoration-none" style={{ color: '#5cbdb0', fontSize: '20px' }}>
                    <i className="bi bi-instagram"></i>
                  </a>
                  <a href="#" className="text-decoration-none" style={{ color: '#5cbdb0', fontSize: '20px' }}>
                    <i className="bi bi-twitter"></i>
                  </a>
                  <a href="#" className="text-decoration-none" style={{ color: '#5cbdb0', fontSize: '20px' }}>
                    <i className="bi bi-youtube"></i>
                  </a>
                </div>
              </div>
              
              <div className="col-lg-2 col-md-6 mb-4">
                <h5 className="fw-bold mb-3" style={{ color: '#5cbdb0' }}>Dịch vụ</h5>
                <ul className="list-unstyled" style={{ lineHeight: '2' }}>
                  <li><a href="#" className="text-decoration-none" style={{ color: '#e0e0e0' }}>Điều khoản sử dụng</a></li>
                  <li><a href="#" className="text-decoration-none" style={{ color: '#e0e0e0' }}>Chính sách bảo mật</a></li>
                  <li><a href="#" className="text-decoration-none" style={{ color: '#e0e0e0' }}>Chính sách đổi trả</a></li>
                  <li><a href="#" className="text-decoration-none" style={{ color: '#e0e0e0' }}>Hướng dẫn đặt hàng</a></li>
                </ul>
              </div>

              <div className="col-lg-3 col-md-6 mb-4">
                <h5 className="fw-bold mb-3" style={{ color: '#5cbdb0' }}>Hỗ trợ</h5>
                <ul className="list-unstyled" style={{ lineHeight: '2' }}>
                  <li><i className="bi bi-geo-alt me-2" style={{ color: '#5cbdb0' }}></i>69/68 Đ. Đặng Thuỳ Trâm, An Nhơn, Hồ Chí Minh</li>
                  <li><i className="bi bi-envelope me-2" style={{ color: '#5cbdb0' }}></i>support@bookstore.com</li>
                  <li><i className="bi bi-telephone me-2" style={{ color: '#5cbdb0' }}></i>0123456789</li>
                  <li><i className="bi bi-clock me-2" style={{ color: '#5cbdb0' }}></i>8:00 - 21:00</li>
                </ul>
              </div>

              <div className="col-lg-3 col-md-6 mb-4">
                <h5 className="fw-bold mb-3" style={{ color: '#5cbdb0' }}>Theo dõi chúng tôi</h5>
                <p style={{ color: '#e0e0e0', lineHeight: '1.8' }}>
                  Nhận thông tin về sách mới và ưu đãi đặc biệt!
                </p>
                <div className="d-flex gap-2 mt-3">
                  <a href="#" className="text-decoration-none" style={{ color: '#5cbdb0', fontSize: '24px' }}>
                    <i className="bi bi-facebook"></i>
                  </a>
                  <a href="#" className="text-decoration-none" style={{ color: '#5cbdb0', fontSize: '24px' }}>
                    <i className="bi bi-instagram"></i>
                  </a>
                  <a href="#" className="text-decoration-none" style={{ color: '#5cbdb0', fontSize: '24px' }}>
                    <i className="bi bi-tiktok"></i>
                  </a>
                </div>
              </div>
            </div>
            
            <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
            
            <div className="text-center" style={{ color: '#e0e0e0' }}>
              <p className="mb-0">
                © 2026 Bookstore. All rights reserved. | Designed with <i className="bi bi-heart-fill text-danger"></i> by Bookstore Team
              </p>
            </div>
          </div>
        </footer>
      </Router>
    </ToastProvider>
  )
}

export default App