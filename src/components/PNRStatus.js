import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Style/PNRStatus.css';
import IRCTCNavbar from './Navbar';
import Cookies from 'js-cookie';

const PNRStatus = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Check if PNR was passed through navigation state
    const passedPnr = location.state || '';
    
    const [pnrNumber, setPnrNumber] = useState(passedPnr);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pnrData, setPnrData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        setIsLoggedIn(!!authToken);
        
        // If PNR is passed from MyBookings, automatically fetch the details
        if (passedPnr) {
            handleSubmit({ preventDefault: () => {} });
        }
    }, [passedPnr]);

    const transformApiData = (apiData) => {
        if (!apiData || apiData.length === 0) return null;

        const firstRecord = apiData[0];
        return {
            pnrNumber: firstRecord.PNRNumber,
            bookingStatus: firstRecord.BookingStatus,
            trainNumber: firstRecord.TrainNumber,
            trainName: firstRecord.TrainName,
            fromStation: firstRecord.SourceStation,
            toStation: firstRecord.DestinationStation,
            // Add missing properties needed by the UI
            fromStationCode: firstRecord.SourceStationCode || '',
            toStationCode: firstRecord.DestinationStationCode || '',
            departureTime: firstRecord.DepartureTime || firstRecord.JourneyDate,
            arrivalTime: firstRecord.ArrivalTime || firstRecord.JourneyDate,
            duration: firstRecord.Duration || 0,
            journeyDate: firstRecord.JourneyDate,
            totalFare: firstRecord.TotalFare,
            coachClass: firstRecord.CoachType,
            passengers: apiData.map(passenger => ({
                name: passenger.Name,
                age: passenger.Age,
                gender: passenger.Gender,
                bookingStatus: passenger.BookingStatus,
                currentStatus: passenger.SeatNumber ? 'Confirmed' :
                    passenger.WaitingNumber ? `WL ${passenger.WaitingNumber}` : 'RAC',
                coach: passenger.CoachType,
                berth: passenger.SeatNumber || '-'
            }))
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Use the authToken for authentication if available
            const authToken = Cookies.get('authToken');
            const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
            
            const response = await fetch(`http://localhost:5000/api/bookings/pnr/${pnrNumber}`, {
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiData = await response.json();
            const transformedData = transformApiData(apiData);
            if (!transformedData) throw new Error('No booking data found');
            setPnrData(transformedData);
        } catch (err) {
            console.error('Error fetching PNR status:', err);
            setError(err.message || 'Failed to fetch PNR status');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    const formatTime = (timeString) => {
        try {
            const date = new Date(timeString);
            if (isNaN(date.getTime())) {
                return 'XX:XX';
            }
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'XX:XX';
        }
    };

    const calculateDuration = (departure, arrival) => {
        try {
            const depTime = new Date(departure).getTime();
            const arrTime = new Date(arrival).getTime();
            
            if (isNaN(depTime) || isNaN(arrTime)) {
                return '-- h -- m';
            }
            
            const durationMs = arrTime - depTime;
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${hours}h ${minutes}m`;
        } catch (error) {
            console.error('Error calculating duration:', error);
            return '-- h -- m';
        }
    };

    return (
        <div className="pnr-status-page">
            <IRCTCNavbar isLoggedIn={isLoggedIn} username={localStorage.getItem('username')} />

            <div className="container">
                <div className="pnr-status-container">
                    <h2>Check PNR Status</h2>
                    <p>Enter your PNR number to check current status</p>

                    <form onSubmit={handleSubmit} className="pnr-form">
                        <div className="form-group">
                            <label htmlFor="pnrNumber">PNR Number</label>
                            <input
                                type="text"
                                id="pnrNumber"
                                value={pnrNumber}
                                onChange={(e) => setPnrNumber(e.target.value)}
                                placeholder="Enter PNR number"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Checking...' : 'Check Status'}
                        </button>

                        {error && <div className="error-message">{error}</div>}
                    </form>

                    {pnrData && (
                        <div className="pnr-result">
                            <div className="pnr-header">
                                <h3>PNR: {pnrData.pnrNumber}</h3>
                                <span className={`status-badge ${pnrData.bookingStatus.toLowerCase()}`}>
                                    {pnrData.bookingStatus}
                                </span>
                            </div>

                            <div className="train-details">
                                <h4>{pnrData.trainName} ({pnrData.trainNumber})</h4>
                                <div className="schedule">
                                    <div className="station">
                                        {/* <div className="time">{formatTime(pnrData.departureTime)}</div> */}
                                        <div className="time">{pnrData.fromStation} {pnrData.fromStationCode ? `(${pnrData.fromStationCode})` : ''}</div>
                                    </div>

                                    <div className="journey-line">
                                        <div className="duration">
                                            To{/* {calculateDuration(pnrData.departureTime, pnrData.arrivalTime)} */}
                                        </div>
                                    </div>

                                    <div className="station">
                                        {/* <div className="time">{formatTime(pnrData.arrivalTime)}</div> */}
                                        <div className="time">{pnrData.toStation} {pnrData.toStationCode ? `(${pnrData.toStationCode})` : ''}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="passenger-details">
                                <h4>Passenger Details</h4>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>No.</th>
                                            <th>Name</th>
                                            <th>Booking Status</th>
                                            <th>Current Status</th>
                                            <th>Coach</th>
                                            <th>Berth</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pnrData.passengers.map((passenger, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{passenger.name}</td>
                                                <td>{passenger.bookingStatus}</td>
                                                <td>{passenger.currentStatus}</td>
                                                <td>{passenger.coach}</td>
                                                <td>{passenger.berth}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="fare-details">
                                <h4>Fare Details</h4>
                                <div className="fare-row">
                                    <span>Total Fare</span>
                                    <span>₹{pnrData.totalFare}</span>
                                </div>
                                <div className="fare-row">
                                    <span>Date of Journey</span>
                                    <span>{formatDate(pnrData.journeyDate)}</span>
                                </div>
                                <div className="fare-row">
                                    <span>Class</span>
                                    <span>{pnrData.coachClass}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PNRStatus;