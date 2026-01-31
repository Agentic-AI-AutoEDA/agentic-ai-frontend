import React from 'react';
import '../../styles/Button.css'

const Button = ({ onClick, children, className = '', type = 'button', disabled = false }) => (
    <button
        type={type}
        onClick={onClick}
        className={className ? className : 'button'}
        disabled={disabled}
    >
        {children}
    </button>
);

export default Button;
