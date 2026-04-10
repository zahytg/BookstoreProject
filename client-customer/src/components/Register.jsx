import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../context/ToastContext'

export default function Register({ setToken, setUser }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      showToast('Mật khẩu xác nhận không khớp', 'error')
      return
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error')
      return
    }

    setLoading(true)

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      
      // Lưu token và user info
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      setToken(res.data.token)
      setUser(res.data.user)
      
      showToast('Đăng ký thành công!', 'success')
      navigate('/')
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Đăng ký thất bại. Vui lòng thử lại.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      console.error('Register error:', err)
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
                <i className="bi bi-person-plus me-2"></i>Đăng ký tài khoản
              </h2>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Họ và tên</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập họ và tên"
                    required
                    style={{ borderRadius: '10px' }}
                  />
                </div>

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

                <div className="mb-3">
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

                <div className="mb-4">
                  <label className="form-label fw-bold">Xác nhận mật khẩu</label>
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control form-control-lg"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      style={{ borderRadius: '10px', paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ background: 'none', border: 'none', color: '#5cbdb0', paddingRight: '15px' }}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '20px' }}></i>
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
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Đăng ký
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4">
                <span className="text-muted">Đã có tài khoản? </span>
                <Link to="/login" className="text-decoration-none fw-bold" style={{ color: '#5cbdb0' }}>
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}