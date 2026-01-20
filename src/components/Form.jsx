import {useState} from 'react';
import {Link, useNavigate} from "react-router";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";
import '../styles/Form.css'

const Form = ({ route, method }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [error, setError] = useState({});
    const [message, setMessage] = useState('');

    const isLogin = method === 'login';
    const title = isLogin ? "Welcome back" : "Create account";
    const subtitle = isLogin
        ? "Sign in to continue to Agentic AI EDA"
        : "Get started with Agentic AI EDA";
    const buttonText = isLogin ? "Sign In" : "Create Account";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post(route, {username, password, email});
            const payload = response.data;
            setMessage(payload.message);
            setError(payload.error);
            if (method === 'login'  && response.status === 200 && payload.status === 200) {
                const access = payload?.data?.access;
                const refresh = payload?.data?.refresh;
                if (access && refresh) {
                    localStorage.setItem(ACCESS_TOKEN, access);
                    localStorage.setItem(REFRESH_TOKEN, refresh);
                    navigate('/home');
                }
            } else if (method === 'register' && response.status === 200 && payload.status === 201) {
                navigate('/login');
            }
        } catch (error) {
            if (error.response && error.response.data) {
                const payload = error.response.data;
                setMessage(payload.message || "An error occurred. Please try again.");
                setError(payload.error);
            } else {
                setMessage("Network error. Is the backend running?");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 className="auth-title">{title}</h1>
                        <p className="auth-subtitle">{subtitle}</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {message && (
                            <div className="error-message">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {message}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                className={`form-input ${error?.username ? 'error' : ''}`}
                                placeholder={isLogin ? "Enter your username" : "Choose a username"}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            {error?.username && <span className="field-error">{error.username}</span>}
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className={`form-input ${error?.email ? 'error' : ''}`}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {error?.email && <span className="field-error">{error.email}</span>}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className={`form-input ${error?.password ? 'error' : ''}`}
                                placeholder={isLogin ? "Enter your password" : "Create a password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {error?.password && <span className="field-error">{error.password}</span>}
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <div className="loading-spinner"></div> : buttonText}
                        </button>
                    </form>

                    <div className="auth-footer">
                        {isLogin ? (
                            <>Don't have an account? <Link to="/register">Create one</Link></>
                        ) : (
                            <>Already have an account? <Link to="/login">Sign in</Link></>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Form;
