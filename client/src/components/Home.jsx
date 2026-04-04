import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

export default function Home({ token }) {
  const [books, setBooks] = useState([])
  const [newBooks, setNewBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  
  const { showToast } = useToast()
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [categories, setCategories] = useState([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  const categoryDropdownRef = useRef(null)
  const sortDropdownRef = useRef(null)

  // Lấy danh mục
  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books/categories')
      setCategories(res.data || [])
    } catch (err) {
      console.error('Lỗi khi lấy danh mục:', err)
    }
  }

  // Lấy sách có phân trang và lọc
  const fetchBooks = async (page = 1) => {
    setLoading(true)
    try {
      let url = `http://localhost:5000/api/books?page=${page}&limit=20`
      
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`
      }
      
      if (sortBy === 'price_asc') {
        url += `&sort=price&order=asc`
      } else if (sortBy === 'price_desc') {
        url += `&sort=price&order=desc`
      } else if (sortBy === 'name_asc') {
        url += `&sort=title&order=asc`
      }
      
      const res = await axios.get(url)
      setBooks(res.data.books || [])
      setCurrentPage(res.data.currentPage || 1)
      setTotalPages(res.data.totalPages || 1)
      setLoading(false)
    } catch (err) {
      setError('Lỗi tải dữ liệu từ server.')
      setLoading(false)
    }
  }

  // Lấy sách mới về (9 cuốn mới nhất)
  const fetchNewBooks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books?limit=9&sortBy=createdAt&order=desc')
      setNewBooks(res.data.books || [])
    } catch (err) {
      console.error('Lỗi khi lấy sách mới:', err)
    }
  }

  useEffect(() => {
    fetchBooks(currentPage)
    fetchNewBooks()
    fetchCategories()
  }, [currentPage, selectedCategory, sortBy])

  // Auto slide
  useEffect(() => {
    if (newBooks.length <= 4) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(newBooks.length - 3, 1))
    }, 2500)

    return () => clearInterval(interval)
  }, [newBooks.length])

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(newBooks.length - 3, 1)) % Math.max(newBooks.length - 3, 1))
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(newBooks.length - 3, 1))
  }

  const addToCart = (book) => {
    if (!token) {
      showToast('Bạn cần đăng nhập để thêm vào giỏ hàng!', 'warning')
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
    showToast(`Đã thêm "${book.title}" vào giỏ hàng!`, 'success')
  }

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCategoryLabel = () => {
    if (selectedCategory === 'all') return 'Tất cả danh mục'
    const category = categories.find(c => c._id === selectedCategory)
    return category ? category.name : 'Chọn danh mục'
  }

  const getSortLabel = () => {
    const options = {
      'default': 'Mặc định',
      'price_asc': 'Giá: Thấp → Cao',
      'price_desc': 'Giá: Cao → Thấp',
      'name_asc': 'Tên: A → Z'
    }
    return options[sortBy] || 'Mặc định'
  }

  if (loading) return <div className="text-center mt-5">Đang tải...</div>
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>

  return (
    <div>
      {/* Section Sách mới về */}
      {newBooks.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-4 fw-bold" style={{ color: '#5cbdb0' }}>
            <i className="bi bi-stars me-2"></i>Sách mới về
          </h3>
          
          <div className="bg-white rounded shadow-lg p-4 position-relative" style={{ borderRadius: '15px' }}>
            <button 
              onClick={prevSlide}
              className="btn position-absolute top-50 start-0 translate-middle-y rounded-circle shadow"
              style={{
                width: '45px',
                height: '45px',
                backgroundColor: '#5cbdb0',
                color: 'white',
                zIndex: 10,
                left: '-20px'
              }}
            >
              {'<'}
            </button>

            <button 
              onClick={nextSlide}
              className="btn position-absolute top-50 end-0 translate-middle-y rounded-circle shadow"
              style={{
                width: '45px',
                height: '45px',
                backgroundColor: '#5cbdb0',
                color: 'white',
                zIndex: 10,
                right: '-20px'
              }}
            >
              {'>'}
            </button>
            
            <div className="position-relative overflow-hidden" style={{ padding: '0 30px' }}>
              <div 
                className="d-flex"
                style={{
                  transform: `translateX(-${currentSlide * 25}%)`,
                  transition: 'transform 0.5s ease-in-out'
                }}
              >
                {newBooks.map((book) => (
                  <div className="col-3 pe-3" key={book._id} style={{ minWidth: '25%' }}>
                    {/* ✅ Toàn bộ card clickable */}
                    <div 
                      className="card h-100 border-0 shadow-sm hover-shadow" 
                      style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => window.location.href = `/book/${book._id}`}
                    >
                      <div style={{ height: '280px', overflow: 'hidden' }}>
                        <img 
                          src={`http://localhost:5000/uploads/${book.image || 'default-book.jpg'}`} 
                          className="card-img-top w-100 h-100"
                          alt={book.title} 
                          style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        />
                      </div>
                      <div className="card-body d-flex flex-column text-center p-3">
                        <h6 className="card-title mb-2" style={{ fontSize: '14px', height: '40px', overflow: 'hidden', fontWeight: '600' }}>
                          {book.title}
                        </h6>
                        <p className="card-text text-muted small mb-2">
                          <i className="bi bi-person me-1"></i>{book.author}
                        </p>
                        <p className="card-text fw-bold text-success mt-auto" style={{ fontSize: '1.1rem' }}>
                          {book.price.toLocaleString('vi-VN')} ₫
                        </p>
                        <div className="d-flex gap-2 mt-2">
                          <Link 
                            to={`/book/${book._id}`} 
                            className="btn btn-sm flex-grow-1 fw-bold" 
                            style={{ backgroundColor: '#5cbdb0', color: 'white', fontSize: '12px', borderRadius: '8px' }}
                            onClick={(e) => e.stopPropagation()} // ✅ Stop propagation để không trigger card click
                          >
                            <i className="bi bi-eye me-1"></i>Chi tiết
                          </Link>
                          <button 
                            className="btn btn-sm flex-grow-1 fw-bold" 
                            style={{ backgroundColor: '#28a745', color: 'white', fontSize: '12px', borderRadius: '8px' }}
                            onClick={(e) => {
                              e.stopPropagation() // ✅ Stop propagation để không trigger card click
                              addToCart(book)
                            }}
                          >
                            <i className="bi bi-cart-plus me-1"></i>Thêm giỏ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {newBooks.length > 4 && (
              <div className="d-flex justify-content-center mt-3 gap-2">
                {[...Array(Math.max(newBooks.length - 3, 1))].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className="btn rounded-circle p-0"
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: currentSlide === idx ? '#5cbdb0' : '#ddd',
                      transition: 'background-color 0.3s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Danh sách sách */}
      <div className="row justify-content-center mb-5">
        <div className="col-12 col-lg-11">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold" style={{ color: '#5cbdb0' }}>
              <i className="bi bi-collection me-2"></i>Danh sách sách
            </h2>
            
            <div className="d-flex gap-2 flex-wrap">
              <div className="position-relative" style={{ width: '200px' }} ref={categoryDropdownRef}>
                <div 
                  className="form-select"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  style={{ 
                    cursor: 'pointer',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '10px 35px 10px 15px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: showCategoryDropdown ? '0 4px 8px rgba(92,189,176,0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s',
                    backgroundColor: 'white',
                    borderColor: showCategoryDropdown ? '#5cbdb0' : '#dee2e6'
                  }}
                >
                  {getCategoryLabel()}
                </div>

                {showCategoryDropdown && (
                  <div 
                    className="position-absolute w-100 bg-white border shadow-sm rounded mt-1" 
                    style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto',
                      zIndex: 1000,
                      borderRadius: '8px',
                      border: '1px solid #5cbdb0'
                    }}
                  >
                    <div 
                      className="px-3 py-2"
                      onClick={() => {
                        setSelectedCategory('all')
                        setShowCategoryDropdown(false)
                        setCurrentPage(1)
                      }}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedCategory === 'all' ? '#5cbdb0' : 'transparent',
                        color: selectedCategory === 'all' ? 'white' : 'inherit',
                        transition: 'all 0.2s'
                      }}
                    >
                      Tất cả danh mục
                    </div>
                    {categories.map(cat => (
                      <div 
                        key={cat._id}
                        className="px-3 py-2"
                        onClick={() => {
                          setSelectedCategory(cat._id)
                          setShowCategoryDropdown(false)
                          setCurrentPage(1)
                        }}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: selectedCategory === cat._id ? '#5cbdb0' : 'transparent',
                          color: selectedCategory === cat._id ? 'white' : 'inherit',
                          transition: 'all 0.2s',
                          borderTop: '1px solid #f8f9fa'
                        }}
                      >
                        {cat.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="position-relative" style={{ width: '200px' }} ref={sortDropdownRef}>
                <div 
                  className="form-select"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  style={{ 
                    cursor: 'pointer',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '10px 35px 10px 15px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: showSortDropdown ? '0 4px 8px rgba(92,189,176,0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s',
                    backgroundColor: 'white',
                    borderColor: showSortDropdown ? '#5cbdb0' : '#dee2e6'
                  }}
                >
                  {getSortLabel()}
                </div>

                {showSortDropdown && (
                  <div 
                    className="position-absolute w-100 bg-white border shadow-sm rounded mt-1" 
                    style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto',
                      zIndex: 1000,
                      borderRadius: '8px',
                      border: '1px solid #5cbdb0'
                    }}
                  >
                    {['default', 'price_asc', 'price_desc', 'name_asc'].map((sortOption, index) => {
                      const labels = {
                        'default': 'Mặc định',
                        'price_asc': 'Giá: Thấp → Cao',
                        'price_desc': 'Giá: Cao → Thấp',
                        'name_asc': 'Tên: A → Z'
                      }
                      return (
                        <div 
                          key={sortOption}
                          className="px-3 py-2"
                          onClick={() => {
                            setSortBy(sortOption)
                            setShowSortDropdown(false)
                            setCurrentPage(1)
                          }}
                          style={{ 
                            cursor: 'pointer',
                            backgroundColor: sortBy === sortOption ? '#5cbdb0' : 'transparent',
                            color: sortBy === sortOption ? 'white' : 'inherit',
                            transition: 'all 0.2s',
                            borderTop: index > 0 ? '1px solid #f8f9fa' : 'none'
                          }}
                        >
                          {labels[sortOption]}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow-lg p-4 p-md-5" style={{ borderRadius: '15px' }}>
            <div className="row g-4">
              {books.map(book => (
                <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={book._id}>
                  {/* ✅ Toàn bộ card clickable */}
                  <div 
                    className="card h-100 border-0 shadow-sm hover-shadow" 
                    style={{ borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.3s', cursor: 'pointer' }}
                    onClick={() => window.location.href = `/book/${book._id}`}
                  >
                    <div style={{ height: '280px', overflow: 'hidden' }}>
                      <img 
                        src={`http://localhost:5000/uploads/${book.image || 'default-book.jpg'}`} 
                        className="card-img-top w-100 h-100"
                        alt={book.title} 
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="card-body d-flex flex-column text-center p-3">
                      <h5 className="card-title mb-2" style={{ fontWeight: '600', fontSize: '15px' }}>{book.title}</h5>
                      <p className="card-text text-muted mb-2">
                        <i className="bi bi-person me-1"></i>{book.author}
                      </p>
                      <p className="card-text fw-bold text-success mt-auto" style={{ fontSize: '1.1rem' }}>
                        {book.price.toLocaleString('vi-VN')} ₫
                      </p>
                      <div className="d-flex gap-2 mt-3">
                        <Link 
                          to={`/book/${book._id}`} 
                          className="btn flex-grow-1 fw-bold" 
                          style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '8px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="bi bi-eye me-1"></i>Chi tiết
                        </Link>
                        <button 
                          className="btn flex-grow-1 fw-bold" 
                          style={{ backgroundColor: '#28a745', color: 'white', borderRadius: '8px' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(book)
                          }}
                        >
                          <i className="bi bi-cart-plus me-1"></i>Thêm giỏ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-end mt-5">
                <nav>
                  <ul className="pagination pagination-lg">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => {
                          setCurrentPage(currentPage - 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        style={{ 
                          color: '#5cbdb0',
                          borderColor: '#dee2e6',
                          borderRadius: '8px',
                          margin: '0 2px',
                          padding: '10px 16px'
                        }}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => {
                            setCurrentPage(i + 1)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          style={{ 
                            color: currentPage === i + 1 ? 'white' : '#5cbdb0',
                            backgroundColor: currentPage === i + 1 ? '#5cbdb0' : 'white',
                            borderColor: '#dee2e6',
                            borderRadius: '8px',
                            margin: '0 2px',
                            padding: '10px 16px',
                            fontWeight: currentPage === i + 1 ? 'bold' : 'normal'
                          }}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => {
                          setCurrentPage(currentPage + 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        style={{ 
                          color: '#5cbdb0',
                          borderColor: '#dee2e6',
                          borderRadius: '8px',
                          margin: '0 2px',
                          padding: '10px 16px'
                        }}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#2c5f58', 
        color: 'white', 
        marginTop: '60px',
        padding: '50px 0 20px',
        width: '100%'
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
                <li><Link to="/" className="text-decoration-none" style={{ color: '#e0e0e0' }}>Điều khoản sử dụng</Link></li>
                <li><Link to="/" className="text-decoration-none" style={{ color: '#e0e0e0' }}>Chính sách bảo mật</Link></li>
                <li><Link to="/" className="text-decoration-none" style={{ color: '#e0e0e0' }}>Chính sách đổi trả</Link></li>
                <li><Link to="/" className="text-decoration-none" style={{ color: '#e0e0e0' }}>Hướng dẫn đặt hàng</Link></li>
              </ul>
            </div>

            <div className="col-lg-3 col-md-6 mb-4">
              <h5 className="fw-bold mb-3" style={{ color: '#5cbdb0' }}>Hỗ trợ</h5>
              <ul className="list-unstyled" style={{ lineHeight: '2' }}>
                <li><i className="bi bi-geo-alt me-2" style={{ color: '#5cbdb0' }}></i>69/68 Đặng Thùy Trâm, Phường 13, Quận Bình Thạnh, TP.HCM</li>
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
              © 2026 Bookstore. All rights reserved. | Designed by Bookstore Team
            </p>
          </div>
        </div>
      </footer>

      {/* Nút Back to Top */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="btn position-fixed"
          style={{
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            backgroundColor: '#5cbdb0',
            color: 'white',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 999,
            transition: 'all 0.3s',
            border: 'none',
            fontSize: '20px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#4aa8a0'
            e.target.style.transform = 'translateY(-5px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#5cbdb0'
            e.target.style.transform = 'translateY(0)'
          }}
          title="Đầu trang"
        >
          <i className="bi bi-arrow-up"></i>
        </button>
      )}
    </div>
  )
}