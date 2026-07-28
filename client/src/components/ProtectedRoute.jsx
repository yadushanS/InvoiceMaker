import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { business, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading...</div>;
  if (!business) return <Navigate to="/login" replace />;
  return children;
}
