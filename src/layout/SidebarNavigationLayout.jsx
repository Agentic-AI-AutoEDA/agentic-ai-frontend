import React from 'react';
import { Outlet, useNavigate } from 'react-router';
import '../styles/Home.css';
import Button from "../components/common/Button.jsx";

const SidebarNavigationLayout = () => {
    const navigate = useNavigate();

    return (
        <div className="home-wrapper">
            <div className="main-layout">
                <aside className="sidebar">
                    <div className="sidebar-top">
                        <Button className="btn-sidebar" onClick={() => navigate('/files')}>Data Source</Button>
                        <Button className="btn-sidebar" onClick={() => navigate('/agents')}>Configure Agent</Button>
                        <Button className="btn-sidebar" onClick={() => navigate('/run-analysis')}>Run Analysis</Button>
                    </div>
                    <div className="sidebar-bottom">
                        <Button className="btn-sidebar" onClick={() => navigate('/profile')}>Profile</Button>
                        <Button className="btn-sidebar" onClick={() => navigate('/logout')}>Logout</Button>
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
