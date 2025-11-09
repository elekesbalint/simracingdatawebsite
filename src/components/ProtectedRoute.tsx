import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-f1-dark">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  if (currentUser.status !== 'approved') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
