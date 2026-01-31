import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth.js";

function PublicRoute({ children }) {
    const isLoggedIn = useAuth();

    if (isLoggedIn === null) {
        return <div>Loading...</div>;
    }

    return isLoggedIn ? <Navigate to="/home" replace /> : children;
}

export default PublicRoute;
