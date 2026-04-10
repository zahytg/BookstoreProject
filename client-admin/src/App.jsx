import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './components/Login'
import AdminBooks from './components/AdminBooks'
import AdminCategories from './components/AdminCategories'
import AdminOrders from './components/AdminOrders'
import AdminUsers from './components/AdminUsers'
import AdminStats from './components/AdminStats'
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
        <Navbar token={token} isAdmin={isAdmin} logout={logout} user={user} />
        
        <div className="content-frame">
          <div className="container-fluid mt-4" style={{ flex: 1 }}>
            <Routes>
              {!token ? (
                <>
                  <Route path="/" element={<Login setToken={setToken} setUser={setUser} />} />
                  <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
                </>
              ) : (
                <>
                  {/* ✅ KIỂM TRA isAdmin - Nếu không phải admin thì logout */}
                  {!isAdmin ? (
                    <>
                      <Route path="*" element={
                        <div className="container mt-5">
                          <div className="alert alert-danger text-center">
                            <h4><i className="bi bi-exclamation-triangle me-2"></i>Truy cập bị từ chối</h4>
                            <p className="mb-3">Tài khoản của bạn không phải admin. Vui lòng đăng nhập bằng tài khoản admin.</p>
                            <button 
                              className="btn btn-danger"
                              onClick={() => {
                                logout()
                                window.location.reload()
                              }}
                            >
                              <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                            </button>
                          </div>
                        </div>
                      } />
                    </>
                  ) : (
                    <>
                      <Route path="/" element={<Navigate to="/admin/books" />} />
                      <Route path="/admin/books" element={<AdminBooks token={token} />} />
                      <Route path="/admin/categories" element={<AdminCategories token={token} />} />
                      <Route path="/admin/orders" element={<AdminOrders token={token} />} />
                      <Route path="/admin/users" element={<AdminUsers token={token} />} />
                      <Route path="/admin/stats" element={<AdminStats token={token} />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </>
                  )}
                </>
              )}
            </Routes>
          </div>
        </div>
        
        <footer style={{ 
          backgroundColor: '#2c5f58', 
          color: 'white', 
          padding: '30px 0 20px',
          width: '100%',
          marginTop: 'auto'
        }}>
          <div className="container">
            <div className="text-center">
              <p className="mb-0" style={{ color: '#e0e0e0' }}>
                © 2026 Bookstore Admin. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </Router>
    </ToastProvider>
  )
}

export default App