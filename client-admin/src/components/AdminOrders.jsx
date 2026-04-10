import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminOrders({ token }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [noteInputs, setNoteInputs] = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [token])

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(res.data)
      const initialNotes = {}
      res.data.forEach(order => {
        initialNotes[order._id] = order.notes || ''
      })
      setNoteInputs(initialNotes)
      setLoading(false)
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err)
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchOrders()
      alert('Cập nhật trạng thái thành công!')
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.response?.data?.msg || 'Lỗi server'))
    }
  }

  const saveNote = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/notes`,
        { notes: noteInputs[orderId] },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Đã lưu ghi chú!')
    } catch (err) {
      alert('Lưu ghi chú thất bại')
    }
  }

  const viewOrderDetail = (order) => {
    setSelectedOrder(order)
    setShowOrderDetail(true)
  }

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { bg: '#ffc107', text: 'Đã đặt' },
      'confirmed': { bg: '#17a2b8', text: 'Đã xác nhận' },
      'shipping': { bg: '#007bff', text: 'Đang giao' },
      'delivered': { bg: '#28a745', text: 'Đã giao' },
      'cancelled': { bg: '#dc3545', text: 'Đã hủy' }
    }
    return badges[status] || { bg: '#6c757d', text: status }
  }

  const filteredOrders = orders.filter(order => {
    const statusMatch = filter === 'all' || order.status === filter
    const paymentMatch = paymentFilter === 'all' || 
      (paymentFilter === 'cod' && order.paymentMethod === 'cod') ||
      (paymentFilter === 'online' && order.paymentMethod === 'online')
    return statusMatch && paymentMatch
  })

  if (loading) return <div className="text-center py-5">Đang tải...</div>

  // ✅ MODAL XEM CHI TIẾT ĐƠN HÀNG
  if (showOrderDetail && selectedOrder) {
    return (
      <div className="container-fluid py-4">
        <div className="mb-4">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => setShowOrderDetail(false)}
          >
            <i className="bi bi-arrow-left me-2"></i>Quay lại
          </button>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-body p-4">
            <h4 className="mb-4 fw-bold">
              <i className="bi bi-receipt me-2"></i>Chi tiết đơn hàng #{selectedOrder._id.slice(-8).toUpperCase()}
            </h4>

            {/* ✅ Thông tin khách hàng - LẤY TỪ SHIPPING INFO (thông tin checkout) */}
            <div className="row mb-4">
              <div className="col-md-6">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-person me-2"></i>Thông tin người nhận
                </h6>
                <div className="card p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <p className="mb-2"><strong>Họ tên:</strong> {selectedOrder.shippingInfo?.name || 'N/A'}</p>
                  <p className="mb-2"><strong>Email:</strong> {selectedOrder.shippingInfo?.email || 'N/A'}</p>
                  <p className="mb-2"><strong>Điện thoại:</strong> {selectedOrder.shippingInfo?.phone || 'N/A'}</p>
                  <p className="mb-0"><strong>Địa chỉ:</strong> {selectedOrder.shippingInfo?.address || 'N/A'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-info-circle me-2"></i>Thông tin đơn hàng
                </h6>
                <div className="card p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <p className="mb-2"><strong>Mã đơn:</strong> #{selectedOrder._id.slice(-8).toUpperCase()}</p>
                  <p className="mb-2"><strong>Ngày đặt:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                  <p className="mb-2">
                    <strong>Trạng thái:</strong> 
                    <span className="badge ms-2" style={{ backgroundColor: getStatusBadge(selectedOrder.status).bg }}>
                      {getStatusBadge(selectedOrder.status).text}
                    </span>
                  </p>
                  <p className="mb-0"><strong>Thanh toán:</strong> {selectedOrder.paymentMethod === 'online' ? 'Online' : 'COD'}</p>
                </div>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <h6 className="fw-bold mb-3">
              <i className="bi bi-box me-2"></i>Sản phẩm ({selectedOrder.items?.length || 0})
            </h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên sách</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <img 
                          src={`http://localhost:5000/uploads/${item.book?.image || 'default-book.jpg'}`} 
                          alt={item.book?.title}
                          style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      </td>
                      <td>{item.book?.title || 'N/A'}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price?.toLocaleString('vi-VN')} ₫</td>
                      <td>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tổng tiền */}
            <div className="row justify-content-end">
              <div className="col-md-4">
                <div className="card p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tạm tính:</span>
                    <strong>{selectedOrder.originalAmount?.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Giảm giá:</span>
                      <strong>- {selectedOrder.discountAmount?.toLocaleString('vi-VN')} ₫</strong>
                    </div>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Tổng cộng:</strong>
                    <strong style={{ color: '#5cbdb0', fontSize: '1.2rem' }}>
                      {selectedOrder.totalAmount?.toLocaleString('vi-VN')} ₫
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Cập nhật trạng thái */}
            <div className="mt-4">
              <h6 className="fw-bold mb-3">Cập nhật trạng thái</h6>
              <div className="d-flex gap-2 flex-wrap">
                <button 
                  className="btn btn-warning"
                  onClick={() => updateOrderStatus(selectedOrder._id, 'confirmed')}
                  disabled={selectedOrder.status === 'confirmed' || selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled'}
                >
                  Xác nhận đơn
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => updateOrderStatus(selectedOrder._id, 'shipping')}
                  disabled={selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled'}
                >
                  Đang giao
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => updateOrderStatus(selectedOrder._id, 'delivered')}
                  disabled={selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled'}
                >
                  Đã giao
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                  disabled={selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled'}
                >
                  Hủy đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // DANH SÁCH ĐƠN HÀNG
  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 fw-bold" style={{ color: '#5cbdb0' }}>
        <i className="bi bi-receipt me-2"></i>Quản lý đơn hàng
      </h2>

      {/* Filters */}
      <div className="card shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Lọc theo trạng thái</label>
              <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ borderRadius: '8px' }}>
                <option value="all">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="shipping">Đang giao</option>
                <option value="delivered">Đã giao</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Lọc theo phương thức thanh toán</label>
              <select className="form-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={{ borderRadius: '8px' }}>
                <option value="all">Tất cả</option>
                <option value="cod">COD</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const badge = getStatusBadge(order.status)
                  return (
                    <tr key={order._id}>
                      <td><strong>#{order._id.slice(-8).toUpperCase()}</strong></td>
                      <td>
                        {/* ✅ Hiển thị tên từ shippingInfo thay vì user */}
                        <div className="fw-bold">{order.shippingInfo?.name || 'N/A'}</div>
                        <small className="text-muted">{order.shippingInfo?.phone || ''}</small>
                      </td>
                      <td className="fw-bold" style={{ color: '#5cbdb0' }}>{order.totalAmount?.toLocaleString('vi-VN')} ₫</td>
                      <td>
                        <span className={`badge ${order.paymentMethod === 'online' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {order.paymentMethod === 'online' ? 'Online' : 'COD'}
                        </span>
                      </td>
                      <td>
                        <span className="badge px-3 py-2" style={{ backgroundColor: badge.bg, color: 'white', borderRadius: '20px' }}>
                          {badge.text}
                        </span>
                      </td>
                      
                      <td>
                        <div className="mb-2">
                          <textarea 
                            className="form-control form-control-sm" 
                            rows="2"
                            value={noteInputs[order._id] || ''}
                            onChange={(e) => setNoteInputs(prev => ({ ...prev, [order._id]: e.target.value }))}
                            placeholder="Nhập ghi chú..."
                            style={{ fontSize: '13px', resize: 'none' }}
                          />
                        </div>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => saveNote(order._id)}
                          style={{ fontSize: '12px', padding: '2px 8px' }}
                        >
                          Lưu note
                        </button>
                        {order.notes && order.notes.includes('Admin hủy') && (
                          <div className="text-danger mt-1" style={{ fontSize: '12px' }}><i className="bi bi-exclamation-circle"></i> Admin hủy</div>
                        )}
                      </td>

                      <td>
                        <button 
                          className="btn btn-sm btn-info text-white me-1"
                          onClick={() => viewOrderDetail(order)}
                        >
                          <i className="bi bi-eye"></i> Xem
                        </button>
                        {order.status === 'pending' && (
                          <div className="d-flex gap-2 mt-1">
                            <button className="btn btn-sm btn-success" onClick={() => updateOrderStatus(order._id, 'confirmed')}>Xác nhận</button>
                            <button className="btn btn-sm btn-danger" onClick={() => updateOrderStatus(order._id, 'cancelled')}>Hủy</button>
                          </div>
                        )}
                        {order.status === 'confirmed' && (
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => updateOrderStatus(order._id, 'shipping')}
                          >
                            <i className="bi bi-truck me-1"></i> Gửi hàng
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          <span className="text-primary fw-bold"><i className="bi bi-clock-history"></i> Đang giao</span>
                        )}
                        {order.status === 'delivered' && <span className="text-success fw-bold">Hoàn thành</span>}
                        {order.status === 'cancelled' && <span className="text-danger fw-bold">Đã hủy</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}