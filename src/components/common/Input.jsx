import React, { useState } from 'react';
import '../../styles/Input.css'

const EyeIcon = ({ visible, onClick }) => (
    <span
        className="eye-icon"
        onClick={onClick}
        tabIndex={0}
        aria-label={visible ? "Hide password" : "Show password"}
        role="button"
    >
        {visible ? (
            // Eye open SVG
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <ellipse cx="12" cy="12" rx="8" ry="5" />
                <circle cx="12" cy="12" r="2.5" />
            </svg>
        ) : (
            // Eye closed SVG
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <ellipse cx="12" cy="12" rx="8" ry="5" />
                <circle cx="12" cy="12" r="2.5" />
                <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
        )}
    </span>
);

const Input = ({
                   id,
                   type = 'text',
                   value,
                   onChange,
                   placeholder = '',
                   className = '',
                   error,
                   label,
                   ...rest
               }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="input-wrapper">
            {label && <label className="form-label" htmlFor={id}>{label}</label>}
            <input
                id={id}
                type={isPassword && showPassword ? 'text' : type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`form-input ${error ? 'error' : ''} ${className}`}
                autoComplete={isPassword ? 'current-password' : undefined}
                {...rest}
            />
            {isPassword && (
                <EyeIcon
                    visible={showPassword}
                    onClick={() => setShowPassword(v => !v)}
                />
            )}
            {error && <span className="field-error">{error}</span>}
        </div>
    );
};

export default Input;
