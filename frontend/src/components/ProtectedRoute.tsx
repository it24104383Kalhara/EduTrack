import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Checking authentication...</div>;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
