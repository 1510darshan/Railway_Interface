import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Style/PaymentConfirmation.css';

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    // Get data from location state or query params
    const bookingId = location.state?.bookingId || new URLSearchParams(location.search).get('bookingId');
    const pnrNumber = location.state?.pnrNumber || new URLSearchParams(location.search).get('pnrNumber');
    const transactionId = location.state?.transactionId || new URLSearchParams(location.search).get('transactionId');
    
    if (!bookingId && !pnrNumber) {
      setError('No booking information provided');
      setIsLoading(false);
      return;
    }
    
    fetchConfirmationDetails(bookingId, pnrNumber, transactionId);
  }, [location]);

  const fetchConfirmationDetails = async (bookingId, pnrNumber, transactionId) => {
    try {
      // Fetch booking details
      const bookingResponse = await fetch(`http://localhost:5000/api/bookings/${bookingId || pnrNumber}`);
      
      if (!bookingResponse.ok) {
        throw new Error('Failed to fetch booking details');
      }
      
      const bookingData = await bookingResponse.json();
      setBookingDetails(bookingData);
      
      // Fetch payment details
      const paymentResponse = await fetch(`http://localhost:5000/api/payments/booking/${bookingId}`);
      
      if (!paymentResponse.ok) {
        // If payment details not found, we'll still show confirmation with available data
        console.warn('Payment details not found, continuing with booking details only');
      } else {
        const paymentData = await paymentResponse.json();
        setPaymentDetails(paymentData);
      }
    } catch (err) {
      console.error('Error fetching confirmation details:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="payment-confirmation-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading confirmation details...</p>
        </div>
      </div>
    );
  }

  if (error && !bookingDetails) {
    return (
      <div className="payment-confirmation-page">
        <div className="error-container">
          <h3>Error Loading Confirmation</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/bookings')}>
            View All Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-confirmation-page">
      <div className="container">
        <div className="confirmation-header">
          <div className="success-icon">✓</div>
          <h2>Payment Successful</h2>
          <p>Your booking has been confirmed</p>
        </div>

        {bookingDetails && (
          <div className="ticket-details">
            <div className="ticket-header">
              <div className="pnr-section">
                <div className="label">PNR Number</div>
                <div className="pnr">{bookingDetails.pnrNumber || bookingDetails.PNRNumber}</div>
              </div>

              <div className="ticket-status">
                <span className="status-badge confirmed">Confirmed</span>
              </div>
            </div>

            <div className="journey-details">
              <div className="train-info">
                <h3>{bookingDetails.trainName || bookingDetails.TrainName} ({bookingDetails.trainNumber || bookingDetails.TrainNumber})</h3>
                <span className="train-type">{bookingDetails.trainType || bookingDetails.TrainType}</span>
              </div>

              <div className="stations-info">
                <div className="station-item">
                  <div className="time">{formatTime(bookingDetails.departureTime || bookingDetails.DepartureTime)}</div>
                  <div className="date">{formatDate(bookingDetails.journeyDate || bookingDetails.JourneyDate)}</div>
                  <div className="station-name">{bookingDetails.sourceStation || bookingDetails.SourceStation}</div>
                </div>

                <div className="journey-line">
                  <div className="arrow">→</div>
                </div>

                <div className="station-item">
                  <div className="time">{formatTime(bookingDetails.arrivalTime || bookingDetails.ArrivalTime)}</div>
                  <div className="date">{formatDate(bookingDetails.journeyDate || bookingDetails.JourneyDate)}</div>
                  <div className="station-name">{bookingDetails.destinationStation || bookingDetails.DestinationStation}</div>
                </div>
              </div>
            </div>

            <div className="passenger-details">
              <h3>Passenger Details</h3>
              <div className="passenger-info">
                <div className="info-row">
                  <span>Total Passengers</span>
                  <span>{bookingDetails.totalPassengers || bookingDetails.TotalPassengers}</span>
                </div>
                <div className="info-row">
                  <span>Coach Type</span>
                  <span>{bookingDetails.coachType || bookingDetails.CoachType}</span>
                </div>
                {bookingDetails.seatNumbers && (
                  <div className="info-row">
                    <span>Seat Numbers</span>
                    <span>{bookingDetails.seatNumbers}</span>
                  </div>
                )}
                {bookingDetails.SeatNumbers && (
                  <div className="info-row">
                    <span>Seat Numbers</span>
                    <span>{bookingDetails.SeatNumbers}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="payment-summary">
              <h3>Payment Summary</h3>
              <div className="payment-info">
                <div className="info-row">
                  <span>Payment ID</span>
                  <span>{paymentDetails?.transactionId || location.state?.transactionId || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span>Payment Method</span>
                  <span>{paymentDetails?.paymentMethod || 'Online Payment'}</span>
                </div>
                <div className="info-row">
                  <span>Payment Date</span>
                  <span>{formatDateTime(paymentDetails?.paymentDate || new Date())}</span>
                </div>
                <div className="info-row total-amount">
                  <span>Total Amount</span>
                  <span>₹{bookingDetails.totalFare || bookingDetails.TotalFare}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="btn btn-outline" 
            onClick={() => window.print()}
          >
            Print Ticket
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/bookings')}
          >
            View All Bookings
          </button>
        </div>

        <div className="additional-info">
          <h4>Important Information</h4>
          <ul>
            <li>Please arrive at the station at least 30 minutes before departure.</li>
            <li>Keep this ticket and a valid ID proof handy during the journey.</li>
            <li>For any assistance, contact our helpline at 1800-XXX-XXXX.</li>
          </ul>
        </div>

        <div className="return-home">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;