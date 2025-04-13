import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Style/SeatSelection.css';

const SeatSelection = () => {
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [selectedCoachNumber, setSelectedCoachNumber] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [coachLayout, setCoachLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Retrieve booking details from session storage
    const storedBookingDetails = sessionStorage.getItem('bookingDetails');
    
    if (!storedBookingDetails) {
      navigate('/');
      return;
    }
    
    try {
      const details = JSON.parse(storedBookingDetails);
      setBookingDetails(details);
      
      // Fetch available coaches for the selected train and class
      fetchAvailableCoaches(details.train.TrainID, details.selectedClass, details.journeyDate);
    } catch (error) {
      console.error('Error loading booking details:', error);
      setError('Failed to load booking information. Please try again.');
    }
  }, [navigate]);

  const fetchAvailableCoaches = async (trainId, coachClass, journeyDate) => {
    setLoading(true);
    try {
      // This would be replaced with your actual API endpoint
      const response = await fetch(`http://localhost:5000/api/trains/${trainId}/coaches?class=${coachClass}&date=${journeyDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch coaches');
      }
      
      const data = await response.json();
      setAvailableCoaches(data);
      
      // Select the first coach by default if available
      if (data.length > 0) {
        setSelectedCoachNumber(data[0].coachNumber);
        fetchCoachLayout(trainId, data[0].coachNumber, coachClass);
      } else {
        setLoading(false);
        setError('No coaches available for booking');
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      setError('Failed to fetch available coaches. Please try again.');
      setLoading(false);
    }
  };

  const fetchCoachLayout = async (trainId, coachNumber, coachClass) => {
    try {
      // This would be replaced with your actual API endpoint
      const response = await fetch(`http://localhost:5000/api/trains/${trainId}/coach-layout?coachNumber=${coachNumber}&class=${coachClass}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch coach layout');
      }
      
      const data = await response.json();
      setCoachLayout(data);
    } catch (error) {
      console.error('Error fetching coach layout:', error);
      setError('Failed to load coach layout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCoachChange = (coachNumber) => {
    setSelectedCoachNumber(coachNumber);
    setSelectedSeats([]);
    
    // Fetch the layout for the selected coach
    fetchCoachLayout(bookingDetails.train.TrainID, coachNumber, bookingDetails.selectedClass);
  };

  const handleSeatClick = (seatNumber, isAvailable) => {
    if (!isAvailable) {
      return; // Don't allow selecting unavailable seats
    }
    
    // Check if we've already selected enough seats for all passengers
    if (selectedSeats.includes(seatNumber)) {
      // If the seat is already selected, deselect it
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      // If we haven't selected enough seats yet, add this seat
      if (selectedSeats.length < bookingDetails.passengers.length) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      } else {
        alert(`You can only select ${bookingDetails.passengers.length} seats for your booking.`);
      }
    }
  };

  const getSeatStatusClass = (seatData) => {
    if (selectedSeats.includes(seatData.seatNumber)) {
      return 'selected';
    }
    
    if (!seatData.isAvailable) {
      return 'booked';
    }
    
    return 'available';
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

  const formatTime = (isoTime) => {
    if (!isoTime) return 'N/A';
    const date = new Date(isoTime);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getCoachTypeName = (type) => {
    switch(type) {
      case '1A': return 'First AC';
      case '2A': return 'Second AC';
      case '3A': return 'Third AC';
      case 'SL': return 'Sleeper';
      case 'CC': return 'Chair Car';
      default: return type;
    }
  };

  const getBerthLabel = (seatData) => {
    // In real implementation, would return the berth type for each seat
    // Example: return seatData.berthType;
    return seatData.berthType || 'Lower';
  };

  const handleContinue = () => {
    if (selectedSeats.length < bookingDetails.passengers.length) {
      alert(`Please select ${bookingDetails.passengers.length} seats to continue.`);
      return;
    }
    
    // Assign selected seats to passengers
    const passengersWithSeats = bookingDetails.passengers.map((passenger, index) => ({
      ...passenger,
      seatNumber: selectedSeats[index],
      coachNumber: selectedCoachNumber
    }));
    
    // Update booking details with seat information
    const updatedBookingDetails = {
      ...bookingDetails,
      passengers: passengersWithSeats,
      coachNumber: selectedCoachNumber
    };
    
    // Store updated booking details in session storage
    sessionStorage.setItem('bookingDetails', JSON.stringify(updatedBookingDetails));
    
    // Navigate to payment page
    navigate('/payments');
  };

  const renderCoachLayout = () => {
    if (!coachLayout || !coachLayout.seats) {
      return <p className="info-text">No layout available for this coach.</p>;
    }
    
    // For simplicity, we'll create a grid layout for different coach types
    // In a real application, you'd have specific layouts for each coach type (1A, 2A, 3A, SL, CC)
    
    switch (bookingDetails.selectedClass) {
      case '1A': // First AC - Coupe style
        return renderFirstACLayout(coachLayout.seats);
      case '2A': // Second AC - Side and main berths
        return renderSecondACLayout(coachLayout.seats);
      case '3A': // Third AC - Three-tier layout
        return renderThirdACLayout(coachLayout.seats);
      case 'SL': // Sleeper - Three-tier layout without AC
        return renderSleeperLayout(coachLayout.seats);
      case 'CC': // Chair Car - Seats in rows
        return renderChairCarLayout(coachLayout.seats);
      default:
        return renderGenericLayout(coachLayout.seats);
    }
  };

  // Different coach layout rendering functions
  const renderFirstACLayout = (seats) => {
    // Group seats into coupes (1A typically has 2-berth private coupes)
    const coupes = [];
    for (let i = 0; i < seats.length; i += 2) {
      coupes.push(seats.slice(i, i + 2));
    }
    
    return (
      <div className="coach-layout first-ac">
        <div className="corridor">
          {coupes.map((coupe, coupeIndex) => (
            <div key={coupeIndex} className="coupe">
              {coupe.map((seat) => (
                <div 
                  key={seat.seatNumber}
                  className={`seat ${getSeatStatusClass(seat)}`}
                  onClick={() => handleSeatClick(seat.seatNumber, seat.isAvailable)}
                >
                  <span className="seat-number">{seat.seatNumber}</span>
                  <span className="berth-type">{getBerthLabel(seat)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSecondACLayout = (seats) => {
    // Group seats into compartments (each with 4 berths) and side berths
    const compartments = [];
    const sideBerths = [];
    
    seats.forEach(seat => {
      if (seat.berthType === 'Side Lower' || seat.berthType === 'Side Upper') {
        sideBerths.push(seat);
      } else {
        if (compartments.length === 0 || compartments[compartments.length - 1].length === 4) {
          compartments.push([]);
        }
        compartments[compartments.length - 1].push(seat);
      }
    });
    
    return (
      <div className="coach-layout second-ac">
        <div className="side-berths">
          {sideBerths.map((seat) => (
            <div 
              key={seat.seatNumber}
              className={`seat side ${getSeatStatusClass(seat)}`}
              onClick={() => handleSeatClick(seat.seatNumber, seat.isAvailable)}
            >
              <span className="seat-number">{seat.seatNumber}</span>
              <span className="berth-type">{getBerthLabel(seat)}</span>
            </div>
          ))}
        </div>
        
        <div className="corridor"></div>
        
        <div className="compartments">
          {compartments.map((compartment, compIndex) => (
            <div key={compIndex} className="compartment">
              {compartment.map((seat) => (
                <div 
                  key={seat.seatNumber}
                  className={`seat ${getSeatStatusClass(seat)}`}
                  onClick={() => handleSeatClick(seat.seatNumber, seat.isAvailable)}
                >
                  <span className="seat-number">{seat.seatNumber}</span>
                  <span className="berth-type">{getBerthLabel(seat)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderThirdACLayout = (seats) => {
    // Similar to Second AC but with 6 berths per compartment
    const compartments = [];
    const sideBerths = [];
    
    seats.forEach(seat => {
      if (seat.berthType === 'Side Lower' || seat.berthType === 'Side Upper' || seat.berthType === 'Side Middle') {
        sideBerths.push(seat);
      } else {
        if (compartments.length === 0 || compartments[compartments.length - 1].length === 6) {
          compartments.push([]);
        }
        compartments[compartments.length - 1].push(seat);
      }
    });
    
    return (
      <div className="coach-layout third-ac">
        <div className="side-berths">
          {sideBerths.map((seat) => (
            <div 
              key={seat.seatNumber}
              className={`seat side ${getSeatStatusClass(seat)}`}
              onClick={() => handleSeatClick(seat.seatNumber, seat.isAvailable)}
            >
              <span className="seat-number">{seat.seatNumber}</span>
              <span className="berth-type">{getBerthLabel(seat)}</span>
            </div>
          ))}
        </div>
        
        <div className="corridor"></div>
        
        <div className="compartments">
          {compartments.map((compartment, compIndex) => (
            <div key={compIndex} className="compartment">
              {compartment.map((seat) => (
                <div 
                  key={seat.seatNumber}
                  className={`seat ${getSeatStatusClass(seat)}`}
                  onClick={() => handleSeatClick(seat.seatNumber, seat.isAvailable)}
                >
                  <span className="seat-number">{seat.seatNumber}</span>
                  <span className="berth-type">{getBerthLabel(seat)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSleeperLayout = (seats) => {
    // Very similar to Third AC but without AC
    return renderThirdACLayout(seats);
  };

  const renderChairCarLayout = (seats) => {
    // Chair Car has seats in rows, typically 3+2 configuration
    const rows = [];
    
    for (let i = 0; i < seats.length; i += 5) {
      rows.push(seats.slice(i, i + 5));
    }
    
    return (
      <div className="coach-layout chair-car">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            <div className="window-section">
              {row.slice(0, 3).map((seat) => (
                <div 
                  key={seat.seatNumber}
                  className={`seat ${getSeatStatusClass(seat)}`}
                  onClick={() => handleSeatClick(seat.seatNumber, seat.isAvailable)}
                >
                  <span className="seat-number">{seat.seatNumber}</span>
                </div>
              ))}
            </div>
            
            <div className="corridor"></div>
            
            <div className="aisle-section">
              {row.slice(3, 5).map((seat) => (
                <div 
                  key={seat.seatNumber}
                  className={`seat ${getSeatStatusClass(seat)}`}
                  onClick={() => handleSeatClick(seat.seatNumber, seat.isAvailable)}
                >
                  <span className="seat-number">{seat.seatNumber}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGenericLayout = (seats) => {
    // A simple grid layout for when specific layouts aren't implemented
    const rows = [];
    
    // Group seats into rows of 8 (just an example)
    for (let i = 0; i < seats.length; i += 8) {
      rows.push(seats.slice(i, i + 8));
    }
    
    return (
      <div className="coach-layout generic">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((seat) => (
              <div 
                key={seat.seatNumber}
                className={`seat ${getSeatStatusClass(seat)}`}
                onClick={() => handleSeatClick(seat.seatNumber, seat.isAvailable)}
              >
                <span className="seat-number">{seat.seatNumber}</span>
                <span className="berth-type">{getBerthLabel(seat)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('username');

  if (loading) {
    return (
      <div className="seat-selection-page">
        <div className="container">
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading coach information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seat-selection-page">
        <div className="container">
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate('/train-booking/' + bookingDetails?.train.TrainID)}>
              Back to Passenger Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="seat-selection-page">
        <div className="container">
          <div className="error-container">
            <h3>No Booking Information Found</h3>
            <p>Please start your booking process again.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seat-selection-page">
      <div className="container">
        <div className="booking-header">
          <h2>Select Your Seats</h2>
          <div className="booking-progress">
            <div className="progress-step completed">1. Passenger Details</div>
            <div className="progress-step active">2. Select Seats</div>
            <div className="progress-step">3. Payment</div>
            <div className="progress-step">4. Confirmation</div>
          </div>
        </div>

        <div className="booking-content">
          <div className="train-summary">
            <div className="train-info">
              <h3>{bookingDetails.train.TrainName} <span>#{bookingDetails.train.TrainNumber}</span></h3>
              <span className="train-type">{bookingDetails.train.TrainType}</span>
            </div>
            
            <div className="journey-summary">
              <div className="journey-stations">
                <div className="departure">
                  <div className="time">{formatTime(bookingDetails.train.DepartureTime)}</div>
                  <div className="date">{formatDate(bookingDetails.journeyDate)}</div>
                  <div className="station">{bookingDetails.train.SourceStation}</div>
                </div>
                
                <div className="journey-arrow">→</div>
                
                <div className="arrival">
                  <div className="time">{formatTime(bookingDetails.train.ArrivalTime)}</div>
                  <div className="date">{formatDate(bookingDetails.journeyDate)}</div>
                  <div className="station">{bookingDetails.train.DestinationStation}</div>
                </div>
              </div>
              
              <div className="booking-summary">
                <div className="detail">
                  <span className="label">Class:</span>
                  <span className="value">{bookingDetails.selectedClass} ({getCoachTypeName(bookingDetails.selectedClass)})</span>
                </div>
                <div className="detail">
                  <span className="label">Passengers:</span>
                  <span className="value">{bookingDetails.passengers.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="seat-selection-container">
            <div className="coach-selection">
              <h3>Select Coach</h3>
              <div className="coach-list">
                {availableCoaches.map((coach) => (
                  <button
                    key={coach.coachNumber}
                    className={`coach-button ${selectedCoachNumber === coach.coachNumber ? 'active' : ''}`}
                    onClick={() => handleCoachChange(coach.coachNumber)}
                  >
                    {coach.coachNumber}
                    <span className="available-seats">{coach.availableSeats} seats</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="seat-layout-container">
              <h3>Select {bookingDetails.passengers.length} Seats</h3>
              
              <div className="seat-legend">
                <div className="legend-item">
                  <div className="legend-box available"></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="legend-box selected"></div>
                  <span>Selected</span>
                </div>
                <div className="legend-item">
                  <div className="legend-box booked"></div>
                  <span>Booked</span>
                </div>
              </div>
              
              <div className="coach-diagram">
                {renderCoachLayout()}
              </div>
            </div>
            
            <div className="seat-selection-summary">
              <h3>Your Selection ({selectedSeats.length}/{bookingDetails.passengers.length})</h3>
              
              {selectedSeats.length > 0 ? (
                <div className="selected-seats-list">
                  {selectedSeats.map((seatNumber, index) => (
                    <div key={seatNumber} className="selected-seat-item">
                      <div className="passenger-name">
                        {bookingDetails.passengers[index]?.name || `Passenger ${index + 1}`}
                      </div>
                      <div className="seat-info">
                        <span className="coach">Coach {selectedCoachNumber}</span>
                        <span className="seat">Seat {seatNumber}</span>
                        <span className="berth">{getBerthLabel(coachLayout.seats.find(s => s.seatNumber === seatNumber))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-seats-message">
                  Please select seats to continue with your booking.
                </p>
              )}
            </div>
          </div>

          <div className="booking-actions">
            <button className="btn-secondary" onClick={() => navigate('/train-booking/' + bookingDetails.train.TrainID)}>
              Back
            </button>
            <button 
              className="btn-primary" 
              onClick={handleContinue}
              disabled={selectedSeats.length < bookingDetails.passengers.length}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;