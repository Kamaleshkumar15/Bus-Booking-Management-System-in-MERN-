import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = ['user', 'admin'] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (allowedRoles.includes('driver') && !allowedRoles.includes('user')) {
      return <Navigate to="/driver/login" state={{ from: location }} replace />;
    }
    if (allowedRoles.includes('admin') && !allowedRoles.includes('user')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
