import React, { createContext } from 'react';
import Header from '../Header.jsx';
import Footer from '../Footer.jsx';

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
