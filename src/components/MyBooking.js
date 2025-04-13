import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Style/MyBooking.css';
import Cookies from 'js-cookie';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upcoming');

  useEffect(() => {
    const authToken = Cookies.get('authToken');
    const userId = localStorage.getItem('ID');
    
    // if (!authToken || !userId) {
    //   setIsLoading(false);
    //   setError('You need to login to view your bookings');
    //   return;
    // }

    setIsLoggedIn(true);
    fetchBookings(userId);
  }, []);

  const fetchBookings = async (userId) => {
    console.log("Hello");
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('authToken')}`
        }
      });

   

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log("Data : ", data);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    console.log("Cancelling....")
    // if (!window.confirm('Are you sure you want to cancel this booking?')) {
    //   return;
    // }

    try {
      const response = await fetch(`http://localhost:5000/api/bookings/cancel/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${Cookies.get('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh bookings after cancellation
      fetchBookings(localStorage.getItem('ID'));
      alert('Booking cancelled successfully. Refund will be processed according to cancellation policy.');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(`Error cancelling booking: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Confirmed': return 'status-confirmed';
      case 'Waiting': return 'status-waiting';
      case 'RAC': return 'status-rac';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const viewBookingDetails = (pnr) => {
    const dataToSend = pnr;
    navigate(`/pnr`, { state: dataToSend });
  };

  // Filter bookings based on selected tab
  const filteredBookings = bookings.filter(booking => {
    const journeyDate = new Date(booking.JourneyDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedTab === 'upcoming') {
      return journeyDate >= today && booking.BookingStatus !== 'Cancelled';
    } else if (selectedTab === 'completed') {
      return journeyDate < today && booking.BookingStatus !== 'Cancelled';
    } else if (selectedTab === 'cancelled') {
      return booking.BookingStatus === 'Cancelled';
    }
    return true;
  });

  if (!isLoggedIn && !isLoading) {
    return (
      <div className="my-bookings-page">
        <div className="container">
          <div className="login-required">
            <h3>Login Required</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Login to View Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">

      <div className="container">
        <div className="bookings-container">
          <h2>My Bookings</h2>

          <div className="booking-tabs">
            <button 
              className={`tab-button ${selectedTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setSelectedTab('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`tab-button ${selectedTab === 'completed' ? 'active' : ''}`}
              onClick={() => setSelectedTab('completed')}
            >
              Completed
            </button>
            <button 
              className={`tab-button ${selectedTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setSelectedTab('cancelled')}
            >
              Cancelled
            </button>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loader"></div>
              <p>Loading your bookings...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="no-bookings">
              <h3>No {selectedTab} bookings found</h3>
              <button className="btn-primary" onClick={() => navigate('/')}>
                Book a Train
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {filteredBookings.map((booking) => (
                <div key={booking.BookingID} className="booking-card">
                  <div className="booking-header">
                    <div className="pnr-info">
                      <span className="label">PNR:</span>
                      <span className="value">{booking.PNRNumber}</span>
                    </div>
                    <div className={`booking-status ${getStatusClass(booking.BookingStatus)}`}>
                      {booking.BookingStatus}
                      {booking.BookingStatus === 'Waiting' && booking.ConfirmationChance > 0 && (
                        <span className="confirmation-chance"> ({booking.ConfirmationChance}% chance)</span>
                      )}
                    </div>
                  </div>

                  <div className="train-info">
                    <h3>{booking.TrainName || `Train #${booking.TrainID}`}</h3>
                    <div className="journey-route">
                      <div className="station">
                        <span className="station-name">{booking.SourceStation || 'Source'}</span>
                      </div>
                      <div className="journey-line">
                        <span className="journey-date">{formatDate(booking.JourneyDate)}</span>
                      </div>
                      <div className="station">
                        <span className="station-name">{booking.DestinationStation || 'Destination'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-details">
                    <div className="detail-item">
                      <span className="label">Coach Type:</span>
                      <span className="value">{booking.CoachType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Passengers:</span>
                      <span className="value">{booking.TotalPassengers}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Total Fare:</span>
                      <span className="value">₹{booking.TotalFare}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Payment Status:</span>
                      <span className={`value payment-status-${booking.PaymentStatus.toLowerCase()}`}>
                        {booking.PaymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="booking-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => viewBookingDetails(booking.PNRNumber)}
                    >
                      View Details
                    </button>
                    
                    {selectedTab === 'upcoming' && booking.BookingStatus !== 'Cancelled' && (
                      <button 
                        className="btn-cancel" 
                        onClick={() => cancelBooking(booking.PNRNumber)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;