import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Style/IRCTCHomePage.css';
import IRCTCNavbar from './Navbar';

const IRCTCHomePage = () => {
    const navigate = useNavigate();
    const [fromStation, setFromStation] = useState('');
    const [toStation, setToStation] = useState('');
    const [journeyDate, setJourneyDate] = useState('');
    const [journeyClass, setJourneyClass] = useState('');
    const [quota, setQuota] = useState('General');
    const [matchingFromStations, setMatchingFromStations] = useState([]);
    const [matchingToStations, setMatchingToStations] = useState([]);
    const [showFromSuggestions, setShowFromSuggestions] = useState(false);
    const [showToSuggestions, setShowToSuggestions] = useState(false);
    const [isLoadingFrom, setIsLoadingFrom] = useState(false);
    const [isLoadingTo, setIsLoadingTo] = useState(false);
    
    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);
    const fromSuggestionsRef = useRef(null);
    const toSuggestionsRef = useRef(null);

    const popularDestinations = [
        { from: 'New Delhi', to: 'Mumbai' },
        { from: 'Bangalore', to: 'Chennai' },
        { from: 'Kolkata', to: 'Hyderabad' },
        { from: 'Ahmedabad', to: 'Pune' }
    ];

    const today = new Date().toISOString().split('T')[0];

    // Function to fetch matching stations
    const fetchStations = async (query, setMatchingStations, setIsLoading) => {
        if (query.length < 2) {
            setMatchingStations([]);
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/Stations/${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setMatchingStations(data);
            } else {
                console.error('Failed to fetch stations');
                setMatchingStations([]);
            }
        } catch (error) {
            console.error('Error fetching stations:', error);
            setMatchingStations([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce function to avoid too many API calls
    const debounce = (func, delay) => {
        let timeoutId;
        return function(...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    // Debounced search functions
    const debouncedSearchFrom = useRef(
        debounce((query) => fetchStations(query, setMatchingFromStations, setIsLoadingFrom), 300)
    ).current;

    const debouncedSearchTo = useRef(
        debounce((query) => fetchStations(query, setMatchingToStations, setIsLoadingTo), 300)
    ).current;

    useEffect(() => {
        debouncedSearchFrom(fromStation);
        if (fromStation.length >= 2) {
            setShowFromSuggestions(true);
        } else {
            setShowFromSuggestions(false);
        }
    }, [fromStation]);

    useEffect(() => {
        debouncedSearchTo(toStation);
        if (toStation.length >= 2) {
            setShowToSuggestions(true);
        } else {
            setShowToSuggestions(false);
        }
    }, [toStation]);

    // Handle clicks outside the suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fromSuggestionsRef.current && !fromSuggestionsRef.current.contains(event.target) &&
                fromInputRef.current && !fromInputRef.current.contains(event.target)) {
                setShowFromSuggestions(false);
            }
            if (toSuggestionsRef.current && !toSuggestionsRef.current.contains(event.target) &&
                toInputRef.current && !toInputRef.current.contains(event.target)) {
                setShowToSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleStationSelect = (station, isFrom) => {
        if (isFrom) {
            setFromStation(station.StationName);
            setShowFromSuggestions(false);
        } else {
            setToStation(station.StationName);
            setShowToSuggestions(false);
        }
    };

    const swapStations = () => {
        const temp = fromStation;
        setFromStation(toStation);
        setToStation(temp);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        
        // Check if all required fields are filled
        if (!fromStation || !toStation || !journeyDate || !journeyClass) {
            alert('Please fill all required fields');
            return;
        }
        
        // Store search parameters in session storage to pass to the search results component
        const searchParams = {
            fromStation,
            toStation,
            journeyDate,
            journeyClass,
            quota
        };
        
        sessionStorage.setItem('trainSearchParams', JSON.stringify(searchParams));
        
        // Navigate to train search results page
        navigate('/train-search-results');
    };

    return (
        <div className="irctc-homepage">
            <IRCTCNavbar isLoggedIn={false} username="" />

            <section className="hero">
                <div className="hero-content container">
                    <div className="booking-card">
                        <div className="booking-tabs">
                            <button className="tab active">Book Ticket</button>
                            {/* <button className="tab">PNR Status</button>
                            <button className="tab">Train Info</button> */}
                        </div>

                        <form className="booking-form" onSubmit={handleSearch}>
                            <div className="form-row station-inputs">
                                <div className="form-group station-input-container">
                                    <label>From</label>
                                    <input
                                        ref={fromInputRef}
                                        type="text"
                                        placeholder="Enter Origin Station"
                                        value={fromStation}
                                        onChange={(e) => setFromStation(e.target.value)}
                                        onFocus={() => fromStation.length >= 2 && setShowFromSuggestions(true)}
                                        required
                                    />
                                    {showFromSuggestions && (
                                        <div className="station-suggestions" ref={fromSuggestionsRef}>
                                            {isLoadingFrom ? (
                                                <div className="suggestion-loading">Loading...</div>
                                            ) : matchingFromStations.length > 0 ? (
                                                matchingFromStations.map((station) => (
                                                    <div
                                                        key={station.StationID}
                                                        className="station-suggestion-item"
                                                        onClick={() => handleStationSelect(station, true)}
                                                    >
                                                        <span className="station-name">{station.StationName}</span>
                                                        <span className="station-code">{station.StationCode}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-suggestions">No matching stations found</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button type="button" className="swap-btn" onClick={swapStations}>
                                    <div className="swap-icon"></div>
                                </button>

                                <div className="form-group station-input-container">
                                    <label>To</label>
                                    <input
                                        ref={toInputRef}
                                        type="text"
                                        placeholder="Enter Destination Station"
                                        value={toStation}
                                        onChange={(e) => setToStation(e.target.value)}
                                        onFocus={() => toStation.length >= 2 && setShowToSuggestions(true)}
                                        required
                                    />
                                    {showToSuggestions && (
                                        <div className="station-suggestions" ref={toSuggestionsRef}>
                                            {isLoadingTo ? (
                                                <div className="suggestion-loading">Loading...</div>
                                            ) : matchingToStations.length > 0 ? (
                                                matchingToStations.map((station) => (
                                                    <div
                                                        key={station.StationID}
                                                        className="station-suggestion-item"
                                                        onClick={() => handleStationSelect(station, false)}
                                                    >
                                                        <span className="station-name">{station.StationName}</span>
                                                        <span className="station-code">{station.StationCode}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-suggestions">No matching stations found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date of Journey</label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={journeyDate}
                                        onChange={(e) => setJourneyDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Class</label>
                                    <select
                                        value={journeyClass}
                                        onChange={(e) => setJourneyClass(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        <option value="SL">Sleeper (SL)</option>
                                        <option value="3A">AC 3 Tier (3A)</option>
                                        <option value="2A">AC 2 Tier (2A)</option>
                                        <option value="1A">AC First Class (1A)</option>
                                        <option value="CC">Chair Car (CC)</option>
                                        <option value="EC">Exec. Chair Car (EC)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Quota</label>
                                    <select
                                        value={quota}
                                        onChange={(e) => setQuota(e.target.value)}
                                    >
                                        <option value="General">General</option>
                                        <option value="Ladies">Ladies</option>
                                        <option value="Tatkal">Tatkal</option>
                                        <option value="PQWL">Premium Tatkal</option>
                                        <option value="Senior">Senior Citizen</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary search-btn">
                                Search Trains
                            </button>
                        </form>
                    </div>

                    <div className="hero-text">
                        <h1>Book Your Journey with IRCTC</h1>
                        <p>Fast, secure, and convenient railway ticket booking</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default IRCTCHomePage;