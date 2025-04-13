import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Style/TrainBookingPage.css';
// import IRCTCNavbar from './Navbar';

const TicketBooking = () => {
  const navigate = useNavigate();
  const { trainId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [searchParams, setSearchParams] = useState(null);
  const [trainDetails, setTrainDetails] = useState(null);
  const [stationMap, setStationMap] = useState({});
  const [bookingId, setBookingId] = useState(null);
  const [pnrNumber, setPnrNumber] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [bookingData, setBookingData] = useState({
    userId: 1, // Will be replaced with actual user ID from localStorage
    trainId: parseInt(trainId),
    sourceStationId: 0,
    destinationStationId: 0,
    journeyDate: '',
    coachType: '',
    totalPassengers: 0,
    totalFare: 0,
    passengers: [
      {
        name: '',
        age: '',
        gender: 'Male',
        idProofType: 'Aadhar',
        idProofNumber: ''
      }
    ]
  });

  // Fetch stations when component mounts
  useEffect(() => {
    const fetchStationMap = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/Stations');
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }

        const stationsData = await response.json();

        // Create a mapping of station name to station ID using the API response format
        const stationMapping = {};
        stationsData.forEach(station => {
          stationMapping[station.StationName] = station.StationID;
        });

        console.log('Station mapping loaded:', stationMapping);
        setStationMap(stationMapping);
      } catch (error) {
        console.error('Error fetching station map:', error);
        setError('Failed to load station data. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStationMap();
  }, []);

  useEffect(() => {
    // Get search params from session storage
    const storedParams = sessionStorage.getItem('trainSearchParams');
    if (!storedParams) {
      navigate('/');
      return;
    }

    const params = JSON.parse(storedParams);
    console.log("Params:", params);
    setSearchParams(params);

    // Fetch train details
    fetchTrainDetails(trainId, params.fromStation, params.toStation);

    // Initialize booking data
    if (Object.keys(stationMap).length > 0) {
      setBookingData(prev => ({
        ...prev,
        sourceStationId: stationMap[params.fromStation] || 0,
        destinationStationId: stationMap[params.toStation] || 0,
        journeyDate: params.journeyDate,
        coachType: params.journeyClass
      }));
    }
  }, [trainId, navigate, stationMap]);

  const fetchTrainDetails = async (id, source, destination) => {
    setIsLoading(true);
    try {
      console.log(`Fetching train with ID: ${id} from ${source} to ${destination}`);

      // Fetch train details for the selected train
      const response = await fetch(`http://localhost:5000/api/trains/${encodeURIComponent(source)}/${encodeURIComponent(destination)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch train details');
      }

      const trains = await response.json();
      console.log('Trains received from API:', trains);

      // Try different ways to find the train
      let selectedTrain = null;

      // First attempt: direct TrainID matching with parseInt
      selectedTrain = trains.find(train => train.TrainID === parseInt(id));

      // Second attempt: string comparison if first attempt fails
      if (!selectedTrain) {
        selectedTrain = trains.find(train => String(train.TrainID) === String(id));
      }

      // Third attempt: check if the train data has a different ID field format
      if (!selectedTrain) {
        // Check for other possible ID field names
        selectedTrain = trains.find(train =>
          train.trainId === parseInt(id) ||
          train.train_id === parseInt(id) ||
          train.id === parseInt(id) ||
          train.TrainNumber === String(id)
        );
      }

      // If still not found, just use the first train for testing
      if (!selectedTrain && trains.length > 0) {
        console.log('Train not found by ID, using first available train for testing');
        selectedTrain = trains[0];
      }

      if (!selectedTrain) {
        throw new Error('Train not found');
      }

      console.log('Selected train:', selectedTrain);
      setTrainDetails(selectedTrain);

      // Update train ID in booking data to match the one found
      setBookingData(prev => ({
        ...prev,
        trainId: selectedTrain.TrainID || parseInt(id)
      }));

      // Calculate fare per passenger based on selected coach
      if (selectedTrain.AvailableCoaches && selectedTrain.AvailableCoaches.length > 0) {
        const selectedCoach = selectedTrain.AvailableCoaches.find(
          coach => coach.type === bookingData.coachType
        );

        if (selectedCoach) {
          setBookingData(prev => ({
            ...prev,
            totalFare: selectedCoach.fare
          }));
        } else if (selectedTrain.AvailableCoaches.length > 0) {
          // If coach type not found, use the first available coach
          const firstCoach = selectedTrain.AvailableCoaches[0];
          setBookingData(prev => ({
            ...prev,
            coachType: firstCoach.type,
            totalFare: firstCoach.fare
          }));
        }
      }

    } catch (error) {
      console.error('Error fetching train details:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...bookingData.passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value
    };

    setBookingData({
      ...bookingData,
      passengers: updatedPassengers,
      totalPassengers: updatedPassengers.length
    });
  };

  const addPassenger = () => {
    if (bookingData.passengers.length >= 6) {
      alert('Maximum 6 passengers allowed per booking');
      return;
    }

    setBookingData({
      ...bookingData,
      passengers: [
        ...bookingData.passengers,
        {
          name: '',
          age: '',
          gender: 'Male',
          idProofType: 'Aadhar',
          idProofNumber: ''
        }
      ],
      totalPassengers: bookingData.passengers.length + 1
    });
  };

  const removePassenger = (index) => {
    if (bookingData.passengers.length <= 1) {
      alert('At least one passenger is required');
      return;
    }

    const updatedPassengers = bookingData.passengers.filter((_, i) => i !== index);

    setBookingData({
      ...bookingData,
      passengers: updatedPassengers,
      totalPassengers: updatedPassengers.length
    });
  };

  const updateTotalFare = () => {
    if (!trainDetails || !trainDetails.AvailableCoaches) return;

    const selectedCoach = trainDetails.AvailableCoaches.find(
      coach => coach.type === bookingData.coachType
    );

    if (selectedCoach) {
      const farePerPerson = selectedCoach.fare;
      const totalFare = farePerPerson * bookingData.passengers.length;

      setBookingData(prev => ({
        ...prev,
        totalFare: totalFare
      }));
    }
  };

  useEffect(() => {
    updateTotalFare();
  }, [bookingData.passengers.length, bookingData.coachType]);

  const validateForm = () => {
    // Check if all passengers have required fields
    for (let i = 0; i < bookingData.passengers.length; i++) {
      const passenger = bookingData.passengers[i];
      if (!passenger.name || passenger.name.trim() === '') {
        alert(`Please enter name for Passenger ${i + 1}`);
        return false;
      }

      if (!passenger.age || isNaN(passenger.age) || passenger.age < 1 || passenger.age > 120) {
        alert(`Please enter valid age for Passenger ${i + 1}`);
        return false;
      }

      if (!passenger.idProofNumber || passenger.idProofNumber.trim() === '') {
        alert(`Please enter ID proof number for Passenger ${i + 1}`);
        return false;
      }

      // Validate Aadhar (12 digits)
      if (passenger.idProofType === 'Aadhar' && !/^\d{12}$/.test(passenger.idProofNumber)) {
        alert(`Please enter valid 12-digit Aadhar number for Passenger ${i + 1}`);
        return false;
      }

      // Validate PAN (10 alphanumeric)
      if (passenger.idProofType === 'PAN' && !/^[A-Z0-9]{10}$/.test(passenger.idProofNumber)) {
        alert(`Please enter valid 10-character PAN number for Passenger ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    console.log("my Booking : ", bookingData);

    try {
      // Format the booking data according to the required structure
      const formattedBookingData = {
        userId: localStorage.getItem('ID') || bookingData.userId, // Use localStorage ID or fallback
        trainId: trainDetails.TrainID, // Make sure trainId is an integer
        sourceStationId: bookingData.sourceStationId,
        destinationStationId: bookingData.destinationStationId,
        journeyDate: bookingData.journeyDate,
        coachType: bookingData.coachType,
        totalPassengers: bookingData.passengers.length,
        totalFare: bookingData.totalFare,
        passengers: bookingData.passengers.map(passenger => ({
          name: passenger.name,
          age: parseInt(passenger.age), // Make sure age is an integer
          gender: passenger.gender,
          idProofType: passenger.idProofType,
          idProofNumber: passenger.idProofNumber
        }))
      };

      // Log the data being sent for debugging
      console.log('Sending booking data:', JSON.stringify(formattedBookingData, null, 2));

      // Send the request to the API
      const response = await fetch('http://localhost:5000/api/bookings/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formattedBookingData)
      });

      if (response.status === 403) {
        // Token expired or invalid
        alert("Session expired. Please login again.");
        // Clear local state and redirect to login
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
        return;
      }

      // Get the raw response text first for debugging
      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      // Try to parse the response as JSON
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Error parsing response as JSON:', e);
        throw new Error('Server returned an invalid response format');
      }

      // Check if the response was successful
      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Failed to book ticket';
        throw new Error(errorMessage);
      }

      console.log('Booking successful:', result);

      // Store the booking ID and PNR for payment processing and display
      if (result.bookingId) {
        setBookingId(result.bookingId);
        setPnrNumber(result.pnrNumber);
        // Proceed to payment immediately
        processPayment(result.bookingId, bookingData.totalFare);
      } else {
        throw new Error('No booking ID received from server');
      }

    } catch (error) {
      console.error('Error booking ticket:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Process payment function
  // Updates to the processPayment function in the TicketBooking component

  const processPayment = async (bookingId, amount) => {
    setIsProcessingPayment(true);
    try {
      // Generate a unique transaction ID
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Map frontend payment method to backend expected format
      let backendPaymentMethod;
      switch (paymentMethod) {
        case 'Credit Card':
          backendPaymentMethod = 'CreditCard';
          break;
        case 'Debit Card':
          backendPaymentMethod = 'DebitCard';
          break;
        case 'UPI':
          backendPaymentMethod = 'UPI';
          break;
        case 'Net Banking':
          backendPaymentMethod = 'NetBanking';
          break;
        default:
          backendPaymentMethod = 'Wallet';
      }

      const paymentData = {
        bookingId: bookingId,
        amount: amount,
        paymentMethod: backendPaymentMethod,
        transactionId: transactionId
      };

      console.log('Sending payment data:', paymentData);

      const response = await fetch('http://localhost:5000/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || 'Payment processing failed';
        } catch (e) {
          errorMessage = errorText || 'Payment processing failed';
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Payment successful:', result);

      // Check payment status after processing
      await checkPaymentStatus(bookingId);

    } catch (error) {
      console.error('Error processing payment:', error);
      setError(`Payment failed: ${error.message}`);
      setIsProcessingPayment(false);
      setIsLoading(false);
    }
  };

  // New function to check payment status
  const checkPaymentStatus = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payments/status/${bookingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment status');
      }

      const paymentStatus = await response.json();
      console.log('Payment status:', paymentStatus);

      if (paymentStatus.Status === 'Success') {
        setSuccess(true);

        // Navigate to my-bookings after successful payment
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      } else {
        // If payment is not successful yet, check again after a short delay
        if (paymentStatus.Status === 'Pending') {
          setTimeout(() => checkPaymentStatus(bookingId), 2000);
        } else {
          throw new Error(`Payment status: ${paymentStatus.Status}`);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError(`Payment verification failed: ${error.message}`);
      setIsProcessingPayment(false);
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

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading && !trainDetails) {
    return (
      <div className="ticket-booking-page">
        {/* <IRCTCNavbar isLoggedIn={true} username="User" /> */}
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error && !trainDetails) {
    return (
      <div className="ticket-booking-page">
        {/* <IRCTCNavbar isLoggedIn={true} username="User" /> */}
        <div className="error-container">
          <h3>Error Loading Train Details</h3>
          <p>{error}</p>
          <p>Train ID: {trainId}</p>
          <button className="btn-primary" onClick={() => navigate('/train-search-results')}>
            Back to Search Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-booking-page">
      {/* <IRCTCNavbar isLoggedIn={true} username="User" /> */}

      <div className="container">
        {success ? (
          <div className="success-container">
            <div className="success-icon">✓</div>
            <h2>Payment Successful!</h2>
            <p>Your booking has been confirmed.</p>
            {pnrNumber && <p className="pnr-display">PNR: <strong>{pnrNumber}</strong></p>}
            <p>Redirecting to your bookings...</p>
            <div className="loader"></div>
          </div>
        ) : isProcessingPayment ? (
          <div className="payment-processing-container">
            <h2>Processing Payment</h2>
            <p>Please do not refresh or close this page...</p>
            <div className="loader"></div>
          </div>
        ) : (
          <>
            <div className="booking-header">
              <h2>Book Train Ticket</h2>
              <p className="journey-details">
                <span className="journey-route">
                  {searchParams?.fromStation} → {searchParams?.toStation}
                </span>
                <span className="journey-date">
                  {searchParams && formatDate(searchParams.journeyDate)}
                </span>
              </p>
            </div>

            {trainDetails && (
              <div className="train-card selected-train">
                <div className="train-details">
                  <h3>{trainDetails.TrainName} ({trainDetails.TrainNumber})</h3>
                  <span className="train-type">{trainDetails.TrainType}</span>

                  <div className="train-schedule">
                    <div className="schedule-item">
                      <div className="time">{formatTime(trainDetails.DepartureTime)}</div>
                      <div className="station">{trainDetails.SourceStation} ({trainDetails.SourceCode})</div>
                    </div>

                    <div className="journey-line">
                      <div className="duration">
                        {Math.abs(trainDetails.JourneyDurationMinutes / 60).toFixed(1)} hrs
                      </div>
                    </div>

                    <div className="schedule-item">
                      <div className="time">{formatTime(trainDetails.ArrivalTime)}</div>
                      <div className="station">{trainDetails.DestinationStation} ({trainDetails.DestinationCode})</div>
                    </div>
                  </div>

                  <div className="selected-class">
                    <span>Selected Class: {bookingData.coachType}</span>
                    <span className="fare">Fare: ₹{bookingData.totalFare}</span>
                  </div>
                </div>
              </div>
            )}

            <form className="booking-form" onSubmit={handleSubmit}>
              <h3>Passenger Details</h3>

              {bookingData.passengers.map((passenger, index) => (
                <div key={index} className="passenger-card">
                  <div className="passenger-header">
                    <h4>Passenger {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        className="remove-passenger-btn"
                        onClick={() => removePassenger(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="passenger-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          value={passenger.name}
                          onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                          placeholder="Full Name as per ID"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Age</label>
                        <input
                          type="number"
                          min="1"
                          placeholder='Enter Age'
                          max="120"
                          value={passenger.age}
                          onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Gender</label>
                        <select
                          value={passenger.gender}
                          onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>ID Proof Type</label>
                        <select
                          value={passenger.idProofType}
                          onChange={(e) => handlePassengerChange(index, 'idProofType', e.target.value)}
                        >
                          <option value="Aadhar">Aadhar Card</option>
                          <option value="PAN">PAN Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Driving">Driving License</option>
                        </select>
                      </div>

                      <div className="form-group id-number">
                        <label>ID Proof Number</label>
                        <input
                          type="text"
                          value={passenger.idProofNumber}
                          onChange={(e) => handlePassengerChange(index, 'idProofNumber', e.target.value)}
                          placeholder={passenger.idProofType === 'Aadhar' ? '12-digit Aadhar Number' : 'ID Number'}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="add-passenger-btn"
                onClick={addPassenger}
              >
                + Add Passenger
              </button>

              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Passengers</span>
                  <span>{bookingData.passengers.length}</span>
                </div>
                <div className="summary-row">
                  <span>Coach Type</span>
                  <span>{bookingData.coachType}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Fare</span>
                  <span>₹{bookingData.totalFare}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="payment-method-section">
                <h3>Select Payment Method</h3>
                <div className="payment-methods">
                  <div className="payment-method-option">
                    <input
                      type="radio"
                      id="credit-card"
                      name="payment-method"
                      value="Credit Card"
                      checked={paymentMethod === 'Credit Card'}
                      onChange={() => setPaymentMethod('Credit Card')}
                    />
                    <label htmlFor="credit-card">Credit Card</label>
                  </div>
                  <div className="payment-method-option">
                    <input
                      type="radio"
                      id="debit-card"
                      name="payment-method"
                      value="Debit Card"
                      checked={paymentMethod === 'Debit Card'}
                      onChange={() => setPaymentMethod('Debit Card')}
                    />
                    <label htmlFor="debit-card">Debit Card</label>
                  </div>
                  <div className="payment-method-option">
                    <input
                      type="radio"
                      id="upi"
                      name="payment-method"
                      value="UPI"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                    />
                    <label htmlFor="upi">UPI</label>
                  </div>
                  <div className="payment-method-option">
                    <input
                      type="radio"
                      id="net-banking"
                      name="payment-method"
                      value="Net Banking"
                      checked={paymentMethod === 'Net Banking'}
                      onChange={() => setPaymentMethod('Net Banking')}
                    />
                    <label htmlFor="net-banking">Net Banking</label>
                  </div>
                </div>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/train-search-results')}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Pay & Book Now'}
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
      </div>
    </div>
  );
};

export default TicketBooking;