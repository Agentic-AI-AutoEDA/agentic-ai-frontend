import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import api from '../../api.js';
import '../../styles/Agents.css';
import Button from "../common/Button.jsx";

const AgentDetails = ({ navigate }) => {
    const { agentId } = useParams();
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAgent();
    }, [agentId]);

    const fetchAgent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`agents/${agentId}/`);
            setAgent(response.data.data);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to load agent';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading agent...</p>;
    if (error) {
        return (
            <div className="full-content">
                <div className="full-content-header">
                    <Button onClick={() => navigate(-1)}>Back</Button>
                </div>
                <p className="error-message">{error}</p>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="full-content">
                <div className="full-content-header">
                    <Button onClick={() => navigate(-1)}>Back</Button>
                </div>
                <p className="error-message">Agent not found</p>
            </div>
        );
    }

    return (
        <div className="full-content">
            <div className="full-content-header">
                <h4>{agent.name}</h4>
                <div>
                    <Button onClick={() => navigate(`/agents/edit/${agent.id}`)}>
                        Edit
                    </Button>
                    &nbsp;&nbsp;
                    <Button onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </div>
            <div className="agent-details-content">
                <div className="detail-row">
                    <strong>Name:</strong>
                    <span>{agent.name}</span>
                </div>
                <div className="detail-row">
                    <strong>Backstory:</strong>
                    <span>{agent.backstory || 'N/A'}</span>
                </div>
                <div className="detail-row">
                    <strong>Data Source:</strong>
                    <span>{agent.data_source_name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                    <strong>Created At:</strong>
                    <span>{new Date(agent.created_at).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                    <strong>Updated At:</strong>
                    <span>{agent.updated_at ? new Date(agent.updated_at).toLocaleString() : 'N/A'}</span>
                </div>
            </div>
        </div>
    );
};

export default AgentDetails;
