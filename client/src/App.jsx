import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import AdminBooks from './components/AdminBooks'
import AdminCategories from './components/AdminCategories'
import BookDetail from './components/BookDetail'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import SearchResults from './components/SearchResults'
import Orders from './components/Orders'
import Profile from './components/Profile'
import { ToastProvider } from './context/ToastContext'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'))
  const isAdmin = user.role === 'admin'

  const logout = () => {
    localStorage.clear()
    setToken('')
    setUser({})
  }

  return (
    <ToastProvider>
      <Router>
        <Navbar token={token} isAdmin={isAdmin} logout={logout} />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Home token={token} />} />
            <Route path="/login" element={!token ? <Login setToken={setToken} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/register" element={!token ? <Register setToken={setToken} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/admin/books" element={isAdmin ? <AdminBooks token={token} /> : <Navigate to="/" />} />
            <Route path="/admin/categories" element={isAdmin ? <AdminCategories token={token} /> : <Navigate to="/" />} />
            <Route path="/book/:id" element={<BookDetail token={token} />} />
            <Route path="/cart" element={token ? <Cart token={token} /> : <Navigate to="/login" />} />
            <Route path="/checkout" element={token ? <Checkout token={token} /> : <Navigate to="/login" />} />
            <Route path="/search" element={<SearchResults token={token} />} />
            <Route path="/orders" element={token ? <Orders token={token} /> : <Navigate to="/login" />} />
            <Route path="/orders/:id" element={token ? <Orders token={token} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={token ? <Profile token={token} /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  )
}

export default App