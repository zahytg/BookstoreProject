import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

export default function Home({ token }) {
  const [books, setBooks] = useState([])
  const [newBooks, setNewBooks] = useState([])
  const [bestSellingBooks, setBestSellingBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [currentSlideNew, setCurrentSlideNew] = useState(0)
  const [currentSlideBest, setCurrentSlideBest] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const { showToast } = useToast()

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [categories, setCategories] = useState([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const categoryDropdownRef = useRef(null)
  const sortDropdownRef = useRef(null)

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books/categories')
      setCategories(res.data || [])
    } catch (err) {
      console.error('Lỗi khi lấy danh mục:', err)
    }
  }

  const fetchBooks = async (page = 1) => {
    setLoading(true)
    try {
      let url = `http://localhost:5000/api/books/in-stock?page=${page}&limit=20`
      
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`
      }
      
      // ✅ SỬA LẠI SORTING CHO ĐÚNG VỚI BACKEND
      if (sortBy === 'price_asc') {
        url += `&sortBy=price&order=asc`
      } else if (sortBy === 'price_desc') {
        url += `&sortBy=price&order=desc`
      } else if (sortBy === 'name_asc') {
        url += `&sortBy=title&order=asc`
      } else {
        url += `&sortBy=createdAt&order=desc`
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

  const fetchNewBooks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books?limit=9&sortBy=createdAt&order=desc')
      setNewBooks(res.data.books || [])
    } catch (err) {
      console.error('Lỗi khi lấy sách mới:', err)
    }
  }

  const fetchBestSellingBooks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books/best-selling?limit=9')
      setBestSellingBooks(res.data || [])
    } catch (err) {
      console.error('Lỗi khi lấy sách bán chạy:', err)
    }
  }

  useEffect(() => {
    fetchBooks(currentPage)
    fetchNewBooks()
    fetchBestSellingBooks()
    fetchCategories()
  }, [currentPage, selectedCategory, sortBy])

  useEffect(() => {
    if (newBooks.length <= 4) return
    
    const interval = setInterval(() => {
      setCurrentSlideNew((prev) => (prev + 1) % Math.max(newBooks.length - 3, 1))
    }, 2500)

    return () => clearInterval(interval)
  }, [newBooks.length])

  useEffect(() => {
    if (bestSellingBooks.length <= 4) return
    
    const interval = setInterval(() => {
      setCurrentSlideBest((prev) => (prev + 1) % Math.max(bestSellingBooks.length - 3, 1))
    }, 2500)

    return () => clearInterval(interval)
  }, [bestSellingBooks.length])

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

  const prevSlideNew = () => {
    setCurrentSlideNew((prev) => (prev - 1 + Math.max(newBooks.length - 3, 1)) % Math.max(newBooks.length - 3, 1))
  }

  const nextSlideNew = () => {
    setCurrentSlideNew((prev) => (prev + 1) % Math.max(newBooks.length - 3, 1))
  }

  const prevSlideBest = () => {
    setCurrentSlideBest((prev) => (prev - 1 + Math.max(bestSellingBooks.length - 3, 1)) % Math.max(bestSellingBooks.length - 3, 1))
  }

  const nextSlideBest = () => {
    setCurrentSlideBest((prev) => (prev + 1) % Math.max(bestSellingBooks.length - 3, 1))
  }

  const addToCart = (book) => {
    if (!token) {
      showToast('Bạn cần đăng nhập để thêm vào giỏ hàng!', 'warning')
      return
    }
    if (book.stock <= 0) {
      showToast('Sách này đã hết hàng!', 'error')
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
    window.dispatchEvent(new Event('cartUpdated'))
    showToast(`Đã thêm "${book.title}" vào giỏ hàng!`, 'success')
  }

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
      'default': 'Mới nhất',
      'price_asc': 'Giá: Thấp → Cao',
      'price_desc': 'Giá: Cao → Thấp',
      'name_asc': 'Tên: A → Z'
    }
    return options[sortBy] || 'Mới nhất'
  }

  if (loading) return <div className="text-center mt-5">Đang tải...</div>
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>

  return (
    <div>
      {newBooks.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-4 fw-bold text-center" style={{ color: '#5cbdb0' }}>
            <i className="bi bi-stars me-2"></i>Sách mới về
          </h3>
          
          <div className="bg-white rounded shadow-lg p-4 position-relative" style={{ borderRadius: '15px' }}>
            <button 
              onClick={prevSlideNew}
              className="btn position-absolute top-50 start-0 translate-middle-y rounded-circle shadow"
              style={{
                width: '45px',
                height: '45px',
                backgroundColor: '#5cbdb0',
                color: 'white',
                zIndex: 10,
                left: '-20px',
                border: '2px solid white',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#4aa8a0'
                e.target.style.transform = 'translate(-20px, -50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#5cbdb0'
                e.target.style.transform = 'translate(-20px, -50%) scale(1)'
              }}
            >
              <i className="bi bi-chevron-left" style={{ fontSize: '18px' }}></i>
            </button>

            <button 
              onClick={nextSlideNew}
              className="btn position-absolute top-50 end-0 translate-middle-y rounded-circle shadow"
              style={{
                width: '45px',
                height: '45px',
                backgroundColor: '#5cbdb0',
                color: 'white',
                zIndex: 10,
                right: '-20px',
                border: '2px solid white',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#4aa8a0'
                e.target.style.transform = 'translate(20px, -50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#5cbdb0'
                e.target.style.transform = 'translate(20px, -50%) scale(1)'
              }}
            >
              <i className="bi bi-chevron-right" style={{ fontSize: '18px' }}></i>
            </button>
            
            <div className="position-relative overflow-hidden" style={{ padding: '0 30px' }}>
              <div 
                className="d-flex"
                style={{
                  transform: `translateX(-${currentSlideNew * 25}%)`,
                  transition: 'transform 0.5s ease-in-out'
                }}
              >
                {newBooks.map((book) => (
                  <div className="col-3 pe-3" key={book._id} style={{ minWidth: '25%' }}>
                    <div 
                      className="card h-100 border-0 shadow-sm hover-shadow" 
                      style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s' }}
                      onClick={() => window.location.href = `/book/${book._id}`}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
                            style={{ backgroundColor: '#5cbdb0', color: 'white', fontSize: '11px', borderRadius: '6px', padding: '6px 8px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="bi bi-eye me-1"></i>Chi tiết
                          </Link>
                          <button 
                            className="btn btn-sm flex-grow-1 fw-bold" 
                            style={{ backgroundColor: '#28a745', color: 'white', fontSize: '11px', borderRadius: '6px', padding: '6px 8px' }}
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
            </div>

            {newBooks.length > 4 && (
              <div className="d-flex justify-content-center mt-3 gap-2">
                {[...Array(Math.max(newBooks.length - 3, 1))].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideNew(idx)}
                    className="btn rounded-circle p-0"
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: currentSlideNew === idx ? '#5cbdb0' : '#ddd',
                      transition: 'background-color 0.3s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {bestSellingBooks.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-4 fw-bold text-center" style={{ color: '#5cbdb0' }}>
            <i className="bi bi-trophy me-2"></i>Sản phẩm bán chạy
          </h3>
          
          <div className="bg-white rounded shadow-lg p-4 position-relative" style={{ borderRadius: '15px' }}>
            <button 
              onClick={prevSlideBest}
              className="btn position-absolute top-50 start-0 translate-middle-y rounded-circle shadow"
              style={{
                width: '45px',
                height: '45px',
                backgroundColor: '#5cbdb0',
                color: 'white',
                zIndex: 10,
                left: '-20px',
                border: '2px solid white',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#4aa8a0'
                e.target.style.transform = 'translate(-20px, -50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#5cbdb0'
                e.target.style.transform = 'translate(-20px, -50%) scale(1)'
              }}
            >
              <i className="bi bi-chevron-left" style={{ fontSize: '18px' }}></i>
            </button>

            <button 
              onClick={nextSlideBest}
              className="btn position-absolute top-50 end-0 translate-middle-y rounded-circle shadow"
              style={{
                width: '45px',
                height: '45px',
                backgroundColor: '#5cbdb0',
                color: 'white',
                zIndex: 10,
                right: '-20px',
                border: '2px solid white',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#4aa8a0'
                e.target.style.transform = 'translate(20px, -50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#5cbdb0'
                e.target.style.transform = 'translate(20px, -50%) scale(1)'
              }}
            >
              <i className="bi bi-chevron-right" style={{ fontSize: '18px' }}></i>
            </button>
            
            <div className="position-relative overflow-hidden" style={{ padding: '0 30px' }}>
              <div 
                className="d-flex"
                style={{
                  transform: `translateX(-${currentSlideBest * 25}%)`,
                  transition: 'transform 0.5s ease-in-out'
                }}
              >
                {bestSellingBooks.map((book, index) => (
                  <div className="col-3 pe-3" key={book._id} style={{ minWidth: '25%' }}>
                    <div 
                      className="card h-100 border-0 shadow-sm hover-shadow" 
                      style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s' }}
                      onClick={() => window.location.href = `/book/${book._id}`}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ height: '280px', overflow: 'hidden', position: 'relative' }}>
                        <div 
                          className="position-absolute"
                          style={{
                            top: '10px',
                            left: '10px',
                            width: '35px',
                            height: '35px',
                            backgroundColor: index === 0 ? '#ffc107' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#5cbdb0',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: index < 3 ? '#333' : 'white',
                            fontSize: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            zIndex: 5
                          }}
                        >
                          {index + 1}
                        </div>
                        
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
                            style={{ backgroundColor: '#5cbdb0', color: 'white', fontSize: '11px', borderRadius: '6px', padding: '6px 8px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="bi bi-eye me-1"></i>Chi tiết
                          </Link>
                          <button 
                            className="btn btn-sm flex-grow-1 fw-bold" 
                            style={{ backgroundColor: '#28a745', color: 'white', fontSize: '11px', borderRadius: '6px', padding: '6px 8px' }}
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
            </div>

            {bestSellingBooks.length > 4 && (
              <div className="d-flex justify-content-center mt-3 gap-2">
                {[...Array(Math.max(bestSellingBooks.length - 3, 1))].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideBest(idx)}
                    className="btn rounded-circle p-0"
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: currentSlideBest === idx ? '#5cbdb0' : '#ddd',
                      transition: 'background-color 0.3s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 fw-bold" style={{ color: '#5cbdb0' }}>
            <i className="bi bi-collection me-2"></i>Danh sách sản phẩm
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
                      'default': 'Mới nhất',
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
                <div 
                  className="card h-100 border-0 shadow-sm hover-shadow" 
                  style={{ borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.3s', cursor: 'pointer' }}
                  onClick={() => window.location.href = `/book/${book._id}`}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
                    <div className="d-flex gap-2 mt-2">
                      <Link 
                        to={`/book/${book._id}`} 
                        className="btn btn-sm flex-grow-1 fw-bold" 
                        style={{ backgroundColor: '#5cbdb0', color: 'white', fontSize: '11px', borderRadius: '6px', padding: '6px 8px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="bi bi-eye me-1"></i>Chi tiết
                      </Link>
                      <button 
                        className="btn btn-sm flex-grow-1 fw-bold" 
                        style={{ backgroundColor: '#28a745', color: 'white', fontSize: '11px', borderRadius: '6px', padding: '6px 8px' }}
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