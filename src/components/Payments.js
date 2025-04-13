import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Style/PaymentPage.css'; // You'll need to create this CSS file

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CreditCard');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [netBankingBank, setNetBankingBank] = useState('SBI');
  const [walletProvider, setWalletProvider] = useState('Paytm');

  useEffect(() => {
    // Get booking ID from location state or query params
    const bookingId = location.state?.bookingId || new URLSearchParams(location.search).get('bookingId');
    
    if (!bookingId) {
      setError('No booking ID provided');
      return;
    }
    
    fetchBookingDetails(bookingId);
  }, [location]);

  const fetchBookingDetails = async (bookingId) => {
    setIsLoading(true);
    try {
      // Fetch booking details from API
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`);
      
    //   if (!response.ok) {
    //     throw new Error('Failed to fetch booking details');
    //   }
      
      const data = await response.json();
      console.log("payment Data : ", data);
      setBookingDetails(data);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
    // Reset form fields when changing payment method
    setCardNumber('');
    setCardName('');
    setExpiryDate('');
    setCvv('');
    setUpiId('');
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === 'CreditCard' || paymentMethod === 'DebitCard') {
      // Basic validation for card details
      if (!cardNumber || cardNumber.length < 16) {
        alert('Please enter a valid card number');
        return false;
      }
      
      if (!cardName) {
        alert('Please enter the name on card');
        return false;
      }
      
      if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) {
        alert('Please enter a valid expiry date (MM/YY)');
        return false;
      }

      if (!cvv || cvv.length < 3) {
        alert('Please enter a valid CVV');
        return false;
      }
    } else if (paymentMethod === 'UPI') {
      if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID');
        return false;
      }
    } else if (paymentMethod === 'NetBanking') {
      if (!netBankingBank) {
        alert('Please select a bank');
        return false;
      }
    } else if (paymentMethod === 'Wallet') {
      if (!walletProvider) {
        alert('Please select a wallet provider');
        return false;
      }
    }
    
    return true;
  };

  const generateTransactionId = () => {
    // Generate a unique transaction ID - in real implementation this would come from payment gateway
    return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePaymentDetails()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const transactionId = generateTransactionId();
      
      // Create payment payload
      const paymentData = {
        bookingId: bookingDetails.bookingId || bookingDetails.BookingID,
        amount: bookingDetails.totalFare || bookingDetails.TotalFare,
        paymentMethod: paymentMethod,
        transactionId: transactionId
      };
      
      console.log('Sending payment data:', paymentData);
      
      // Send payment request to API
      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment processing failed');
      }
      
      const result = await response.json();
      console.log('Payment successful:', result);
      
      // Show success message
      setSuccess(true);
      
      // Navigate to confirmation page after delay
      setTimeout(() => {
        navigate('/payment-confirmation', {
          state: {
            bookingId: bookingDetails.bookingId || bookingDetails.BookingID,
            pnrNumber: bookingDetails.pnrNumber || bookingDetails.PNRNumber,
            transactionId: transactionId
          }
        });
      }, 3000);
      
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
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

  if (isLoading && !bookingDetails) {
    return (
      <div className="payment-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !bookingDetails) {
    return (
      <div className="payment-page">
        <div className="error-container">
          <h3>Error Loading Booking Details</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('train-booking')}>
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        {success ? (
          <div className="success-container">
            <div className="success-icon">✓</div>
            <h2>Payment Successful!</h2>
            <p>Your ticket has been confirmed. Redirecting to confirmation page...</p>
          </div>
        ) : (
          <>
            <div className="payment-header">
              <h2>Complete Your Payment</h2>
              {bookingDetails && (
                <div className="booking-summary-header">
                  <p className="pnr-number">PNR: {bookingDetails.pnrNumber || bookingDetails.PNRNumber}</p>
                  <p className="journey-details">
                    <span className="journey-route">
                      {bookingDetails.sourceStation || bookingDetails.SourceStation} → 
                      {bookingDetails.destinationStation || bookingDetails.DestinationStation}
                    </span>
                    <span className="journey-date">
                      {formatDate(bookingDetails.journeyDate || bookingDetails.JourneyDate)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {bookingDetails && (
              <>
                <div className="booking-summary-card">
                  <h3>Booking Summary</h3>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Train</span>
                      <span>{bookingDetails.trainName || bookingDetails.TrainName} ({bookingDetails.trainNumber || bookingDetails.TrainNumber})</span>
                    </div>
                    <div className="summary-row">
                      <span>Travel Date</span>
                      <span>{formatDate(bookingDetails.journeyDate || bookingDetails.JourneyDate)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Passengers</span>
                      <span>{bookingDetails.totalPassengers || bookingDetails.TotalPassengers}</span>
                    </div>
                    <div className="summary-row">
                      <span>Coach Type</span>
                      <span>{bookingDetails.coachType || bookingDetails.CoachType}</span>
                    </div>
                    <div className="summary-row total-fare">
                      <span>Total Fare</span>
                      <span>₹{bookingDetails.totalFare || bookingDetails.TotalFare}</span>
                    </div>
                  </div>
                </div>

                <form className="payment-form" onSubmit={handleSubmit}>
                  <h3>Payment Method</h3>
                  
                  <div className="payment-methods">
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="credit-card" 
                        name="payment-method" 
                        value="CreditCard" 
                        checked={paymentMethod === 'CreditCard'} 
                        onChange={handlePaymentMethodChange} 
                      />
                      <label htmlFor="credit-card">Credit Card</label>
                    </div>
                    
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="debit-card" 
                        name="payment-method" 
                        value="DebitCard" 
                        checked={paymentMethod === 'DebitCard'} 
                        onChange={handlePaymentMethodChange} 
                      />
                      <label htmlFor="debit-card">Debit Card</label>
                    </div>
                    
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="upi" 
                        name="payment-method" 
                        value="UPI" 
                        checked={paymentMethod === 'UPI'} 
                        onChange={handlePaymentMethodChange} 
                      />
                      <label htmlFor="upi">UPI</label>
                    </div>
                    
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="net-banking" 
                        name="payment-method" 
                        value="NetBanking" 
                        checked={paymentMethod === 'NetBanking'} 
                        onChange={handlePaymentMethodChange} 
                      />
                      <label htmlFor="net-banking">Net Banking</label>
                    </div>
                    
                    <div className="payment-option">
                      <input 
                        type="radio" 
                        id="wallet" 
                        name="payment-method" 
                        value="Wallet" 
                        checked={paymentMethod === 'Wallet'} 
                        onChange={handlePaymentMethodChange} 
                      />
                      <label htmlFor="wallet">Wallet</label>
                    </div>
                  </div>
                  
                  {/* Payment form fields based on selected method */}
                  {(paymentMethod === 'CreditCard' || paymentMethod === 'DebitCard') && (
                    <div className="card-payment-form">
                      <div className="form-group">
                        <label>Card Number</label>
                        <input 
                          type="text" 
                          placeholder="1234 5678 9012 3456" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          maxLength="16"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Name on Card</label>
                        <input 
                          type="text" 
                          placeholder="John Smith" 
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY" 
                            value={expiryDate}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d/]/g, '');
                              if (value.length <= 5) {
                                if (value.length === 2 && !value.includes('/') && expiryDate.length === 1) {
                                  setExpiryDate(value + '/');
                                } else {
                                  setExpiryDate(value);
                                }
                              }
                            }}
                            maxLength="5"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>CVV</label>
                          <input 
                            type="password" 
                            placeholder="***" 
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            maxLength="3"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'UPI' && (
                    <div className="upi-payment-form">
                      <div className="form-group">
                        <label>UPI ID</label>
                        <input 
                          type="text" 
                          placeholder="yourname@upi" 
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'NetBanking' && (
                    <div className="netbanking-payment-form">
                      <div className="form-group">
                        <label>Select Bank</label>
                        <select 
                          value={netBankingBank}
                          onChange={(e) => setNetBankingBank(e.target.value)}
                          required
                        >
                          <option value="SBI">State Bank of India</option>
                          <option value="HDFC">HDFC Bank</option>
                          <option value="ICICI">ICICI Bank</option>
                          <option value="Axis">Axis Bank</option>
                          <option value="PNB">Punjab National Bank</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'Wallet' && (
                    <div className="wallet-payment-form">
                      <div className="form-group">
                        <label>Select Wallet</label>
                        <select 
                          value={walletProvider}
                          onChange={(e) => setWalletProvider(e.target.value)}
                          required
                        >
                          <option value="Paytm">Paytm</option>
                          <option value="PhonePe">PhonePe</option>
                          <option value="GooglePay">Google Pay</option>
                          <option value="AmazonPay">Amazon Pay</option>
                          <option value="Mobikwik">Mobikwik</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <div className="payment-amount">
                    <h3>Payment Amount</h3>
                    <div className="amount">₹{bookingDetails.totalFare || bookingDetails.TotalFare}</div>
                  </div>
                  
                  <div className="form-buttons">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate(-1)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : `Pay ₹${bookingDetails.totalFare || bookingDetails.TotalFare}`}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="error-message">
                      <p>{error}</p>
                    </div>
                  )}
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;