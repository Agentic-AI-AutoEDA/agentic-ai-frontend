import React, { useState } from 'react';
import '../styles/Home.css';
import FileList from "./Files.jsx";

const Home = () => {
    const [activeSection, setActiveSection] = useState('welcome');

    const renderContent = () => {
        switch (activeSection) {
            case 'dataSource':
                return (
                    <section className="content-section">
                        <FileList />
                    </section>
                );
            case 'configureAgent':
                return (
                    <section className="content-section">
                        <h2>Configure Agent</h2>
                        <p>Agent configuration UI here.</p>
                    </section>
                );
            case 'runAnalysis':
                return (
                    <section className="content-section">
                        <h2>Run Analysis</h2>
                        <p>Analysis tools here.</p>
                    </section>
                );
            default:
                return (
                    <>
                        <div className="center-content">
                            <section className="welcome-section">
                                <h1 className="page-title">
                                    <span className="title-icon">🎯</span>
                                    Welcome to Agentic AI EDA
                                </h1>
                                <p className="page-description">
                                    Your AI-powered data analysis workspace
                                </p>
                            </section>

                            <section className="info-section">
                                <div className="info-card">
                                    <h2>How It Works</h2>
                                    <div className="steps-container">
                                        <div className="step">
                                            <span className="step-number">1</span>
                                            <span className="step-text">Upload your dataset</span>
                                        </div>
                                        <div className="step-divider"></div>
                                        <div className="step">
                                            <span className="step-number">2</span>
                                            <span className="step-text">Configure AI agents</span>
                                        </div>
                                        <div className="step-divider"></div>
                                        <div className="step">
                                            <span className="step-number">3</span>
                                            <span className="step-text">Get automated insights</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="home-wrapper">
            <div className="main-layout">
                <aside className="sidebar">
                    <div className="sidebar-top">
                        <button onClick={() => setActiveSection('dataSource')}>Data Source</button>
                        <button onClick={() => setActiveSection('configureAgent')}>Configure Agent</button>
                        <button onClick={() => setActiveSection('runAnalysis')}>Run Analysis</button>
                    </div>
                    <div className="sidebar-bottom">
                        <button onClick={() => setActiveSection('profile')}>Profile</button>
                        <button onClick={() => setActiveSection('logout')}>Logout</button>
                    </div>
                </aside>
                <main className="content-area">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Home;
