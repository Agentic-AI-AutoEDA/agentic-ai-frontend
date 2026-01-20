import axios from "axios";
import { BASE_URL, ACCESS_TOKEN } from "./constants";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    }
}); 

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use((response) => {
    return response;
    },
    (error) => {
        return Promise.reject(error);
    })

export default api;