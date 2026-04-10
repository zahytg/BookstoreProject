import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from "../context/ToastContext";
export default function Checkout({ token }) {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [showQRPayment, setShowQRPayment] = useState(false)
  
  // ✅ TRẠNG THÁI MỚI: Đã xác nhận thanh toán online thành công
  const [paymentVerified, setPaymentVerified] = useState(false)

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'cod'
  })
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherError, setVoucherError] = useState('')
  const [applyingVoucher, setApplyingVoucher] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  // ✅ Chỉ còn 2 vouchers
  const validVouchers = {
    'WELCOME10': { discount: 0.1, type: 'percent', description: 'Giảm 10%' },
    'SAVE50K': { discount: 50000, type: 'fixed', description: 'Giảm 50.000đ' }
  }

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(savedCart)
  }, [])

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = appliedVoucher 
    ? appliedVoucher.type === 'percent' 
      ? totalPrice * appliedVoucher.discount 
      : appliedVoucher.discount
    : 0
  const finalPrice = totalPrice - discountAmount

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setShippingInfo(prev => ({ ...prev, [name]: value }))
  }

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá')
      return
    }
    setApplyingVoucher(true)
    setVoucherError('')

    try {
      const voucher = validVouchers[voucherCode.toUpperCase()]
      
      if (voucher) {
        setAppliedVoucher(voucher)
        setVoucherCode('')
      } else {
        setVoucherError('Mã giảm giá không hợp lệ hoặc đã hết hạn')
        setAppliedVoucher(null)
      }
    } catch (err) {
      setVoucherError('Có lỗi xảy ra. Vui lòng thử lại')
    } finally {
      setApplyingVoucher(false)
    }
  }

  const removeVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCode('')
    setVoucherError('')
  }

  // ✅ HÀM ĐẶT HÀNG (GỬI API)
  const handlePlaceOrder = async () => {
    if (!token) {
      showToast('Bạn cần đăng nhập để đặt hàng!', 'warning')
      navigate('/login')
      return
    }
    if (!cart || cart.length === 0) {
      showToast('Giỏ hàng của bạn đang trống.', 'warning')
      return
    }

    if (!shippingInfo.name.trim() || !shippingInfo.email.trim() || 
        !shippingInfo.phone.trim() || !shippingInfo.address.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning')
      return
    }

    setLoading(true)

    try {
      // ✅ Nếu đã verify thanh toán online, force paymentMethod là 'online'
      const finalPaymentMethod = paymentVerified ? 'online' : shippingInfo.paymentMethod

      const orderData = {
        items: cart.map(item => ({
          book: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingInfo: {
          name: shippingInfo.name,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address
        },
        totalAmount: finalPrice,
        originalAmount: totalPrice,
        discountAmount: discountAmount,
        voucherCode: appliedVoucher ? Object.keys(validVouchers).find(key => validVouchers[key] === appliedVoucher) : null,
        paymentMethod: finalPaymentMethod
      }

      const res = await axios.post('http://localhost:5000/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.status === 201 || res.data) {
        setOrderSuccess(true)
        setCreatedOrder(res.data.order)
        localStorage.removeItem('cart')
      }
    } catch (err) {
      console.error('Lỗi đặt hàng:', err)
      showToast('Đặt hàng thất bại: ' + (err.response?.data?.msg || 'Lỗi server'), 'error')
    } finally {
      setLoading(false)
    }
  }

  // ✅ XỬ LÝ MỞ TRANG QR
  const handleOnlinePayment = () => {
    if (!shippingInfo.name.trim() || !shippingInfo.email.trim() || 
        !shippingInfo.phone.trim() || !shippingInfo.address.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin nhận hàng trước khi thanh toán online', 'warning')
      return
    }
    setShowQRPayment(true)
  }

  // ✅ HỦY THANH TOÁN (Chỉ đóng QR)
  const handleCancelPayment = () => {
    setShowQRPayment(false)
  }

  // ✅ XÁC NHẬN ĐÃ THANH TOÁN (QUAY VỀ FORM)
  const handleConfirmPaid = () => {
    setShowQRPayment(false)
    setPaymentVerified(true) // ✅ Đánh dấu đã thanh toán
    showToast('Thanh toán thành công! Vui lòng nhấn nút Đặt hàng để hoàn tất.', 'success')
    // ✅ KHÔNG gọi handlePlaceOrder() ở đây nữa
  }

  // ✅ TRANG THANH TOÁN QR CODE
  if (showQRPayment) {
    return (
      <div className="container mt-5 mb-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
              <div className="card-body p-5 text-center">
                <h3 className="mb-4 fw-bold" style={{ color: '#5cbdb0' }}>
                  <i className="bi bi-qr-code me-2"></i>Thanh toán online
                </h3>
                
                <div className="alert alert-info mb-4" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Quét mã QR bằng ngân hàng bạn chọn</strong><br/>
                  Thanh toán qua bất kỳ ngân hàng hoặc ví điện tử nào
                </div>

                {/* QR Code Placeholder */}
                <div className="mb-4">
                  <div className="d-inline-block p-4 border rounded" style={{ backgroundColor: 'white' }}>
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ThanhToanBookstore" 
                      alt="QR Payment"
                      style={{ width: '250px', height: '250px' }}
                    />
                  </div>
                </div>

                {/* Thông tin thanh toán */}
                <div className="card mb-4" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Thông tin thanh toán</h6>
                    <div className="row text-start">
                      <div className="col-6">
                        <p className="mb-1 text-muted">Số tiền cần thanh toán:</p>
                        <p className="mb-0 fw-bold text-success" style={{ fontSize: '1.3rem' }}>
                          {finalPrice.toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                      <div className="col-6">
                        <p className="mb-1 text-muted">Nội dung chuyển khoản:</p>
                        <p className="mb-0 fw-bold">BOOKSTORE_{createdOrder?._id?.slice(-8) || 'ORDER'}</p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Buttons */}
                <div className="d-grid gap-3 col-md-10 mx-auto">
                  <button 
                    className="btn btn-lg fw-bold py-3"
                    style={{ 
                      backgroundColor: '#dc3545', 
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '1.1rem'
                    }}
                    onClick={handleConfirmPaid}
                  >
                    <i className="bi bi-check-circle me-2"></i>Tôi đã thanh toán
                  </button>
                  
                  <button 
                    className="btn btn-lg btn-outline-secondary fw-bold py-3"
                    style={{ borderRadius: '10px', fontSize: '1.1rem' }}
                    onClick={handleCancelPayment}
                  >
                    <i className="bi bi-x-circle me-2"></i>Hủy thanh toán
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ✅ TRANG THÀNH CÔNG
  if (orderSuccess && createdOrder) {
    return (
      <div className="container mt-5 mb-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-lg border-0 text-center p-5" style={{ borderRadius: '15px', backgroundColor: '#f8fff9' }}>
              <div className="mb-4">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
              </div>
              <h2 className="mb-4 fw-bold" style={{ color: '#5cbdb0' }}>
                🎉 Đặt hàng thành công!
              </h2>
              <p className="lead mb-4">
                Cảm ơn <strong>{shippingInfo.name}</strong> đã mua hàng tại Bookstore.
              </p>
              
              <div className="alert alert-info mb-4" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Mã đơn hàng:</strong> #{createdOrder._id.slice(-8).toUpperCase()}
              </div>

              <div className="alert alert-success mb-4" role="alert">
                <i className="bi bi-envelope me-2"></i>
                Chúng tôi đã gửi email xác nhận đến <strong>{shippingInfo.email}</strong>
              </div>

              <p className="text-muted mb-4">
                Chúng tôi sẽ liên hệ với bạn qua số điện thoại {shippingInfo.phone} trong thời gian sớm nhất.
              </p>

              <div className="d-grid gap-3 col-md-10 mx-auto mt-5">
                <Link 
                  to={`/orders/${createdOrder._id}`} 
                  className="btn btn-lg fw-bold py-3"
                  style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '10px' }}
                >
                  <i className="bi bi-receipt me-2"></i>Xem đơn hàng
                </Link>
                <Link 
                  to="/" 
                  className="btn btn-lg btn-outline-secondary fw-bold py-3"
                  style={{ borderRadius: '10px' }}
                >
                  <i className="bi bi-cart me-2"></i>Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="container mt-5">
        <div className="card shadow-lg border-0 text-center p-5" style={{ borderRadius: '15px' }}>
          <i className="bi bi-cart-x display-1 text-muted mb-3"></i>
          <h3 className="mt-3 mb-3">Giỏ hàng trống</h3>
          <p className="text-muted mb-4">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/cart" className="btn btn-lg" style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '10px' }}>
              <i className="bi bi-cart me-2"></i>Về giỏ hàng
            </Link>
            <button className="btn btn-lg btn-outline-secondary" onClick={() => navigate('/')}>
              <i className="bi bi-house me-2"></i>Về trang chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ✅ TRANG CHECKOUT BÌNH THƯỜNG
  return (
    <div className="container mt-5 mb-5">
      <div className="mb-4">
        <Link to="/cart" className="btn btn-outline-secondary" style={{ borderRadius: '8px' }}>
          <i className="bi bi-arrow-left me-2"></i>Quay lại giỏ hàng
        </Link>
      </div>

      <h2 className="mb-5 fw-bold" style={{ color: '#5cbdb0' }}>
        <i className="bi bi-credit-card me-2"></i>Thanh toán
      </h2>

      <div className="row">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="card-title mb-4 fw-bold">
                <i className="bi bi-bag me-2" style={{ color: '#5cbdb0' }}></i>Sản phẩm trong giỏ hàng
              </h5>
              
              {cart.map(item => (
                <div key={item._id} className="card mb-3 border-0" style={{ backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                  <div className="card-body d-flex align-items-center">
                    <img 
                      src={`http://localhost:5000/uploads/${item.image || 'default-book.jpg'}`} 
                      alt={item.title}
                      style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '8px' }}
                      className="me-3"
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-2 fw-bold">{item.title}</h6>
                      <p className="text-muted mb-1">
                        <i className="bi bi-box me-1"></i>Số lượng: {item.quantity}
                      </p>
                      <p className="fw-bold text-success mb-0">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Tạm tính:</span>
                  <span className="fw-bold">{totalPrice.toLocaleString('vi-VN')} ₫</span>
                </div>
                
                {appliedVoucher && (
                  <div className="d-flex justify-content-between align-items-center mb-2 text-success">
                    <span>
                      <i className="bi bi-tag me-1"></i>Giảm giá ({appliedVoucher.description}):
                    </span>
                    <span className="fw-bold">- {discountAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Tổng tiền:</h5>
                  <h4 className="mb-0 fw-bold" style={{ color: '#5cbdb0' }}>
                    {finalPrice.toLocaleString('vi-VN')} ₫
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="card-title mb-4 fw-bold">
                <i className="bi bi-person me-2" style={{ color: '#5cbdb0' }}></i>Thông tin nhận hàng
              </h5>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Họ và tên <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={shippingInfo.name}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên của bạn"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  required
                />
                <small className="text-muted">Chúng tôi sẽ gửi xác nhận đơn hàng đến email này</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Số điện thoại <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={shippingInfo.phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  Địa chỉ nhận hàng <span className="text-danger">*</span>
                </label>
                <textarea
                  name="address"
                  className="form-control"
                  rows="3"
                  value={shippingInfo.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ nhận hàng chi tiết"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-ticket me-2" style={{ color: '#5cbdb0' }}></i>Mã giảm giá
                </label>
                
                {!appliedVoucher ? (
                  <>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nhập mã giảm giá"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        style={{ borderRadius: '8px 0 0 8px' }}
                      />
                      <button 
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={applyVoucher}
                        disabled={applyingVoucher || !voucherCode.trim()}
                        style={{ borderRadius: '0 8px 8px 0' }}
                      >
                        {applyingVoucher ? (
                          <span className="spinner-border spinner-border-sm me-1"></span>
                        ) : (
                          <i className="bi bi-check-circle me-1"></i>
                        )}
                        Áp dụng
                      </button>
                    </div>
                    {voucherError && (
                      <small className="text-danger">
                        <i className="bi bi-exclamation-circle me-1"></i>{voucherError}
                      </small>
                    )}
                    <div className="alert alert-info mt-2" style={{ fontSize: '13px' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>Mã dùng thử:</strong> WELCOME10 (10%), SAVE50K (50k)
                    </div>
                  </>
                ) : (
                  <div className="alert alert-success d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-check-circle me-2"></i>
                      <strong>Đã áp dụng:</strong> {appliedVoucher.description}
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={removeVoucher}
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* ✅ PHẦN HÌNH THỨC THANH TOÁN - ẨN NẾU ĐÃ VERIFY */}
              {!paymentVerified ? (
                <div className="mb-4">
                  <label className="form-label fw-bold">Phương thức thanh toán</label>
                  <div className="form-check mb-2">
                    <input 
                      type="radio" 
                      className="form-check-input" 
                      name="paymentMethod" 
                      value="cod"
                      checked={shippingInfo.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">
                      <i className="bi bi-cash me-1"></i>Thanh toán khi nhận hàng (COD)
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input 
                      type="radio" 
                      className="form-check-input" 
                      name="paymentMethod" 
                      value="online"
                      checked={shippingInfo.paymentMethod === 'online'}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">
                      <i className="bi bi-qr-code me-1"></i>Thanh toán online (QR Code)
                    </label>
                  </div>
                </div>
              ) : (
                <div className="alert alert-success mb-4" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  <strong>Đã thanh toán online thành công!</strong><br/>
                  Vui lòng nhấn nút "Đặt hàng" bên dưới để hoàn tất.
                </div>
              )}

              {/* ✅ NÚT BẤM - ĐỔI TEXT TÙY TRẠNG THÁI */}
              {paymentVerified ? (
                <button 
                  className="btn w-100 fw-bold py-3 shadow-sm mb-3" 
                  style={{ 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    fontSize: '1.1rem',
                    borderRadius: '10px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#218838'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#28a745'
                    e.target.style.transform = 'translateY(0)'
                  }}
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Đặt hàng
                    </>
                  )}
                </button>
              ) : shippingInfo.paymentMethod === 'online' ? (
                <button 
                  className="btn w-100 fw-bold py-3 shadow-sm mb-3" 
                  style={{ 
                    backgroundColor: '#5cbdb0', 
                    color: 'white', 
                    fontSize: '1.1rem',
                    borderRadius: '10px',
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
                  onClick={handleOnlinePayment}
                >
                  <i className="bi bi-qr-code me-2"></i>Thanh toán online
                </button>
              ) : (
                <button 
                  className="btn w-100 fw-bold py-3 shadow-sm mb-3" 
                  style={{ 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    fontSize: '1.1rem',
                    borderRadius: '10px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#218838'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#28a745'
                    e.target.style.transform = 'translateY(0)'
                  }}
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Đặt hàng (COD)
                    </>
                  )}
                </button>
              )}

              <small className="text-muted d-block text-center">
                <i className="bi bi-shield-check me-1"></i>
                Các trường đánh dấu <span className="text-danger">*</span> là bắt buộc
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}