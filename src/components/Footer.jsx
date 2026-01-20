import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p className="footer-text">
                    © {new Date().getFullYear()} Agentic AI EDA. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
