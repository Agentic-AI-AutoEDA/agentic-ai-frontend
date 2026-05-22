import React, { useEffect, useRef, useState } from 'react';
import api from '../api.js';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import '../styles/Profile.css';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants.js';

const Profile = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState({ type: '', text: '' });
    const [initialUsername, setInitialUsername] = useState('');
    const logoutTimerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async () => {
            setLoading(true);
            setNotice({ type: '', text: '' });
            setErrors({});

            try {
                const response = await api.get('users/profile/');
                const profile = response?.data?.data || {};
                if (!isMounted) return;
                setEmail(profile.email || '');
                setUsername(profile.username || '');
                setInitialUsername(profile.username || '');
            } catch (error) {
                if (!isMounted) return;
                if (error.response && error.response.data) {
                    const payload = error.response.data;
                    setNotice({ type: 'error', text: payload.message || 'Failed to load profile.' });
                    setErrors(payload.error || {});
                } else {
                    setNotice({ type: 'error', text: 'Network error. Is the backend running?' });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setNotice({ type: '', text: '' });
        setErrors({});

        if (!username.trim()) {
            setErrors({ username: 'Username is required.' });
            setSaving(false);
            return;
        }

        if (!currentPassword) {
            setErrors({ current_password: 'Current password is required to update profile.' });
            setSaving(false);
            return;
        }

        const updatePayload = {
            username: username.trim(),
            current_password: currentPassword,
        };

        if (password.trim()) {
            updatePayload.password = password;
        }

        try {
            const response = await api.patch('users/profile/', updatePayload);
            const payload = response?.data || {};
            const profile = payload.data || {};
            const nextUsername = profile.username || username.trim();
            const usernameChanged = nextUsername !== initialUsername;
            const passwordChanged = Boolean(password.trim());
            const successText = payload.message || 'Profile updated successfully.';
            const hasErrors = payload.error && Object.keys(payload.error).length > 0;
            const isSuccess = response.status === 200 && payload.status === 200 && !hasErrors;

            setErrors(payload.error || {});

            if (isSuccess) {
                setNotice({ type: 'success', text: successText });
                setUsername(nextUsername);
                setEmail(profile.email || email);
                setPassword('');
                setCurrentPassword('');

                if (usernameChanged || passwordChanged) {
                    setNotice({ type: 'success', text: `${successText} Redirecting to login...` });
                    if (logoutTimerRef.current) {
                        clearTimeout(logoutTimerRef.current);
                    }
                    logoutTimerRef.current = setTimeout(() => {
                        localStorage.removeItem(ACCESS_TOKEN);
                        localStorage.removeItem(REFRESH_TOKEN);
                        window.location.replace('/login');
                    }, 4000);
                } else {
                    setInitialUsername(nextUsername);
                }
            } else {
                setNotice({ type: 'error', text: payload.message || 'Profile update failed.' });
            }
        } catch (error) {
            if (error.response && error.response.data) {
                const payload = error.response.data;
                setNotice({ type: 'error', text: payload.message || 'An error occurred. Please try again.' });
                setErrors(payload.error || {});
            } else {
                setNotice({ type: 'error', text: 'Network error. Is the backend running?' });
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>Profile</h2>
                    <p>View and update your account details.</p>
                </div>

                {loading ? (
                    <div className="profile-loading">Loading profile...</div>
                ) : (
                    <form className="profile-form" onSubmit={handleSubmit}>
                        {notice.text && (
                            <div className={`profile-notice ${notice.type === 'error' ? 'error' : 'success'}`}>
                                {notice.text}
                            </div>
                        )}

                        <Input
                            id="email"
                            label="Email"
                            type="email"
                            value={email}
                            readOnly
                            className="profile-readonly"
                        />
                        <p className="profile-help">Email address is read-only.</p>

                        <Input
                            id="username"
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Enter your username"
                            error={errors?.username}
                            required
                        />

                        <Input
                            id="password"
                            label="New Password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Leave blank to keep current password"
                            error={errors?.password}
                            autoComplete="new-password"
                        />

                        <Input
                            id="current_password"
                            label="Current Password"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            placeholder="Required to update profile"
                            error={errors?.current_password}
                            autoComplete="current-password"
                            required
                        />

                        <div className="profile-actions">
                            <Button type="submit" disabled={saving}>
                                {saving ? <div className="loading-spinner"></div> : 'Update Profile'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;
