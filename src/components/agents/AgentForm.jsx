import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import api from '../../api.js';
import '../../styles/Agents.css';
import Button from "../common/Button.jsx";
import Input from "../common/Input.jsx";

const AgentForm = ({ navigate, mode }) => {
    const { agentId } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        data_source: ''
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({});
    const [message, setMessage] = useState('');
    const [fetchingAgent, setFetchingAgent] = useState(false);

    const isEditMode = mode === 'edit';

    useEffect(() => {
        fetchFiles();
        if (isEditMode && agentId) {
            fetchAgent();
        }
    }, [agentId, isEditMode]);

    const fetchFiles = async () => {
        try {
            const response = await api.get('resources/files/');
            const fileData = Array.isArray(response.data.data) ? response.data.data : [];
            setFiles(fileData);
        } catch (err) {
            console.error('Failed to fetch files:', err);
        }
    };

    const fetchAgent = async () => {
        setFetchingAgent(true);
        try {
            const response = await api.get(`agents/${agentId}/`);
            const agentData = response.data.data;
            setFormData({
                name: agentData.name || '',
                data_source_name: agentData.data_source_name || ''
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to load agent';
            setMessage(errorMessage);
        } finally {
            setFetchingAgent(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));};

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError({});
        setMessage('');

        const validationErrors = {};
        if (!formData.name.trim()) {
            validationErrors.name = 'Agent name is required';
        }
        if (!formData.data_source && !isEditMode) {
            validationErrors.data_source = 'Data source is required';
        }
        if (Object.keys(validationErrors).length >0) {
            setError(validationErrors);
            setLoading(false);
            return;
        }

        try {
            const payload = {
                name: formData.name.trim(),
                data_source: formData.data_source
            };

            const response = isEditMode
                ? await api.put(`agents/${agentId}/`, payload)
                : await api.post('agents/', payload);

            if (![200,201].includes(response.data.status)) {
                throw { response: { data: response.data } };
            }

            setMessage(response.data.message || 'Agent saved successfully');
            const createdAgentId = isEditMode ? agentId : response.data.data?.id;

            // If creating new agent, generate schema metadata and navigate to schema detail
            if (!isEditMode && createdAgentId) {
                try {
                    await api.post(`agents/${createdAgentId}/metadata/schema/generate/`);
                    navigate(`/agents/schema/${createdAgentId}`);
                } catch (schemaError) {
                    console.error('Failed to generate schema:', schemaError);
                    navigate(`/agents/agent-detail/${createdAgentId}`);
                }
            } else {
                navigate(`/agents/schema/${createdAgentId}`);
            }

        } catch (error) {
            if (error.response && error.response?.data) {
                const payload = error.response.data;
                setMessage(payload.message || 'Failed to save agent');
                setError(payload.error || {});
            } else {
                setMessage('Network error. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetchingAgent) return <p>Loading agent...</p>;

    return (
        <div className="agent-form-container">
            <div className="full-content">
                <div className="full-content-header">
                    <h4>{isEditMode ? 'Edit Agent' : 'Create New Agent'}</h4>
                    <Button onClick={() => navigate('/agents')}>
                        Cancel
                    </Button>
                </div>

                <form className="agent-form" onSubmit={handleSubmit}>
                    <Input
                        id="name"
                        label="Agent Name *"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter agent name"
                        error={error?.name}
                    />


                    <div className="input-wrapper">
                        {isEditMode ? (
                            <Input
                                id="data_source"
                                label="Data Source"
                                type="text"
                                value={formData.data_source_name}
                                error={error?.data_source_name}
                                disabled
                            />
                        ) : (
                            <>
                                <label className="form-label" htmlFor="data_source">
                                    Data Source *
                                </label>
                                <select
                                    id="data_source"
                                    name="data_source"
                                    value={formData.data_source}
                                    onChange={handleChange}
                                    className={`form-select ${error?.data_source ? 'error' : ''}`}
                                >
                                    <option value="">Select a data source</option>
                                    {files.map(file => (
                                        <option key={file.id} value={file.id}>
                                            {file.original_filename}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                        {error?.data_source && (
                            <span className="field-error">{Array.isArray(error.data_source) ? error.data_source[0] : error.data_source}</span>
                        )}
                    </div>

                    <div className="form-actions">
                        <Button type="submit" disabled={loading}>
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgentForm;
