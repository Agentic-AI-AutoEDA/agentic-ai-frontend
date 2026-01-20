import React, { useContext } from 'react';
import { LayoutContext } from "../context/LayoutContext.jsx";
import '../../styles/Home.css';

const Home = () => {
    const { Header, Footer } = useContext(LayoutContext);

    return (
        <div className="home-wrapper">
            <Header />
            <main className="home-content">
                <section className="welcome-section">
                    <h1 className="page-title">
                        <span className="title-icon">🎯</span>
                        Welcome to Agentic AI EDA
                    </h1>
                    <p className="page-description">
                        Your AI-powered data analysis workspace
                    </p>
                </section>

                <section className="dashboard-section">
                    <div className="dashboard-grid">
                        <div className="dashboard-card">
                            <div className="card-icon">📁</div>
                            <h3>Upload Data</h3>
                            <p>Import CSVs, connect databases, or integrate APIs</p>
                            <button className="card-action">Upload Files</button>
                        </div>

                        <div className="dashboard-card">
                            <div className="card-icon">🤖</div>
                            <h3>Configure Agents</h3>
                            <p>Define intelligent agents with domain context</p>
                            <button className="card-action">Manage Agents</button>
                        </div>

                        <div className="dashboard-card">
                            <div className="card-icon">📊</div>
                            <h3>Run Analysis</h3>
                            <p>Perform end-to-end Exploratory Data Analysis</p>
                            <button className="card-action">Start EDA</button>
                        </div>

                        <div className="dashboard-card">
                            <div className="card-icon">💬</div>
                            <h3>Chat with Data</h3>
                            <p>Ask questions and uncover insights naturally</p>
                            <button className="card-action">Open Chat</button>
                        </div>
                    </div>
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
            </main>
            <Footer />
        </div>
    );
};

export default Home;
