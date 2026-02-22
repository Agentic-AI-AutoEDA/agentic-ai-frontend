import React, { useEffect, useState } from 'react';
import api from '../../api.js';
import '../../styles/Agents.css';
import Button from "../common/Button.jsx";

const AgentList = ({ navigate }) => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const handleDelete = async (agentId) => {
        try {
            await api.delete(`agents/${agentId}/`);
            setAgents(agents.filter(agent => agent.id !== agentId));
            setError(null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to delete agent';
            setError(errorMessage);
        }
    };

    if (loading) return <p>Loading agents...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="agent-list">
            <div className="upload-section">
                <h3>Available Agents</h3>
                <Button onClick={() => navigate('/agents/create')}>
                    Create Agent
                </Button>
            </div>
            <div className="table-wrapper">
                <table>
                    <thead>
                    <tr>
                        <th>S No.</th>
                        <th>Name</th>
                        <th>Backstory</th>
                        <th>Data Source</th>
                        <th>Created At</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {agents.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="empty-row-cell">
                                No agents found. Create your first agent!
                            </td>
                        </tr>
                    ) : (
                        agents.map((agent, index) => (
                            <tr key={agent.id}>
                                <td>{index + 1}</td>
                                <td>{agent.name}</td>
                                <td>{agent.backstory || 'N/A'}</td>
                                <td>{agent.data_source_name || 'N/A'}</td>
                                <td>{new Date(agent.created_at).toLocaleString()}</td>
                                <td>
                                    <Button onClick={() => navigate(`/agents/agent-detail/${agent.id}`)}>
                                        View
                                    </Button>
                                    &nbsp;&nbsp;
                                    <Button onClick={() => navigate(`/agents/edit/${agent.id}`)}>
                                        Edit
                                    </Button>
                                    &nbsp;&nbsp;
                                    <Button className="btn-delete" onClick={() => handleDelete(agent.id)}>
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AgentList;
