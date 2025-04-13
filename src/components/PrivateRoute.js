import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const PrivateRoute = ({ children }) => {
  const token = Cookies.get('authToken'); // Or get from cookies

  return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
