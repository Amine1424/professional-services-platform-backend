import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getDefaultRouteByRole, getStoredUser } from '../lib/role-routing';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const user = getStoredUser();

  if (!token || !user) {
    const requestedPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from: requestedPath }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
