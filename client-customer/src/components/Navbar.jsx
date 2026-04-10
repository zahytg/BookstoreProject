import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function Navbar({ token, isAdmin, logout, user }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const accountDropdownRef = useRef(null)

  // Load danh mục
  useEffect(() => {
    axios.get('http://localhost:5000/api/books/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('Lỗi load danh mục navbar:', err))
  }, [])

  // ✅ Theo dõi giỏ hàng từ localStorage
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
      setCartCount(totalItems)
    }

    updateCartCount()

    const handleStorageChange = () => {
      updateCartCount()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cartUpdated', updateCartCount)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const suggestRandomBook = () => {
    axios.get('http://localhost:5000/api/books?limit=100')
      .then(res => {
        const books = res.data.books || res.data
        if (!Array.isArray(books) || books.length === 0) {
          alert('Hiện chưa có sách nào để gợi ý!')
          return
        }
        const randomIndex = Math.floor(Math.random() * books.length)
        const randomBook = books[randomIndex]
        navigate(`/book/${randomBook._id}`)
      })
      .catch((err) => {
        console.error(err)
        alert('Lỗi tải sách ngẫu nhiên')
      })
  }

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#a2d9ce' }}>
      <div className="container-fluid">
        {/* Logo bên trái */}
        <Link 
          className="navbar-brand d-flex align-items-center text-white" 
          to="/"
          style={{ textDecoration: 'none' }}
        >
          <i className="bi bi-book me-3" style={{ fontSize: '2.5rem', color: 'white' }}></i>
          <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
            Bookstore
          </span>
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bsTarget="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Giữa: Ô tìm kiếm */}
          <form 
            className="d-flex mx-auto" 
            onSubmit={handleSearch} 
            style={{ maxWidth: '500px', width: '100%' }}
          >
            <input
              className="form-control me-2"
              type="search"
              placeholder="Tìm sách, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
            />
            <button className="btn btn-outline-light" type="submit">
              <i className="bi bi-search"></i>
            </button>
          </form>

          {/* Bên phải */}
          <ul className="navbar-nav ms-auto">
            {/* Sách gợi ý */}
            <li className="nav-item">
              <button className="nav-link text-white fw-medium btn btn-link" onClick={suggestRandomBook}>
                <i className="bi bi-lightbulb me-1"></i>Sách gợi ý
              </button>
            </li>

            {/* ✅ GIỎ HÀNG VỚI BADGE - STYLE ĐẸP HƠN */}
            <li className="nav-item position-relative">
              <Link 
                className="nav-link text-white fw-medium" 
                to="/cart"
                style={{ position: 'relative' }}
              >
                <i className="bi bi-cart me-1"></i>
                Giỏ hàng
                
                {/* ✅ Badge đỏ - Style đẹp hơn */}
                {cartCount > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                    style={{ 
                      backgroundColor: '#dc3545',
                      fontSize: '10px',
                      padding: '3px 6px',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      animation: 'bounce 0.3s ease',
                      border: '2px solid #a2d9ce',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </li>

            {/* Đơn hàng */}
            <li className="nav-item">
              <Link className="nav-link text-white fw-medium" to="/orders">
                <i className="bi bi-receipt-cutoff me-1"></i>Đơn hàng
              </Link>
            </li>

            {/* === PHẦN TÀI KHOẢN === */}
            {token && (
              <li 
                className="nav-item dropdown position-relative"
                ref={accountDropdownRef}
              >
                <button 
                  className="nav-link text-white fw-medium dropdown-toggle" 
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  aria-expanded={showAccountDropdown}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {isAdmin ? 'Xin chào, Admin' : `Xin chào, ${user?.name || 'User'}`}
                </button>
                
                {showAccountDropdown && (
                  <ul 
                    className="dropdown-menu dropdown-menu-end show"
                    style={{ 
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      minWidth: '200px',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: 'none',
                      marginTop: '5px',
                      zIndex: 1000
                    }}
                  >
                    {!isAdmin && (
                      <li>
                        <Link 
                          className="dropdown-item d-flex align-items-center py-2" 
                          to="/profile"
                          onClick={() => setShowAccountDropdown(false)}
                        >
                          <i className="bi bi-person me-2"></i>Hồ sơ
                        </Link>
                      </li>
                    )}
                    
                    <li><hr className="dropdown-divider" /></li>
                    
                    <li>
                      <button 
                        className="dropdown-item d-flex align-items-center py-2 text-danger"
                        onClick={() => {
                          setShowAccountDropdown(false)
                          logout()
                        }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            )}

            {!token && (
              <li className="nav-item">
                <Link className="nav-link text-white fw-medium" to="/login">
                  <i className="bi bi-box-arrow-in-right me-1"></i>Đăng nhập
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}