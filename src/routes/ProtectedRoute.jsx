import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth.js";

function ProtectedRoute({ children }) {
    const isAuthorized = useAuth();

    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
