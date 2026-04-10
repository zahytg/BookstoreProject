import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../context/ToastContext'

export default function Login({ setToken, setUser }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password
      })
      
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      setToken(res.data.token)
      setUser(res.data.user)
      
      showToast('Đăng nhập thành công!', 'success')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.msg || 'Đăng nhập thất bại. Vui lòng thử lại.')
      showToast(err.response?.data?.msg || 'Đăng nhập thất bại', 'error')
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
                <i className="bi bi-box-arrow-in-right me-2"></i>Đăng nhập
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
                    placeholder="your@email.com"
                    required
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Mật khẩu</label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-control-lg"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      style={{ borderRadius: '10px', paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', color: '#5cbdb0', paddingRight: '15px' }}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '20px' }}></i>
                    </button>
                  </div>
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
                <span className="text-muted">Chưa có tài khoản? </span>
                <Link to="/register" className="text-decoration-none fw-bold" style={{ color: '#5cbdb0' }}>
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}