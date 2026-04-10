import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminUsers({ token }) {
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetail, setShowUserDetail] = useState(false)

  useEffect(() => {
    fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setUsers(usersRes.data)
      setOrders(ordersRes.data)
      setLoading(false)
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err)
      setLoading(false)
    }
  }

  const getUserStats = (userId) => {
    const userOrders = orders.filter(order => order.user && order.user._id === userId)
    const totalOrders = userOrders.length
    const totalPaid = userOrders
      .filter(order => order.status !== 'cancelled' && order.paymentMethod === 'online')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const codOrders = userOrders.filter(order => order.paymentMethod === 'cod').length
    
    return { totalOrders, totalPaid, codOrders }
  }

  const handleViewUserDetail = (user) => {
    setSelectedUser(user)
    setShowUserDetail(true)
  }

  const getUserOrders = () => {
    if (!selectedUser) return []
    return orders.filter(order => order.user && order.user._id === selectedUser._id)
  }

  // ✅ CHẶN/UNBLOCK USER
  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/auth/users/${userId}/toggle-block`,
        { isBlocked: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setUsers(users.map(u => 
        u._id === userId ? { ...u, isBlocked: !currentStatus } : u
      ))
      alert(currentStatus ? 'Bỏ chặn user thành công!' : 'Chặn user thành công!')
    } catch (err) {
      alert('Thao tác thất bại: ' + (err.response?.data?.msg || 'Lỗi server'))
    }
  }

  // ✅ PHÂN QUYỀN USER
  const handleToggleRole = async (userId, currentRole) => {
    try {
      await axios.put(
        `http://localhost:5000/api/auth/users/${userId}/toggle-role`,
        { role: currentRole === 'admin' ? 'user' : 'admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setUsers(users.map(u => 
        u._id === userId ? { ...u, role: currentRole === 'admin' ? 'user' : 'admin' } : u
      ))
      alert('Phân quyền thành công!')
    } catch (err) {
      alert('Thao tác thất bại: ' + (err.response?.data?.msg || 'Lỗi server'))
    }
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => {
      const userOrders = orders.filter(o => o.user && o.user._id === u._id)
      return userOrders.length > 0
    }).length,
    totalRevenue: orders
      .filter(o => o.status !== 'cancelled' && o.paymentMethod === 'online')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  }

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: '#5cbdb0', width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
      <p className="mt-3 text-muted">Đang tải người dùng...</p>
    </div>
  )

  // ✅ CHI TIẾT USER VÀ ĐƠN HÀNG
  if (showUserDetail && selectedUser) {
    const userOrders = getUserOrders()
    const userStats = getUserStats(selectedUser._id)

    return (
      <div className="container-fluid py-4">
        <div className="mb-4">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => setShowUserDetail(false)}
          >
            <i className="bi bi-arrow-left me-2"></i>Quay lại
          </button>
        </div>

        <div className="card shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body p-4">
            <h4 className="mb-4 fw-bold">
              <i className="bi bi-person me-2"></i>Thông tin người dùng
            </h4>
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Họ tên:</strong>
                <p className="mb-0">{selectedUser.name || 'Chưa cập nhật'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Email:</strong>
                <p className="mb-0">{selectedUser.email}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Số điện thoại:</strong>
                <p className="mb-0">{selectedUser.phone || 'Chưa cập nhật'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Địa chỉ:</strong>
                <p className="mb-0">{selectedUser.address || 'Chưa cập nhật'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Vai trò:</strong>
                <span className={`badge ${selectedUser.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                  {selectedUser.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Trạng thái:</strong>
                <span className={`badge ${selectedUser.isBlocked ? 'bg-danger' : 'bg-success'}`}>
                  {selectedUser.isBlocked ? 'Bị chặn' : 'Hoạt động'}
                </span>
              </div>
              <div className="col-md-6 mb-3">
                <strong>Ngày đăng ký:</strong>
                <p className="mb-0">{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-graph-up me-2"></i>Thống kê
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
                  <div className="card-body text-center p-3">
                    <h3 className="mb-0" style={{ color: '#5cbdb0' }}>{userStats.totalOrders}</h3>
                    <small className="text-muted">Tổng đơn hàng</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
                  <div className="card-body text-center p-3">
                    <h3 className="mb-0" style={{ color: '#28a745' }}>{userStats.codOrders}</h3>
                    <small className="text-muted">Đơn COD</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
                  <div className="card-body text-center p-3">
                    <h3 className="mb-0" style={{ color: '#ffc107' }}>{userStats.totalPaid.toLocaleString('vi-VN')} ₫</h3>
                    <small className="text-muted">Đã thanh toán</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">
              <i className="bi bi-receipt me-2"></i>Danh sách đơn hàng ({userOrders.length})
            </h5>
            {userOrders.length === 0 ? (
              <p className="text-muted text-center">Người dùng chưa có đơn hàng nào</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày đặt</th>
                      <th>Tổng tiền</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map(order => (
                      <tr key={order._id}>
                        <td><strong>#{order._id.slice(-8).toUpperCase()}</strong></td>
                        <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="fw-bold">{order.totalAmount?.toLocaleString('vi-VN')} ₫</td>
                        <td>
                          <span className={`badge ${order.paymentMethod === 'online' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {order.paymentMethod === 'online' ? 'Online' : 'COD'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${order.status === 'delivered' ? 'bg-success' : order.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ✅ DANH SÁCH USER
  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 fw-bold" style={{ color: '#5cbdb0' }}>
        <i className="bi bi-people me-2"></i>Quản lý người dùng
      </h2>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px', backgroundColor: '#fff' }}>
            <div className="card-body p-4">
              <h6 className="text-muted mb-2">Tổng người dùng</h6>
              <h3 className="mb-0 fw-bold" style={{ color: '#5cbdb0' }}>{stats.totalUsers}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px', backgroundColor: '#fff' }}>
            <div className="card-body p-4">
              <h6 className="text-muted mb-2">Người dùng hoạt động</h6>
              <h3 className="mb-0 fw-bold" style={{ color: '#28a745' }}>{stats.activeUsers}</h3>
              <small className="text-muted">Đã mua hàng</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px', backgroundColor: '#fff' }}>
            <div className="card-body p-4">
              <h6 className="text-muted mb-2">Doanh thu từ online</h6>
              <h3 className="mb-0 fw-bold" style={{ color: '#ffc107' }}>{stats.totalRevenue.toLocaleString('vi-VN')} ₫</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-4">
          <h5 className="fw-bold mb-4">Danh sách người dùng</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Email</th>
                  <th>Tên</th>
                  <th>Ngày đăng ký</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const { totalOrders, totalPaid, codOrders } = getUserStats(user._id)
                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="fw-bold">{user.email}</div>
                      </td>
                      <td>{user.name || 'Chưa cập nhật'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.isBlocked ? 'bg-danger' : 'bg-success'}`}>
                          {user.isBlocked ? 'Bị chặn' : 'Hoạt động'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-info text-white"
                            onClick={() => handleViewUserDetail(user)}
                            title="Xem chi tiết"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className={`btn btn-sm ${user.role === 'admin' ? 'btn-outline-warning' : 'btn-outline-primary'}`}
                            onClick={() => handleToggleRole(user._id, user.role)}
                            title="Phân quyền"
                          >
                            <i className="bi bi-shield-lock"></i>
                          </button>
                          <button 
                            className={`btn btn-sm ${user.isBlocked ? 'btn-outline-success' : 'btn-outline-danger'}`}
                            onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                            title={user.isBlocked ? 'Bỏ chặn' : 'Chặn'}
                          >
                            <i className={`bi ${user.isBlocked ? 'bi-unlock' : 'bi-lock'}`}></i>
                          </button>
                        </div>
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