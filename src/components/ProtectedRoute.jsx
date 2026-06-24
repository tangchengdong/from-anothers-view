import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'

function ProtectedRoute({ children }) {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

export default ProtectedRoute
