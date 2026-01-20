import { Link, useNavigate } from "react-router";
import "../styles/PageNotFound.css";

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="notfound-container">
            <div className="notfound-content">
                <div className="notfound-illustration">
                    <div className="notfound-code">404</div>
                </div>
                <h1 className="notfound-title">Page not found</h1>
                <p className="notfound-description">
                    Sorry, we couldn't find the page you're looking for.
                    The page might have been removed or the link might be broken.
                </p>
                <div className="notfound-actions">
                    <Link to="/" className="btn-home">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Go Home
                    </Link>
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotFound;
