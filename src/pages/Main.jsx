import React, {useContext} from 'react';
import '../styles/Main.css';
import { Link } from 'react-router';
import {LayoutContext} from "../context/LayoutContext.jsx";

const Main = () => {
    const { Header, Footer } = useContext(LayoutContext);
    return (
        <div className="main-container">
            <Header />
            <main className="main-content">
                <section className="hero-section">
                    <div className="hero-glow"></div>
                    <div className="hero-content">
                        <div className="hero-badge">
                            AI-Powered Analytics Platform
                        </div>
                        <h1 className="hero-title">
                            Turn Your Data Into
                            <span className="gradient-text"> Intelligence</span>
                        </h1>
                        <p className="hero-subtitle">
                            Harness the power of autonomous AI agents to explore, analyze,
                            and visualize your data. No coding required — just insights.
                        </p>
                    </div>
                </section>

                <section className="cta-section">
                    <div className="cta-card">
                        <div className="cta-content">
                            <h2>Ready to Transform Your Data?</h2>
                            <p>Join to unlock insights faster using AI Agents.</p>
                        </div>
                        <Link to="/register" className="btn btn-cta">
                            Get Started Now
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Main;
