import React from 'react';
import { Link } from "react-router";
import '../styles/Header.css';

const Header = () => {
    return (
        <header className="header">
            <Link to="/" className="header-logo">Agentic AI EDA</Link>
            <nav className="header-nav">
                <Link className="header-link" to="/login">Login</Link>
                <Link className="header-link" to="/register">Register</Link>
            </nav>
        </header>
    );
};

export default Header;
