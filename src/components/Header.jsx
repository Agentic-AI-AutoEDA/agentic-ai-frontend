import React from 'react';
import { useAuth } from "../hooks/useAuth.js";
import { Link, useNavigate } from "react-router";
import '../styles/Header.css';

const Header = () => {
    const isLoggedIn = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/');
    };

    return (
        <header className="header">
            <Link to="/" className="header-logo">Agentic AI EDA</Link>
            <nav className="header-nav">
                {isLoggedIn ? (
                    <>
                        <Link className="header-link" to="/home">Home</Link>
                        <button className="header-btn" onClick={handleLogout}>Log out</button>
                    </>
                ) : (
                    <>
                        <Link className="header-link" to="/login">Login</Link>
                        <Link className="header-link" to="/register">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Header;
