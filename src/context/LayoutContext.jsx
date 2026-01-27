import React, { createContext } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
    return (
        <>
            <LayoutContext.Provider value={{ Header, Footer }}>
                {children}
            </LayoutContext.Provider>
        </>
    );
};

export {LayoutContext};
