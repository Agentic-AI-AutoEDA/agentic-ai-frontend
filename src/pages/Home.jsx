import React from 'react';
import '../styles/Home.css';

const Home = () => (
    <div className="center-content">
        <section className="welcome-section">
            <h1 className="page-title">
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
);

export default Home;
