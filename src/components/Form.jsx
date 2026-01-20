import {useState} from 'react';
import {useNavigate} from "react-router";
import api from "../api.js";
import {ACCESS_TOKEN, REFRESH_TOKEN} from "../constants.js";

const Form = ({route, method}) => {
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
            setMessage(response.data.message);
            setError(response.data.error);
            if (method === 'login' && response.data.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, response.data.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.data.refresh);
                navigate('/');
            } else if (method === 'register' && response.data.status === 200) {
                navigate('/login');
            }
        } catch (error) {
            console.log(error);
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