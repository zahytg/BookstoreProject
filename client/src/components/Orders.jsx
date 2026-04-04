import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Orders({ token }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [token])

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(res.data)
      
      if (id) {
        const order = res.data.find(o => o._id === id)
        setSelectedOrder(order)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err)
      setLoading(false)
    }
  }

  const getStatusStep = (status) => {
    const steps = {
      'pending': 1,
      'confirmed': 2,
      'shipping': 3,
      'delivered': 4,
      'cancelled': 0
    }
    return steps[status] || 0
  }

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Đơn Hàng Đã Đặt',
      'confirmed': 'Đã Xác Nhận',
      'shipping': 'Đã Giao Cho ĐVVC',
      'delivered': 'Đã Nhận Được Hàng',
      'cancelled': 'Đã Hủy'
    }
    return texts[status] || status
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
  }

  const formatTime = (date) => {
    const d = new Date(date)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    
    setCancelling(true)
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${selectedOrder._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setSelectedOrder({ ...selectedOrder, status: 'cancelled' })
      setOrders(orders.map(o => 
        o._id === selectedOrder._id ? { ...o, status: 'cancelled' } : o
      ))
      setShowCancelModal(false)
      alert('Đã hủy đơn hàng thành công!')
    } catch (err) {
      alert('Hủy đơn thất bại: ' + (err.response?.data?.msg || 'Lỗi server'))
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="text-center mt-5">Đang tải...</div>

  if (selectedOrder) {
    const currentStep = getStatusStep(selectedOrder.status)
    const originalPrice = selectedOrder.originalAmount || selectedOrder.totalAmount
    const discountAmount = originalPrice - selectedOrder.totalAmount
    const discountPercent = discountAmount > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0

    return (
      <div className="container mt-5 mb-5">
        <div className="mb-4">
          <button 
            className="btn btn-outline-secondary btn-lg px-4 py-2"
            onClick={() => setSelectedOrder(null)}
            style={{ 
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              borderWidth: '2px'
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Quay lại giỏ hàng
          </button>
        </div>

        <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
          <div className="card-body p-4 p-md-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-5 pb-3" style={{ borderBottom: '2px solid #f0f0f0' }}>
              <div>
                <h4 className="mb-1 fw-bold">MÃ ĐƠN HÀNG: <span style={{ color: '#5cbdb0' }}>{selectedOrder._id.slice(-8).toUpperCase()}</span></h4>
                <small className="text-muted">{formatDate(selectedOrder.createdAt)} {formatTime(selectedOrder.createdAt)}</small>
              </div>
              <span className="badge px-4 py-2" style={{ 
                backgroundColor: selectedOrder.status === 'delivered' ? '#28a745' : 
                               selectedOrder.status === 'cancelled' ? '#dc3545' : '#5cbdb0',
                fontSize: '14px',
                borderRadius: '20px'
              }}>
                {getStatusText(selectedOrder.status).toUpperCase()}
              </span>
            </div>

            {/* Progress Steps - Bootstrap Icons */}
            {selectedOrder.status !== 'cancelled' && (
              <div className="mb-5">
                <div className="d-flex justify-content-between position-relative">
                  <div className="position-absolute top-50 start-0 end-0" style={{ height: '3px', backgroundColor: '#e0e0e0', zIndex: 0 }}></div>
                  <div className="position-absolute top-50 start-0" style={{ height: '3px', backgroundColor: '#5cbdb0', zIndex: 0, width: `${(currentStep / 3) * 100}%`, transition: 'width 0.5s' }}></div>
                  
                  {[
                    { icon: 'bi-file-earmark-text', title: 'Đơn Hàng Đã Đặt', time: selectedOrder.createdAt },
                    { icon: 'bi-truck', title: 'Đã Giao Cho ĐVVC', time: selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? selectedOrder.updatedAt : null },
                    { icon: 'bi-box-seam', title: 'Đã Nhận Được Hàng', time: selectedOrder.status === 'delivered' ? selectedOrder.updatedAt : null },
                    { icon: 'bi-star', title: 'Đánh Giá', time: null }
                  ].map((step, index) => {
                    const isActive = index < currentStep
                    const isCurrent = index === currentStep
                    return (
                      <div key={index} className="text-center" style={{ zIndex: 1, width: '25%' }}>
                        <div 
                          className="mb-2 rounded-circle d-flex align-items-center justify-content-center mx-auto"
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            backgroundColor: isActive || isCurrent ? '#5cbdb0' : '#e0e0e0',
                            border: isCurrent && !isActive ? '3px solid #5cbdb0' : 'none',
                            transition: 'all 0.3s'
                          }}
                        >
                          <i 
                            className={`bi ${step.icon}`} 
                            style={{ 
                              fontSize: '28px', 
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          ></i>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '13px' }}>{step.title}</div>
                        {step.time && (
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                            {formatTime(step.time)} {formatDate(step.time)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Products */}
            <div className="mb-4">
              <h5 className="mb-3 fw-bold" style={{ color: '#333' }}>Sản phẩm trong đơn hàng</h5>
              {selectedOrder.items && selectedOrder.items.map((item, index) => (
                <div key={index} className="card mb-3 border-0" style={{ backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                  <div className="card-body d-flex align-items-center p-3">
                    <img 
                      src={`http://localhost:5000/uploads/${item.book?.image || 'default-book.jpg'}`}
                      alt={item.book?.title || 'Product'}
                      style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '8px' }}
                      className="me-3"
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold">{item.book?.title || 'Sản phẩm'}</h6>
                      <p className="text-muted mb-1 mb-0">Số lượng: {item.quantity}</p>
                      <p className="fw-bold mb-0" style={{ color: '#5cbdb0' }}>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="border-top pt-4 mb-4" style={{ borderColor: '#e0e0e0' }}>
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Tổng tiền hàng:</span>
                  <span className="fw-bold">{originalPrice.toLocaleString('vi-VN')} ₫</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between align-items-center mb-2 text-success">
                    <span>
                      <i className="bi bi-tag me-1"></i>
                      Giảm giá {selectedOrder.voucherCode && `(${selectedOrder.voucherCode})`}:
                    </span>
                    <span className="fw-bold">
                      - {discountAmount.toLocaleString('vi-VN')} ₫ 
                      {discountPercent > 0 && <span className="text-muted ms-1">({discountPercent}%)</span>}
                    </span>
                  </div>
                )}
                
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Tổng cộng:</h5>
                  <h4 className="mb-0 fw-bold" style={{ color: '#5cbdb0' }}>
                    {selectedOrder.totalAmount?.toLocaleString('vi-VN')} ₫
                  </h4>
                </div>
              </div>
              
              {/* Payment Status */}
              <div className="d-flex justify-content-between align-items-center p-3 rounded mt-3" style={{ backgroundColor: selectedOrder.paymentMethod === 'online' ? '#d4edda' : '#fff3cd' }}>
                <div>
                  <strong>Phương thức thanh toán:</strong>
                  <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                    {selectedOrder.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online'}
                  </p>
                </div>
                <span className="badge px-3 py-2" style={{ 
                  backgroundColor: selectedOrder.paymentMethod === 'online' ? '#28a745' : '#ffc107',
                  color: selectedOrder.paymentMethod === 'online' ? 'white' : '#000',
                  fontSize: '14px'
                }}>
                  {selectedOrder.paymentMethod === 'cod' ? 'Chưa thanh toán' : 'Đã thanh toán'}
                </span>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-4 p-4 rounded" style={{ backgroundColor: '#f8f9fa' }}>
              <h6 className="fw-bold mb-3">
                <i className="bi bi-geo-alt me-2" style={{ color: '#5cbdb0' }}></i>
                Địa chỉ giao hàng
              </h6>
              <div className="mb-2">
                <strong>Họ và tên:</strong>
                <p className="mb-2">{selectedOrder.shippingInfo?.name || 'Chưa cập nhật'}</p>
              </div>
              <div className="mb-2">
                <strong>Số điện thoại:</strong>
                <p className="mb-2">{selectedOrder.shippingInfo?.phone || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <strong>Địa chỉ:</strong>
                <p className="mb-0">{selectedOrder.shippingInfo?.address || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-grid gap-2">
              {selectedOrder.status === 'pending' && (
                <button 
                  className="btn btn-lg text-white fw-bold py-3" 
                  style={{ backgroundColor: '#dc3545', borderRadius: '10px' }}
                  onClick={() => setShowCancelModal(true)}
                >
                  <i className="bi bi-x-circle me-2"></i>Hủy Đơn Hàng
                </button>
              )}
              {selectedOrder.status === 'delivered' && (
                <button className="btn btn-lg text-white fw-bold py-3" style={{ backgroundColor: '#e74c3c', borderRadius: '10px' }}>
                  <i className="bi bi-star me-2"></i>Đánh Giá
                </button>
              )}
              <button className="btn btn-lg btn-outline-secondary py-3" style={{ borderRadius: '10px' }}>
                <i className="bi bi-chat me-2"></i>Liên Hệ Người Bán
              </button>
              <button className="btn btn-lg py-3" style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '10px' }} onClick={() => navigate('/')}>
                <i className="bi bi-cart me-2"></i>Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: '15px' }}>
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>Xác nhận hủy đơn
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
                </div>
                <div className="modal-body text-center py-4">
                  <p className="mb-3">Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
                  <p className="text-muted small">Hành động này không thể hoàn tác.</p>
                </div>
                <div className="modal-footer border-0 justify-content-center gap-2 pb-4">
                  <button 
                    type="button" 
                    className="btn btn-lg btn-outline-secondary px-4"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                  >
                    Quay lại
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-lg px-4"
                    style={{ backgroundColor: '#dc3545', color: 'white' }}
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang hủy...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Xác nhận hủy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Danh sách đơn hàng
  return (
    <div className="container mt-5 mb-5">
      <h2 className="mb-4 fw-bold" style={{ color: '#5cbdb0' }}>
        <i className="bi bi-receipt me-2"></i>Lịch sử đơn hàng
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-cart-x display-1 text-muted mb-3"></i>
          <h4 className="mb-2">Chưa có đơn hàng nào</h4>
          <p className="text-muted mb-4">Hãy bắt đầu mua sắm ngay!</p>
          <button className="btn btn-lg" style={{ backgroundColor: '#5cbdb0', color: 'white', borderRadius: '10px' }} onClick={() => navigate('/')}>
            <i className="bi bi-house me-2"></i>Về trang chủ
          </button>
        </div>
      ) : (
        <div className="row">
          {orders.map(order => (
            <div className="col-12 mb-4" key={order._id}>
              <div className="card shadow-sm border-0" style={{ borderRadius: '12px', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 fw-bold">Đơn hàng <span style={{ color: '#5cbdb0' }}>#{order._id.slice(-8).toUpperCase()}</span></h5>
                    <span className="badge px-3 py-2" style={{ 
                      backgroundColor: order.status === 'delivered' ? '#28a745' : 
                                     order.status === 'cancelled' ? '#dc3545' : '#5cbdb0',
                      borderRadius: '20px',
                      fontSize: '13px'
                    }}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="bi bi-calendar me-1"></i>
                      {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                    </small>
                  </div>

                  <div className="mb-3">
                    <strong>Tổng tiền:</strong> <span className="fw-bold" style={{ color: '#5cbdb0' }}>{order.totalAmount?.toLocaleString('vi-VN')} ₫</span>
                  </div>

                  <div className="mb-3">
                    <strong>Địa chỉ giao hàng:</strong>
                    <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>{order.shippingInfo?.address || 'Chưa cập nhật'}</p>
                  </div>

                  <button 
                    className="btn w-100 fw-bold py-2"
                    style={{ 
                      backgroundColor: '#5cbdb0', 
                      color: 'white',
                      borderRadius: '8px',
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
                    onClick={() => setSelectedOrder(order)}
                  >
                    <i className="bi bi-eye me-1"></i>Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}