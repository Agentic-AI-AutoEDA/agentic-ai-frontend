import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

function PublicRoute({ children }) {
    const isLoggedIn = useAuth();

    if (isLoggedIn === null) {
        return <div>Loading...</div>;
    }

    return isLoggedIn ? <Navigate to="/" /> : children;
}

export default PublicRoute;
