import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import api from '../../api.js';
import '../../styles/RunAnalysis.css';
import Button from '../common/Button.jsx';

const POLL_INTERVAL = 4000;

const EdaJobStatus = ({ navigate }) => {
    const { jobId } = useParams();
    const [status, setStatus] = useState('pending');
    const [error, setError] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);
    const timerRef = useRef(null);

    const pollStatus = useCallback(async () => {
        try {
            const response = await api.get(`eda/status/${jobId}/`);
            const data = response.data;
            const jobStatus = data.data?.status || data.status;

            setStatus(jobStatus);

            if (jobStatus === 'completed') {
                clearInterval(intervalRef.current);
                clearInterval(timerRef.current);
                navigate(`/eda/result/${jobId}`, { replace: true });
            } else if (jobStatus === 'failed') {
                clearInterval(intervalRef.current);
                clearInterval(timerRef.current);
                const errMsg = data.data?.error_message || data.error_message || data.message || 'Analysis failed';
                setError(errMsg);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to check status';
            setError(errorMessage);
            clearInterval(intervalRef.current);
            clearInterval(timerRef.current);
        }
    }, [jobId, navigate]);

    useEffect(() => {
        if (!jobId) return;

        // Defer initial poll to avoid synchronous setState inside effect
        const initialTimeout = setTimeout(pollStatus, 0);
        intervalRef.current = setInterval(pollStatus, POLL_INTERVAL);
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(intervalRef.current);
            clearInterval(timerRef.current);
        };
    }, [jobId, pollStatus]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="eda-status-container">
            <div className="full-content-header">
                <h3>EDA Analysis</h3>
                <Button onClick={() => navigate('/eda')}>Back</Button>
            </div>

            <div className="eda-status-card">
                {!error ? (
                    <>
                        <div className="eda-spinner-wrapper">
                            <div className="eda-spinner" />
                        </div>
                        <h4 className="eda-status-text">
                            {(status === 'pending' || status === 'queued') && 'Queued — waiting to start...'}
                            {status === 'running' && 'Analyzing your dataset...'}
                            {status === 'completed' && 'Analysis complete! Redirecting...'}
                            {!['pending', 'queued', 'running', 'completed', 'failed'].includes(status) && `Status: ${status}`}
                        </h4>
                        <p className="eda-elapsed">Elapsed: {formatTime(elapsed)}</p>
                        <p className="eda-job-id">Job ID: {jobId}</p>
                    </>
                ) : (
                    <>
                        <div className="eda-error-icon">✕</div>
                        <h4 className="eda-status-text eda-status-failed">Analysis Failed</h4>
                        <p className="error-message">{error}</p>
                        <p className="eda-job-id">Job ID: {jobId}</p>
                        <div className="form-actions eda-form-actions-top">
                            <Button onClick={() => navigate('/eda')}>
                                Try Again
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EdaJobStatus;
