import React from 'react';
import { Outlet, useNavigate } from 'react-router';
import '../styles/Home.css';

const SidebarNavigationLayout = () => {
    const navigate = useNavigate();

    return (
        <div className="home-wrapper">
            <div className="main-layout">
                <aside className="sidebar">
                    <div className="sidebar-top">
                        <button onClick={() => navigate('/files')}>Data Source</button>
                        <button onClick={() => navigate('/configure-agent')}>Configure Agent</button>
                        <button onClick={() => navigate('/run-analysis')}>Run Analysis</button>
                    </div>
                    <div className="sidebar-bottom">
                        <button onClick={() => navigate('/profile')}>Profile</button>
                        <button onClick={() => navigate('/logout')}>Logout</button>
                    </div>
                </aside>
                <main className="content-area">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SidebarNavigationLayout;
