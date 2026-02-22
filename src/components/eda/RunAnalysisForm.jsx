import React, { useEffect, useState } from 'react';
import api from '../../api.js';
import '../../styles/RunAnalysis.css';
import Button from '../common/Button.jsx';
import Input from "../common/Input.jsx";

const RunAnalysisForm = ({ navigate }) => {
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [goal, setGoal] = useState('');
    const [targetColumn, setTargetColumn] = useState('');
    const [datasetDomain, setDatasetDomain] = useState('');
    const [datasetDescription, setDatasetDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await api.get('agents/');
            const agentData = Array.isArray(response.data.data) ? response.data.data : [];
            setAgents(agentData);
            setError(null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch agents';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAgent) {
            setError('Please select an agent');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const payload = {};
            if (goal.trim()) payload.goal = goal.trim();
            if (targetColumn.trim()) payload.target_column = targetColumn.trim();
            if (datasetDomain.trim()) payload.dataset_domain = datasetDomain.trim();
            if (datasetDescription.trim()) payload.dataset_description = datasetDescription.trim();

            const response = await api.post(`eda/start/${selectedAgent}/`, payload);
            const jobId = response.data.data?.job_id;

            if (!jobId) {
                setError('No job ID returned from server');
                setSubmitting(false);
                return;
            }

            navigate(`/eda/status/${jobId}`);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to start EDA';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="eda-loading">Loading agents...</p>;

    return (
        <div className="eda-form-container">
            <div className="upload-section">
                <h3>Run Exploratory Data Analysis</h3>
            </div>

            <form className="eda-form" onSubmit={handleSubmit}>
                <div className="eda-form-group">
                    <label className="form-label" htmlFor="agent-select">Select Agent *</label>
                    <select
                        id="agent-select"
                        className={`form-select ${!selectedAgent && error ? 'error' : ''}`}
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                    >
                        <option value="">-- Choose an agent --</option>
                        {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name} {agent.data_source_name ? `(${agent.data_source_name})` : ''}
                            </option>
                        ))}
                    </select>
                    {agents.length === 0 && (
                        <p className="eda-hint">
                            No agents found.{' '}
                            <span className="eda-link" onClick={() => navigate('/agents/create')}>
                                Create an agent first
                            </span>
                        </p>
                    )}
                </div>

                <Input
                    id="goal"
                    label="Analysis Goal (optional)"
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Analyze customer churn patterns and identify key predictors..."
                    error={error?.goal}
                />

                <Input
                    id="target-column"
                    label="Target Column (optional)"
                    type="text"
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    placeholder="e.g., churn_flag"
                    error={error?.target_column}
                />

                <Input
                    id="dataset-domain"
                    label="Dataset Domain (optional)"
                    type="text"
                    value={datasetDomain}
                    onChange={(e) => setDatasetDomain(e.target.value)}
                    placeholder="e.g., e-commerce / finance / healthcare"
                    error={error?.dataset_domain}
                />

                <Input
                    id="dataset-description"
                    label="Dataset Description (optional)"
                    value={datasetDescription}
                    onChange={(e) => setDatasetDescription(e.target.value)}
                    placeholder="Briefly describe the dataset source, columns, and scope"
                    error={error?.dataset_description}
                />

                {error && <p className="error-message">{error}</p>}

                <div className="form-actions">
                    <Button type="submit" disabled={submitting || agents.length === 0}>
                        {submitting ? 'Starting Analysis...' : 'Start EDA'}
                    </Button>
                    <Button onClick={() => navigate('/eda/history')}>
                        History
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default RunAnalysisForm;
