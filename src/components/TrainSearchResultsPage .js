import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IRCTCNavbar from './Navbar'; // Assuming you have this component
import TrainCards from './TrainCards';
import './Style/TrainSearchResults.css';

const TrainSearchResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState(null);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    departureTime: 'all',
    trainType: 'all',
    coachType: 'all',
  });

  useEffect(() => {
    // Retrieve search parameters from session storage
    const storedParams = sessionStorage.getItem('trainSearchParams');
    
    if (!storedParams) {
      // If no search params found, redirect back to home
      navigate('/');
    } else {
      const params = JSON.parse(storedParams);
      setSearchParams(params);
      fetchTrains(params);
    }
  }, [navigate]);

  const fetchTrains = async (params) => {
    setLoading(true);
    try {
      // Get source and destination stations from search parameters
      const { fromStation, toStation } = params;
      
      // Fetch trains from API using source and destination
      const apiUrl = `http://localhost:5000/api/trains/${encodeURIComponent(fromStation)}/${encodeURIComponent(toStation)}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trains');
      }
      
      const data = await response.json();
      setTrains(data);
    } catch (error) {
      console.error('Error fetching trains:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  const applyFilters = (trainList) => {
    return trainList.filter(train => {
      // Filter by departure time
      if (filters.departureTime !== 'all') {
        const departureHour = new Date(train.DepartureTime).getHours();
        const [startHour, endHour] = filters.departureTime.split('-').map(Number);
        
        if (!(departureHour >= startHour && departureHour < endHour)) {
          return false;
        }
      }
      
      // Filter by train type
      if (filters.trainType !== 'all' && train.TrainType !== filters.trainType) {
        return false;
      }
      
      // Filter by coach type
      if (filters.coachType !== 'all') {
        // Check if train has coaches of this type
        const hasCoachType = train.AvailableCoaches && train.AvailableCoaches.some(coach => coach.type === filters.coachType);
        if (!hasCoachType) {
          return false;
        }
      }
      
      return true;
    });
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

  const filteredTrains = applyFilters(trains);

  if (loading) {
    return (
      <div className="train-search-results-page">
        <IRCTCNavbar isLoggedIn={false} username="" />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Searching for trains...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="train-search-results-page">
        <IRCTCNavbar isLoggedIn={false} username="" />
        <div className="error-container">
          <h3>No Train Found</h3>
          {/* <p>{error}</p> */}
          <button className="btn-primary" onClick={() => navigate('/')}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="train-search-results-page">
      <IRCTCNavbar isLoggedIn={false} username="" />
      
      <div className="search-header">
        <div className="container">
          <div className="search-summary">
            <h2>
              {searchParams?.fromStation} <span className="to-arrow">→</span> {searchParams?.toStation}
            </h2>
            <p className="journey-date">
              {searchParams && formatDate(searchParams.journeyDate)} | 
              Class: {searchParams?.journeyClass} | 
              Quota: {searchParams?.quota}
            </p>
          </div>
          
          <button className="btn-modify" onClick={() => navigate('/')}>
            Modify Search
          </button>
        </div>
      </div>
      
      <div className="container main-content">
        <div className="sidebar">
          <div className="filter-section">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <h4>Departure Time</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="departureTime" 
                    value="all"
                    checked={filters.departureTime === 'all'} 
                    onChange={() => handleFilterChange('departureTime', 'all')}
                  />
                  <span>All Times</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="departureTime" 
                    value="0-6"
                    checked={filters.departureTime === '0-6'} 
                    onChange={() => handleFilterChange('departureTime', '0-6')}
                  />
                  <span>00:00 - 06:00</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="departureTime" 
                    value="6-12"
                    checked={filters.departureTime === '6-12'} 
                    onChange={() => handleFilterChange('departureTime', '6-12')}
                  />
                  <span>06:00 - 12:00</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="departureTime" 
                    value="12-18"
                    checked={filters.departureTime === '12-18'} 
                    onChange={() => handleFilterChange('departureTime', '12-18')}
                  />
                  <span>12:00 - 18:00</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="departureTime" 
                    value="18-24"
                    checked={filters.departureTime === '18-24'} 
                    onChange={() => handleFilterChange('departureTime', '18-24')}
                  />
                  <span>18:00 - 24:00</span>
                </label>
              </div>
            </div>
            
            <div className="filter-group">
              <h4>Train Type</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="trainType" 
                    value="all"
                    checked={filters.trainType === 'all'} 
                    onChange={() => handleFilterChange('trainType', 'all')}
                  />
                  <span>All Types</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="trainType" 
                    value="Rajdhani"
                    checked={filters.trainType === 'Rajdhani'} 
                    onChange={() => handleFilterChange('trainType', 'Rajdhani')}
                  />
                  <span>Rajdhani</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="trainType" 
                    value="Shatabdi"
                    checked={filters.trainType === 'Shatabdi'} 
                    onChange={() => handleFilterChange('trainType', 'Shatabdi')}
                  />
                  <span>Shatabdi</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="trainType" 
                    value="Superfast"
                    checked={filters.trainType === 'Superfast'} 
                    onChange={() => handleFilterChange('trainType', 'Superfast')}
                  />
                  <span>Superfast</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="trainType" 
                    value="Express"
                    checked={filters.trainType === 'Express'} 
                    onChange={() => handleFilterChange('trainType', 'Express')}
                  />
                  <span>Express</span>
                </label>
              </div>
            </div>
            
            <div className="filter-group">
              <h4>Coach Type</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="coachType" 
                    value="all"
                    checked={filters.coachType === 'all'} 
                    onChange={() => handleFilterChange('coachType', 'all')}
                  />
                  <span>All Classes</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="coachType" 
                    value="1A"
                    checked={filters.coachType === '1A'} 
                    onChange={() => handleFilterChange('coachType', '1A')}
                  />
                  <span>First AC (1A)</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="coachType" 
                    value="2A"
                    checked={filters.coachType === '2A'} 
                    onChange={() => handleFilterChange('coachType', '2A')}
                  />
                  <span>Second AC (2A)</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="coachType" 
                    value="3A"
                    checked={filters.coachType === '3A'} 
                    onChange={() => handleFilterChange('coachType', '3A')}
                  />
                  <span>Third AC (3A)</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="coachType" 
                    value="SL"
                    checked={filters.coachType === 'SL'} 
                    onChange={() => handleFilterChange('coachType', 'SL')}
                  />
                  <span>Sleeper (SL)</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="coachType" 
                    value="CC"
                    checked={filters.coachType === 'CC'} 
                    onChange={() => handleFilterChange('coachType', 'CC')}
                  />
                  <span>Chair Car (CC)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="content">
          <div className="results-header">
            <h3>Available Trains ({filteredTrains.length})</h3>
            
            <div className="sort-options">
              <label>Sort by:</label>
              <select className="sort-select">
                <option value="departure">Departure Time</option>
                <option value="arrival">Arrival Time</option>
                <option value="duration">Journey Duration</option>
                <option value="fare">Fare</option>
              </select>
            </div>
          </div>
          
          <TrainCards trains={filteredTrains} searchParams={searchParams} />
        </div>
      </div>
    </div>
  );
};

export default TrainSearchResultsPage;