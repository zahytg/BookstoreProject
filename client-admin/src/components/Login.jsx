import { useState } from 'react'
import axios from 'axios'

export default function Login({ setToken, setUser }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData)
      
      // ✅ KIỂM TRA ROLE - CHỈ ADMIN MỚI ĐƯỢC VÀO
      if (res.data.user.role !== 'admin') {
        setError('Tài khoản của bạn không phải admin. Vui lòng sử dụng tài khoản admin để đăng nhập.')
        setLoading(false)
        return
      }

      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      setToken(res.data.token)
      setUser(res.data.user)
    } catch (err) {
      setError(err.response?.data?.msg || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
            <div className="card-body p-5">
              <h2 className="text-center mb-4 fw-bold" style={{ color: '#5cbdb0' }}>
                <i className="bi bi-shield-lock me-2"></i>Admin Login
              </h2>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@bookstore.com"
                    required
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Mật khẩu</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn w-100 fw-bold py-3"
                  disabled={loading}
                  style={{ 
                    backgroundColor: '#5cbdb0', 
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '1.1rem'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Đăng nhập
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4">
                <a href="http://localhost:5173" className="text-decoration-none" style={{ color: '#5cbdb0' }}>
                  <i className="bi bi-house me-1"></i>Về trang khách
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}