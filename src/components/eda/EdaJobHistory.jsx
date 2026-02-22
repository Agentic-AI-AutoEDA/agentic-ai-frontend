import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api.js';
import '../../styles/RunAnalysis.css';
import Button from '../common/Button.jsx';

const STATUS_ORDER = { running: 0, queued: 1, pending: 2, completed: 3, failed: 4 };

const EdaJobHistory = ({ navigate }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobs = useCallback(async () => {
        try {
            const response = await api.get('eda/history/');
            const jobData = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data.data)
                    ? response.data.data
                    : [];
            jobData.sort((a, b) => {
                const sa = STATUS_ORDER[a.status] ?? 3;
                const sb = STATUS_ORDER[b.status] ?? 3;
                if (sa !== sb) return sa - sb;
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setJobs(jobData);
            setError(null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch job history';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const getStatusBadge = (status) => (
        <span className={`eda-status-badge status-${status}`}>{status}</span>
    );

    const getProgressBar = (progress) => {
        const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : 0;
        const bucket = Math.round(pct / 5) * 5;
        const pctClass = `pct-${bucket}`;
        return (
            <div className="eda-progress-bar-wrapper">
                <div className="eda-progress-bar">
                    <div className={`eda-progress-fill ${pctClass}`} />
                </div>
                <span className="eda-progress-text">{pct}%</span>
            </div>
        );
    };

    const handleAction = (job) => {
        if (job.status === 'completed' && job.has_result) {
            navigate(`/eda/result/${job.id}`);
        } else if (job.status === 'running' || job.status === 'queued' || job.status === 'pending') {
            navigate(`/eda/status/${job.id}`);
        }
    };

    if (loading) return <p className="eda-loading">Loading job history...</p>;

    return (
        <div className="eda-history-container">
            <div className="upload-section">
                <h3>EDA Job History</h3>
                <Button onClick={() => navigate('/eda')}>New Analysis</Button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {jobs.length === 0 ? (
                <div className="eda-empty-msg">
                    No EDA jobs found. Start your first analysis!
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="eda-history-table">
                        <thead>
                            <tr>
                                <th>S No.</th>
                                <th>Agent</th>
                                <th>Goal</th>
                                <th>Dataset Domain</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Created</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job, idx) => (
                                <tr key={job.id} className={`eda-history-row status-row-${job.status}`}>
                                    <td>{idx + 1}</td>
                                    <td>{job.agent_name || 'N/A'}</td>
                                    <td>{job.goal || 'N/A'}</td>
                                    <td>{job.dataset_domain || 'N/A'}</td>
                                    <td>{getStatusBadge(job.status)}</td>
                                    <td>{getProgressBar(job.progress)}</td>
                                    <td>{job.created_at ? new Date(job.created_at).toLocaleString() : 'N/A'}</td>
                                    <td>
                                        {job.status === 'completed' && job.has_result ? (
                                            <Button onClick={() => handleAction(job)}>
                                                View Result
                                            </Button>
                                        ) : job.status === 'running' || job.status === 'queued' || job.status === 'pending' ? (
                                            <Button onClick={() => handleAction(job)}>
                                                Check Status
                                            </Button>
                                        ) : job.status === 'failed' ? (
                                            <span className="eda-error-hint" title={job.error_message || 'Unknown error'}>
                                                ⚠️ {job.error_message ? (job.error_message.length > 30 ? job.error_message.slice(0, 30) + '...' : job.error_message) : 'Failed'}
                                            </span>
                                        ) : (
                                            <span>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EdaJobHistory;

