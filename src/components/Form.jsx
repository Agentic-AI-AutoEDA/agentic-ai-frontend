import {useState} from 'react';
import {useNavigate} from "react-router";
import api from "../api.js";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

const Form = ({ route, method }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const name = method === 'login' ? "Login" : "Register";

    const [error, setError] = useState({});
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post(route, {username, password, email});
            const payload = response.data;
            setMessage(payload.message);
            setError(payload.error);
            if (method === 'login') {
                const access = payload?.data?.access;
                const refresh = payload?.data?.refresh;
                if (access && refresh) {
                    localStorage.setItem(ACCESS_TOKEN, access);
                    localStorage.setItem(REFRESH_TOKEN, refresh);
                    navigate('/');
                }
            } else {
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
            <form action="" onSubmit={handleSubmit} className={"form-container"}>
                <h1>{name}</h1>
                <input
                    className={"form-input"}
                    value={username}
                    type="text"
                    placeholder="Username"
                    onChange={(e) => {setUsername(e.target.value)}}
                />
                {error?.username && <p>{error.username}</p>}
                { name === 'Register' ?
                    <input
                        className={"form-input"}
                        value={email}
                        type="email"
                        placeholder="Email"
                        onChange={(e) => {setEmail(e.target.value)}}
                    /> : null
                }
                {error?.email && <p>{error.email}</p>}
                <input
                    className={"form-input"}
                    value={password}
                    type="password"
                    placeholder="Password"
                    onChange={(e) => {setPassword(e.target.value)}}
                />
                {error?.password && <p>{error.password}</p>}
                {message && <p>{message}</p>}
                <button className='form-button' type="submit">
                    {loading ? 'Loading...' : name}
                </button>
            </form>
        </>
    );
};

export default Form;
