import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

export const useAuth = () => {
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        const refreshToken = async () => {
            const token = localStorage.getItem(REFRESH_TOKEN);
            try {
                const response = await api.post("user/token/refresh/", {
                    refresh: token
                });
                if (response.status === 200) {
                    localStorage.setItem(ACCESS_TOKEN, response.data.access);
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.log(error);
                setIsAuthorized(false);
            }
        };

        const auth = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                setIsAuthorized(false);
                return;
            }
            const decoded = jwtDecode(token);
            const tokenExpiration = decoded.exp;
            const now = Date.now() / 1000;

            if (tokenExpiration < now) {
                await refreshToken();
            } else {
                setIsAuthorized(true);
            }
        };

        auth().catch(() => setIsAuthorized(false));
    }, []);

    return isAuthorized;
};
