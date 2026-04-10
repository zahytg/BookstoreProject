import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Profile({ token }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  // ✅ Chỉ còn 2 vouchers
  const vouchers = [
    {
      code: 'WELCOME10',
      discount: '10%',
      minOrder: '0đ',
      expiry: '2026-12-31',
      description: 'Giảm 10% cho đơn hàng đầu tiên',
      status: 'active'
    },
    {
      code: 'SAVE50K',
      discount: '50.000đ',
      minOrder: '500.000đ',
      expiry: '2026-08-31',
      description: 'Giảm 50.000đ cho đơn từ 500k',
      status: 'active'
    }
  ]

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchUserProfile()
    fetchUserOrders()
    fetchFavorites()
    
    // ✅ Lắng nghe sự kiện thay đổi favorites từ BookDetail
    const handleFavoritesChange = () => {
      fetchFavorites()
    }
    
    window.addEventListener('favoritesChanged', handleFavoritesChange)
    
    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChange)
    }
  }, [token])

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data)
      setFormData({
        ...formData,
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || ''
      })
      setLoading(false)
    } catch (err) {
      console.error('Lỗi tải thông tin:', err)
      setLoading(false)
    }
  }

  const fetchUserOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(res.data)
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err)
    }
  }

  const fetchFavorites = () => {
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setFavorites(savedFavorites)
  }

  const removeFromFavorites = (bookId) => {
    const updated = favorites.filter(fav => fav._id !== bookId)
    setFavorites(updated)
    localStorage.setItem('favorites', JSON.stringify(updated))
    
    // ✅ Thông báo cho các component khác
    window.dispatchEvent(new Event('favoritesChanged'))
    
    alert('Đã xóa khỏi danh sách yêu thích')
  }

  // ✅ TÍNH TOÁN STATISTICS
  const currentYear = new Date().getFullYear()
  const ordersThisYear = orders.filter(order =>
    new Date(order.createdAt).getFullYear() === currentYear
  )
  
  const totalOrders = ordersThisYear.length
  
  // ✅ Tính tổng tiền đã thanh toán (chỉ tính đơn delivered hoặc online)
  const totalPaid = ordersThisYear
    .filter(order => order.status === 'delivered' || order.paymentMethod === 'online')
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0)

  // ✅ Tính số đơn chưa thanh toán (COD và chưa delivered)
  const unpaidOrders = ordersThisYear.filter(order => 
    order.paymentMethod === 'cod' && order.status !== 'delivered'
  ).length

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      }

      await axios.put('http://localhost:5000/api/auth/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' })
      setEditMode(false)
      fetchUserProfile()
    } catch (err) {
      setMessage({ type: 'danger', text: 'Cập nhật thất bại: ' + (err.response?.data?.msg || 'Lỗi server') })
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'danger', text: 'Mật khẩu mới không khớp' })
      return
    }
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'Mật khẩu phải có ít nhất 6 ký tự' })
      return
    }

    try {
      await axios.put('http://localhost:5000/api/auth/change-password', 
        { 
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' })
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setMessage({ type: 'danger', text: 'Đổi mật khẩu thất bại: ' + (err.response?.data?.msg || 'Lỗi server') })
    }
  }

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#5cbdb0', width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
      <p className="mt-3 text-muted">Đang tải thông tin...</p>
    </div>
  )

  return (
    <div className="container mt-5 mb-5">
      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm border-0`} role="alert" style={{ borderRadius: '10px' }}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 mb-4">
          {/* Profile Card */}
          <div className="card shadow-sm border-0 text-center mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
            <div className="card-body p-4" style={{ background: 'linear-gradient(135deg, #5cbdb0 0%, #4aa8a0 100%)' }}>
              <div className="mb-3">
                <div className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center shadow" 
                  style={{ width: '100px', height: '100px' }}>
                  <i className="bi bi-person" style={{ fontSize: '3rem', color: '#5cbdb0' }}></i>
                </div>
              </div>
              <h5 className="fw-bold mb-1 text-white">{user?.name || 'Người dùng'}</h5>
              <p className="text-white-50 mb-0" style={{ fontSize: '14px' }}>{user?.email}</p>
            </div>
          </div>

          {/* Menu Tabs */}
          <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
            <div className="list-group list-group-flush">
              <button 
                className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
                style={{ 
                  backgroundColor: activeTab === 'info' ? '#5cbdb0' : 'white',
                  border: 'none',
                  color: activeTab === 'info' ? 'white' : '#333',
                  borderRadius: '8px',
                  margin: '8px',
                  transition: 'all 0.3s'
                }}
              >
                <i className="bi bi-person-gear" style={{ fontSize: '1.2rem' }}></i> 
                <span>Thông tin tài khoản</span>
              </button>
              <button 
                className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
                style={{ 
                  backgroundColor: activeTab === 'favorites' ? '#5cbdb0' : 'white',
                  border: 'none',
                  color: activeTab === 'favorites' ? 'white' : '#333',
                  borderRadius: '8px',
                  margin: '8px',
                  transition: 'all 0.3s'
                }}
              >
                <i className="bi bi-heart" style={{ fontSize: '1.2rem' }}></i> 
                <span>Yêu thích</span>
                <span className="badge bg-secondary ms-auto" style={{ borderRadius: '20px' }}>{favorites.length}</span>
              </button>
              <button 
                className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 ${activeTab === 'vouchers' ? 'active' : ''}`}
                onClick={() => setActiveTab('vouchers')}
                style={{ 
                  backgroundColor: activeTab === 'vouchers' ? '#5cbdb0' : 'white',
                  border: 'none',
                  color: activeTab === 'vouchers' ? 'white' : '#333',
                  borderRadius: '8px',
                  margin: '8px',
                  transition: 'all 0.3s'
                }}
              >
                <i className="bi bi-ticket-perforated" style={{ fontSize: '1.2rem' }}></i> 
                <span>Voucher của tôi</span>
                <span className="badge bg-secondary ms-auto" style={{ borderRadius: '20px' }}>{vouchers.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-lg-9">
          {/* Statistics Cards - ✅ ĐÃ SỬA LẠI ĐẸP HƠN */}
          <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', backgroundColor: '#fafafa' }}>
            <div className="card-body p-4">
              <h6 className="text-muted mb-4 fw-bold">
                <i className="bi bi-graph-up me-2" style={{ color: '#5cbdb0' }}></i>Tổng quan tài khoản
              </h6>
              
              <div className="row g-4">
                {/* Card 1: Ưu đãi của bạn - ✅ ĐÃ SỬA */}
                <div className="col-md-6">
                  <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '15px', backgroundColor: 'white' }}>
                    <div className="card-body p-4">
                      <h6 className="text-muted mb-4 fw-bold" style={{ fontSize: '16px' }}>
                        <i className="bi bi-gift me-2" style={{ color: '#5cbdb0' }}></i>Ưu đãi của bạn
                      </h6>
                      <div className="row text-center">
                        <div className="col-6">
                          <div className="mb-3">
                            <small className="text-muted d-block mb-2" style={{ fontSize: '13px' }}>Yêu thích</small>
                            <h2 className="text-danger mb-0 fw-bold" style={{ fontSize: '2.5rem' }}>{favorites.length}</h2>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <small className="text-muted d-block mb-2" style={{ fontSize: '13px' }}>Voucher</small>
                            <h2 className="text-success mb-0 fw-bold" style={{ fontSize: '2.5rem' }}>{vouchers.length}</h2>
                          </div>
                        </div>
                      </div>
                      
                      {/* Voucher codes */}
                      <div className="mt-4 pt-3 border-top">
                        <small className="text-muted d-block mb-2" style={{ fontSize: '13px' }}>
                          <i className="bi bi-ticket me-1"></i>Mã voucher của bạn
                        </small>
                        <div className="d-flex gap-2 flex-wrap">
                          {vouchers.map((voucher, index) => (
                            <span key={index} className="badge" style={{ 
                              backgroundColor: '#5cbdb0', 
                              color: 'white', 
                              padding: '8px 14px',
                              fontSize: '13px',
                              borderRadius: '20px',
                              fontWeight: '500'
                            }}>
                              {voucher.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Thành tích năm - ✅ ĐÃ SỬA */}
                <div className="col-md-6">
                  <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '15px', backgroundColor: 'white' }}>
                    <div className="card-body p-4">
                      <h6 className="text-muted mb-4 fw-bold" style={{ fontSize: '16px' }}>
                        <i className="bi bi-trophy me-2" style={{ color: '#ffc107' }}></i>Thành tích năm {currentYear}
                      </h6>
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="mb-3">
                            <small className="text-muted d-block mb-2" style={{ fontSize: '13px' }}>Đơn hàng</small>
                            <h2 className="text-primary mb-0 fw-bold" style={{ fontSize: '2rem' }}>{totalOrders}</h2>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="mb-3">
                            <small className="text-muted d-block mb-2" style={{ fontSize: '13px' }}>Đã thanh toán</small>
                            <h2 className="text-success mb-0 fw-bold" style={{ fontSize: '1.5rem' }}>{totalPaid.toLocaleString('vi-VN')}</h2>
                            <small className="text-muted" style={{ fontSize: '11px' }}>đ</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="mb-3">
                            <small className="text-muted d-block mb-2" style={{ fontSize: '13px' }}>Chưa thanh toán</small>
                            <h2 className="text-warning mb-0 fw-bold" style={{ fontSize: '2rem' }}>{unpaidOrders}</h2>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0" style={{ color: '#5cbdb0' }}>
                    <i className="bi bi-person me-2"></i>Thông tin cá nhân
                  </h5>
                  {!editMode && (
                    <button className="btn btn-sm" onClick={() => setEditMode(true)} 
                      style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '8px' }}>
                      <i className="bi bi-pencil me-1"></i>Chỉnh sửa
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Họ và tên</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        style={{ borderRadius: '8px', backgroundColor: editMode ? 'white' : '#f8f9fa' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        disabled
                        style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}
                      />
                      <small className="text-muted">Email không thể thay đổi</small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        style={{ borderRadius: '8px', backgroundColor: editMode ? 'white' : '#f8f9fa' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Địa chỉ</label>
                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        style={{ borderRadius: '8px', backgroundColor: editMode ? 'white' : '#f8f9fa' }}
                      />
                    </div>
                  </div>

                  {editMode && (
                    <div className="d-flex gap-2 mt-4">
                      <button type="submit" className="btn btn-lg" 
                        style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '8px' }}>
                        <i className="bi bi-check-circle me-1"></i>Lưu thay đổi
                      </button>
                      <button type="button" className="btn btn-lg btn-outline-secondary" 
                        onClick={() => setEditMode(false)} style={{ borderRadius: '8px' }}>
                        Hủy
                      </button>
                    </div>
                  )}
                </form>

                {/* Đổi mật khẩu */}
                <hr className="my-5" style={{ borderColor: '#e0e0e0' }} />
                <h5 className="fw-bold mb-4" style={{ color: '#5cbdb0' }}>
                  <i className="bi bi-key me-2"></i>Đổi mật khẩu
                </h5>
                <form onSubmit={handleChangePassword}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-control"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      required
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Mật khẩu mới</label>
                      <input
                        type="password"
                        name="newPassword"
                        className="form-control"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        required
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-control"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-lg" 
                    style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '8px' }}>
                    <i className="bi bi-key me-1"></i>Đổi mật khẩu
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab Yêu thích */}
          {activeTab === 'favorites' && (
            <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4" style={{ color: '#5cbdb0' }}>
                  <i className="bi bi-heart-fill text-danger me-2"></i>Sách yêu thích
                </h5>
                
                {favorites.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-heart display-1 text-muted" style={{ fontSize: '5rem' }}></i>
                    <p className="mt-3 text-muted">Chưa có sách yêu thích</p>
                    <p className="text-muted small">Hãy thêm sách vào yêu thích từ trang chi tiết sách!</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {favorites.map(book => (
                      <div className="col-md-6" key={book._id}>
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                          <div className="card-body d-flex align-items-center p-3">
                            <img 
                              src={`http://localhost:5000/uploads/${book.image}`}
                              alt={book.title}
                              style={{ width: '60px', height: '85px', objectFit: 'cover', borderRadius: '6px' }}
                              className="me-3"
                            />
                            <div className="flex-grow-1">
                              <h6 className="mb-1 fw-bold">{book.title}</h6>
                              <p className="text-muted mb-1" style={{ fontSize: '14px' }}>{book.author}</p>
                              <p className="fw-bold text-success mb-0">{book.price.toLocaleString('vi-VN')} ₫</p>
                            </div>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFromFavorites(book._id)}
                              style={{ borderRadius: '6px' }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Voucher */}
          {activeTab === 'vouchers' && (
            <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4" style={{ color: '#5cbdb0' }}>
                  <i className="bi bi-ticket-perforated-fill text-primary me-2"></i>Voucher của tôi
                </h5>
                
                {vouchers.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-ticket display-1 text-muted" style={{ fontSize: '5rem' }}></i>
                    <p className="mt-3 text-muted">Chưa có voucher nào</p>
                    <p className="text-muted">Hãy mua hàng để nhận voucher ưu đãi!</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {vouchers.map((voucher, index) => (
                      <div className="col-md-6 col-lg-4" key={index}>
                        <div className="card border-0 shadow-sm" style={{ 
                          borderRadius: '15px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {/* Decorative circles */}
                          <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%'
                          }}></div>
                          <div style={{
                            position: 'absolute',
                            bottom: '-10px',
                            left: '-10px',
                            width: '50px',
                            height: '50px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%'
                          }}></div>
                          
                          <div className="card-body p-4" style={{ position: 'relative', zIndex: 1 }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="fw-bold mb-0" style={{ fontSize: '16px' }}>{voucher.code}</h6>
                              <span className="badge bg-white text-primary" style={{ fontSize: '12px', borderRadius: '20px' }}>{voucher.discount}</span>
                            </div>
                            <p className="mb-3" style={{ fontSize: '14px', opacity: 0.9 }}>{voucher.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small style={{ fontSize: '12px', opacity: 0.8 }}>
                                <i className="bi bi-calendar me-1"></i>Hạn: {new Date(voucher.expiry).toLocaleDateString('vi-VN')}
                              </small>
                              <small style={{ fontSize: '11px', opacity: 0.7 }}>
                                Đơn tối thiểu: {voucher.minOrder}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}