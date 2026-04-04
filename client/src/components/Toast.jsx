import { useEffect } from 'react'

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000) // Tự động đóng sau 3 giây

    return () => clearTimeout(timer)
  }, [onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return 'ℹ️'
      case 'info':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return '📢'
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
      case 'error':
        return 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
      case 'info':
        return 'linear-gradient(135deg, #5cbdb0 0%, #4aa8a0 100%)'
      case 'warning':
        return 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)'
      default:
        return 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
    }
  }

  return (
    <div
      className="toast-notification"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        minWidth: '350px',
        maxWidth: '450px',
        padding: '16px 20px',
        borderRadius: '12px',
        background: getBackgroundColor(),
        color: 'white',
        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out',
        cursor: 'pointer'
      }}
      onClick={onClose}
    >
      <span style={{ fontSize: '24px' }}>{getIcon()}</span>
      <div style={{ flex: 1, fontSize: '15px', fontWeight: '500' }}>
        {message}
      </div>
      <button
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold'
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        ×
      </button>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}