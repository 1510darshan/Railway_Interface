import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Style/TrainCards.css';

const TrainCards = ({ trains, searchParams }) => {
  const navigate = useNavigate();
  const [selectedTrains, setSelectedTrains] = useState({});

  // Helper function to format time from ISO string
  const formatTime = (isoTime) => {
    const date = new Date(isoTime);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Calculate journey duration in a readable format
  const calculateDuration = (durationMinutes) => {
    // Handle negative duration from API by converting to positive
    const positiveDuration = Math.abs(durationMinutes);
    const hours = Math.floor(positiveDuration / 60);
    const minutes = positiveDuration % 60;
    return `${hours}h ${minutes}m`;
  };

  // Group coaches by type and find the one with the most available seats
  const processCoachedByType = (coaches) => {
    if (!coaches || coaches.length === 0) {
      return [];
    }

    const coachTypes = {};
    
    coaches.forEach(coach => {
      if (!coachTypes[coach.type]) {
        coachTypes[coach.type] = coach;
      } else if (coach.availableSeats > coachTypes[coach.type].availableSeats) {
        coachTypes[coach.type] = coach;
      }
    });

    return Object.values(coachTypes);
  };

  // Get availability status text
  const getAvailabilityStatus = (coach) => {
    if (!coach) return 'Not Available';
    
    const availabilityPercentage = (coach.availableSeats / coach.totalSeats) * 100;
    
    if (availabilityPercentage === 0) {
      return 'WL';
    } else if (availabilityPercentage < 20) {
      return `Limited (${coach.availableSeats})`;
    } else {
      return `Available (${coach.availableSeats})`;
    }
  };

  // Get availability status class for styling
  const getAvailabilityStatusClass = (coach) => {
    if (!coach) return 'not-available';
    
    const availabilityPercentage = (coach.availableSeats / coach.totalSeats) * 100;
    
    if (availabilityPercentage === 0) {
      return 'waitlist';
    } else if (availabilityPercentage < 20) {
      return 'limited';
    } else {
      return 'available';
    }
  };

  // Format running days.
  const formatRunningDays = (days) => {
    return days.split(',').join(', ');
  };

  // Handle book now button click
  const handleBookNow = (train, coachType) => {
    const selectedCoach = train.AvailableCoaches.find(coach => coach.type === coachType);
    
    if (!selectedCoach) {
      alert('This coach type is not available for booking.');
      return;
    }
    
    // Store selected train in session storage
    sessionStorage.setItem('selectedTrain', JSON.stringify({
      train,
      selectedClass: coachType,
      selectedCoach,
      journeyDate: searchParams?.journeyDate || new Date().toISOString().split('T')[0],
      quota: searchParams?.quota || 'General'
    }));
    
    // Navigate to booking page
    navigate(`/train-booking`);
  };

  // Toggle coach selection for a train
  const toggleSelectedCoach = (trainId, coachType) => {
    setSelectedTrains(prev => {
      const updated = { ...prev };
      
      if (updated[trainId] === coachType) {
        delete updated[trainId]; // Deselect if already selected
      } else {
        updated[trainId] = coachType; // Select new coach type
      }
      
      return updated;
    });
  };

  return (
    <div className="train-cards-container">
      {trains.length === 0 ? (
        <div className="no-trains-message">
          <h3>No trains found for your search criteria.</h3>
          <p>Please try different stations or travel dates.</p>
        </div>
      ) : (
        trains.map(train => {
          const processedCoaches = processCoachedByType(train.AvailableCoaches);
          const selectedCoachType = selectedTrains[train.TrainID];
          
          return (
            <div key={train.TrainID} className="train-card">
              <div className="train-header">
                <div className="train-name-number">
                  <h3>{train.TrainName}</h3>
                  <span className="train-number">#{train.TrainNumber}</span>
                  <span className="train-type">{train.TrainType}</span>
                </div>
                
                <div className="running-days">
                  <span className="days-label">Runs on:</span> 
                  <span className="days-values">{formatRunningDays(train.RunningDays)}</span>
                </div>
              </div>
              
              <div className="train-journey-details">
                <div className="journey-station">
                  <div className="time">{formatTime(train.DepartureTime)}</div>
                  <div className="station">
                    <strong>{train.SourceStation}</strong>
                    <span className="station-code">{train.SourceCode}</span>
                  </div>
                </div>
                
                <div className="journey-duration">
                  <div className="duration-line">
                    <div className="start-dot"></div>
                    <div className="line"></div>
                    <div className="end-dot"></div>
                  </div>
                  <div className="duration-text">
                    {calculateDuration(train.JourneyDurationMinutes)}
                  </div>
                </div>
                
                <div className="journey-station">
                  <div className="time">{formatTime(train.ArrivalTime)}</div>
                  <div className="station">
                    <strong>{train.DestinationStation}</strong>
                    <span className="station-code">{train.DestinationCode}</span>
                  </div>
                </div>
              </div>
              
              <div className="train-coaches">
                {processedCoaches.length === 0 ? (
                  <div className="no-coaches">
                    <p>No coach availability information for this train.</p>
                  </div>
                ) : (
                  <>
                    <div className="coaches-header">
                      <div className="column">Class</div>
                      <div className="column">Availability</div>
                      <div className="column">Fare</div>
                      <div className="column">Book</div>
                    </div>
                    
                    <div className="coaches-list">
                      {processedCoaches.map((coach) => (
                        <div 
                          key={coach.type} 
                          className={`coach-row ${selectedCoachType === coach.type ? 'selected' : ''}`}
                          onClick={() => toggleSelectedCoach(train.TrainID, coach.type)}
                        >
                          <div className="column coach-type">
                            <div className="coach-type-code">{coach.type}</div>
                            <div className="coach-type-name">
                              {coach.type === '1A' && 'First AC'}
                              {coach.type === '2A' && 'Second AC'}
                              {coach.type === '3A' && 'Third AC'}
                              {coach.type === 'SL' && 'Sleeper'}
                              {coach.type === 'CC' && 'Chair Car'}
                            </div>
                          </div>
                          
                          <div className="column availability">
                            <span className={`availability-badge ${getAvailabilityStatusClass(coach)}`}>
                              {getAvailabilityStatus(coach)}
                            </span>
                          </div>
                          
                          <div className="column fare">
                            <span className="fare-amount">₹{coach.fare}</span>
                          </div>
                          
                          <div className="column book-button">
                            <button 
                              className="btn-book"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookNow(train, coach.type);
                              }}
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TrainCards;