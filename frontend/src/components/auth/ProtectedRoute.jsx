import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roles }) => {
  const user = JSON.parse(localStorage.getItem('cafe_salome_user') || 'null');
  const token = localStorage.getItem('cafe_salome_token') || sessionStorage.getItem('cafe_salome_token');

  if (!user || !token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/panel" replace />;
  return children;
};

export default ProtectedRoute;
