import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import './Style/Navbar.css';
import Cookies from 'js-cookie';

const IRCTCNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isLoggedIn = Cookies.get('authToken');
    const username = localStorage.getItem('username');
    
    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.profile-dropdown')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    // Function to check if a nav link is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Improved logout handler
    const handleLogout = () => {
        // Clear auth data from localStorage
        Cookies.remove('authToken');
        localStorage.clear();
        sessionStorage.clear();
        localStorage.clear();
        
        // Close menus
        setShowDropdown(false);
        setIsMenuOpen(false);
        
        // Navigate to home page
        navigate('/');
        
        // Force page reload to ensure all components update their auth state
        window.location.reload();
    };

    return (
        <nav className={`irctc-navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
                <div className="navbar-content">
                    <div className="navbar-left">
                        {/* Logo */}
                        <div className="navbar-logo">
                            <Link to="/">
                                <div className="logo-icon"></div>
                                <div className="logo-text-container">
                                    <span className="logo-text">IRCTC</span>
                                    <span className="logo-tagline">Digital Railways</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                    
                    {/* Main Navigation */}
                    <div className="navbar-center">
                        <div className="navbar-links-desktop">
                            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
                            <Link to="/train-search-results" className={`nav-link ${isActive('/train-search-results') ? 'active' : ''}`}>Search Trains</Link>
                            <Link to="/train-booking" className={`nav-link ${isActive('/train-booking') ? 'active' : ''}`}>Book Ticket</Link>
                            <Link to="/pnr" className={`nav-link ${isActive('/pnr') ? 'active' : ''}`}>PNR Status</Link>
                            <Link to="/services" className={`nav-link ${isActive('/services') ? 'active' : ''}`}>Services</Link>
                        </div>
                    </div>

                    {/* Auth Section */}
                    <div className="navbar-right">
                        <div className="navbar-auth-desktop">
                            {isLoggedIn ? (
                                <div className="profile-dropdown">
                                    <button className="profile-button" onClick={toggleDropdown}>
                                        <img
                                            src="https://cdn-icons-png.flaticon.com/512/7915/7915522.png"
                                            alt="Profile"
                                            className="profile-image"
                                        />
                                        <span>{username || 'User'}</span>
                                    </button>
                                    <div className={`dropdown-menu ${showDropdown ? 'show' : ''}`}>
                                        <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>Your Profile</Link>
                                        <Link to="/my-bookings" className={isActive('/my-bookings') ? 'active' : ''}>My Bookings</Link>
                                        <Link to="/settings" className={isActive('/settings') ? 'active' : ''}>Settings</Link>
                                        <button onClick={handleLogout} className="logout-button">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="auth-buttons">
                                    <Link to="/login" className={`btn btn-outline login-button ${isActive('/login') ? 'active' : ''}`}>Login</Link>
                                    <Link to="/register" className={`btn btn-primary register-button ${isActive('/register') ? 'active' : ''}`}>Register</Link>
                                </div>
                            )}
                        </div>

                        {/* Language Selector */}
                        <div className="language-selector desktop-only">
                            <select>
                                <option>English</option>
                                <option>हिंदी</option>
                                <option>தமிழ்</option>
                                <option>తెలుగు</option>
                            </select>
                        </div>

                        {/* Mobile menu button */}
                        <div className="navbar-mobile-button">
                            <button onClick={toggleMenu} aria-label="Toggle menu">
                                <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
                <Link to="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
                <Link to="/train-search-results" className={`mobile-nav-link ${isActive('/train-search-results') ? 'active' : ''}`}>Search Trains</Link>
                <Link to="/train-booking" className={`mobile-nav-link ${isActive('/train-booking') ? 'active' : ''}`}>Book Ticket</Link>
                <Link to="/pnr" className={`mobile-nav-link ${isActive('/pnr') ? 'active' : ''}`}>PNR Status</Link>
                <Link to="/services" className={`mobile-nav-link ${isActive('/services') ? 'active' : ''}`}>Services</Link>

                {/* Language selector for mobile */}
                <div className="mobile-language-selector">
                    <label>Language:</label>
                    <select>
                        <option>English</option>
                        <option>हिंदी</option>
                        <option>தமிழ்</option>
                        <option>తెలుగు</option>
                    </select>
                </div>

                {/* Auth buttons for mobile */}
                {isLoggedIn ? (
                    <div className="mobile-auth">
                        <div className="mobile-profile">
                            <img
                                src="/api/placeholder/32/32"
                                alt="Profile"
                                className="profile-image-mobile"
                            />
                            <span>{username || 'User'}</span>
                        </div>
                        <Link to="/profile" className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}>Your Profile</Link>
                        <Link to="/bookings" className={`mobile-nav-link ${isActive('/bookings') ? 'active' : ''}`}>My Bookings</Link>
                        <Link to="/settings" className={`mobile-nav-link ${isActive('/settings') ? 'active' : ''}`}>Settings</Link>
                        <button onClick={handleLogout} className="mobile-nav-link highlight">
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="mobile-auth">
                        <Link to="/login" className={`btn btn-outline mobile-login-button ${isActive('/login') ? 'active' : ''}`}>Login</Link>
                        <Link to="/register" className={`btn btn-primary mobile-register-button ${isActive('/register') ? 'active' : ''}`}>Register</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default IRCTCNavbar;