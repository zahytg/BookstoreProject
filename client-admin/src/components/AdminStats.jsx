import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminStats({ token }) {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    codRevenue: 0,
    onlineRevenue: 0,
    topBooks: [],
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)
  const themeColor = '#5cbdb0'

  useEffect(() => {
    fetchStats()
  }, [token])

  const fetchStats = async () => {
    try {
      const [booksRes, ordersRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/books?limit=100', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const books = booksRes.data.books || booksRes.data
      const orders = ordersRes.data
      const users = usersRes.data

      const onlineRevenue = orders
        .filter(o => o.status !== 'cancelled' && o.paymentMethod === 'online')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      
      const codRevenue = orders
        .filter(o => o.status !== 'cancelled' && o.paymentMethod === 'cod')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

      const bookSales = {}
      orders.forEach(order => {
        if (order.status !== 'cancelled') {
          order.items.forEach(item => {
            const bookId = item.book?._id || item.book
            if (!bookSales[bookId]) {
              bookSales[bookId] = { 
                sold: 0, 
                revenue: 0, 
                title: item.book?.title || 'Unknown' 
              }
            }
            bookSales[bookId].sold += item.quantity
            bookSales[bookId].revenue += item.price * item.quantity
          })
        }
      })

      const topBooks = Object.entries(bookSales)
        .map(([id, data]) => ({ _id: id, ...data }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)

      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)

      setStats({
        totalBooks: books.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalRevenue: onlineRevenue + codRevenue,
        codRevenue,
        onlineRevenue,
        topBooks,
        recentOrders
      })
      setLoading(false)
    } catch (err) {
      console.error('Lỗi tải thống kê:', err)
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: themeColor, width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
      <p className="mt-3 text-muted">Đang tải thống kê...</p>
    </div>
  )

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 fw-bold text-center" style={{ color: themeColor }}>
        <i className="bi bi-graph-up me-2"></i>Thống kê & Báo cáo
      </h2>

      {/* Overview Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 text-white" style={{ 
            borderRadius: '15px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
          }}>
            <div className="card-body p-4">
              <h6 className="mb-2">Tổng sách</h6>
              <h3 className="mb-0 fw-bold">{stats.totalBooks}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 text-white" style={{ 
            borderRadius: '15px', 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
          }}>
            <div className="card-body p-4">
              <h6 className="mb-2">Đơn hàng</h6>
              <h3 className="mb-0 fw-bold">{stats.totalOrders}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 text-white" style={{ 
            borderRadius: '15px', 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
          }}>
            <div className="card-body p-4">
              <h6 className="mb-2">Người dùng</h6>
              <h3 className="mb-0 fw-bold">{stats.totalUsers}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 text-white" style={{ 
            borderRadius: '15px', 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' 
          }}>
            <div className="card-body p-4">
              <h6 className="mb-2">Doanh thu</h6>
              <h3 className="mb-0 fw-bold">{stats.totalRevenue.toLocaleString('vi-VN')} ₫</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-cash-stack me-2" style={{ color: themeColor }}></i>Doanh thu theo phương thức
              </h5>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Thanh toán online:</span>
                  <strong className="text-success">{stats.onlineRevenue.toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ 
                      width: `${stats.totalRevenue ? (stats.onlineRevenue / stats.totalRevenue) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span>COD (Chưa thanh toán):</span>
                  <strong className="text-warning">{stats.codRevenue.toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{ 
                      width: `${stats.totalRevenue ? (stats.codRevenue / stats.totalRevenue) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Books */}
        <div className="col-md-6">
          <div className="card shadow-sm" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-trophy me-2" style={{ color: '#ffc107' }}></i>Top 5 sách bán chạy
              </h5>
              {stats.topBooks.map((book, index) => (
                <div key={book._id} className="d-flex align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <div className="me-3" style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    backgroundColor: index === 0 ? '#ffc107' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: index < 3 ? 'white' : '#333'
                  }}>
                    {index + 1}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold">{book.title}</div>
                    <small className="text-muted">Đã bán: {book.sold} cuốn</small>
                  </div>
                  <div className="fw-bold" style={{ color: themeColor }}>
                    {book.revenue.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
              {stats.topBooks.length === 0 && (
                <p className="text-muted text-center">Chưa có dữ liệu bán hàng</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card shadow-sm" style={{ borderRadius: '15px' }}>
        <div className="card-body p-4">
          <h5 className="fw-bold mb-4">
            <i className="bi bi-clock-history me-2" style={{ color: themeColor }}></i>Đơn hàng gần đây
          </h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order._id}>
                    <td><strong>#{order._id.slice(-8).toUpperCase()}</strong></td>
                    <td>{order.shippingInfo?.name}</td>
                    <td className="fw-bold" style={{ color: themeColor }}>
                      {order.totalAmount?.toLocaleString('vi-VN')} ₫
                    </td>
                    <td>
                      <span className={`badge ${order.paymentMethod === 'online' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {order.paymentMethod === 'online' ? 'Online' : 'COD'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}