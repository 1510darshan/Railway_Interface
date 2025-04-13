import './App.css';
import React from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import PNRStatus from './components/PNRStatus';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Footer from './components/Footer';
import TrainSearchResultsPage from './components/TrainSearchResultsPage ';
import TrainBookingPage from './components/TrainBookingPage'; // For the booking flow
import MyBookings from './components/MyBooking';
import PaymentConfirmation from './components/PaymentConfirmation';
import Payments from './components/Payments';

function App() {
  const location = useLocation();
  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('username');
  console.log("Token : ",token);
  console.log("Username : ", username);
  // Hide Navbar on these routes
  const hideNavbarRoutes = ['/login', '/register'];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);


  return (
    <div className="App">
      {!shouldHideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pnr" element={<PrivateRoute><PNRStatus /></PrivateRoute>} />
        <Route path="/train-search-results" element={<TrainSearchResultsPage />} />
        <Route path="/train-booking" element={<PrivateRoute><TrainBookingPage /></PrivateRoute>} />
        <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
        <Route path="/payment-confirmation" element={<PrivateRoute><PaymentConfirmation /></PrivateRoute>}/>
        <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>}/>
        <Route path="*" element={<h2>404 - Page Not Found</h2>} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;