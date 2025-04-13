import React from 'react';
import './Style/Footer.css';

const Footer = () => {
    return (
        <footer className="irctc-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h4>IRCTC</h4>
                        <ul>
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">Terms & Conditions</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Travel Info</h4>
                        <ul>
                            <li><a href="#">Train Time Table</a></li>
                            <li><a href="#">Refund Rules</a></li>
                            <li><a href="#">Fare Calculator</a></li>
                            <li><a href="#">Railway Map</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Services</h4>
                        <ul>
                            <li><a href="#">IRCTC Holidays</a></li>
                            <li><a href="#">E-Catering</a></li>
                            <li><a href="#">Retiring Rooms</a></li>
                            <li><a href="#">Tourist Trains</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Connect With Us</h4>
                        <div className="social-links">
                            <a href="#" className="social-icon facebook"></a>
                            <a href="#" className="social-icon twitter"></a>
                            <a href="#" className="social-icon instagram"></a>
                            <a href="#" className="social-icon youtube"></a>
                        </div>
                        <div className="helpline">
                            <p>Customer Care</p>
                            <a href="tel:1800111139">1800-111-139</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} IRCTC Ltd. All rights reserved.</p>
                    <div className="payment-methods">
                        <span>We accept:</span>
                        <div className="payment-icons">
                            <div className="payment-icon visa"></div>
                            <div className="payment-icon mastercard"></div>
                            <div className="payment-icon rupay"></div>
                            <div className="payment-icon upi"></div>
                            <div className="payment-icon netbanking"></div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;