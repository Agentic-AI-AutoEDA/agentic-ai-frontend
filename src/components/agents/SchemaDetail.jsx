import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import api from '../../api.js';
import '../../styles/SchemaMetadata.css';
import Button from "../common/Button.jsx";

const SchemaDetail = ({ navigate }) => {
    const { agentId } = useParams();
    const [agentName, setAgentName] = useState('');
    const [schema, setSchema] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchAgent();
        fetchSchema();
    }, [agentId]);

    const fetchAgent = async () => {
        try {
            const response = await api.get(`agents/${agentId}/`);
            setAgentName(response.data.name || response.data.data?.name);
        } catch (err) {
            console.error('Failed to load agent details:', err);
        }
    };

    const fetchSchema = async (isRetry = false, remainingPolls = 0) => {
        if (!isRetry) {
            setLoading(true);
        }
        setError(null);
        try {
            const response = await api.get(`agents/${agentId}/metadata/schema/`);
            const schemaData = response.data.data || response.data;

            if (!schemaData || Object.keys(schemaData).length === 0) {
                setIsGenerating(true);
                setTimeout(() => fetchSchema(true, remainingPolls), 1000);
                return;
            }

            setSchema(schemaData);

            if (remainingPolls > 0) {
                setIsGenerating(true);
                setTimeout(() => fetchSchema(true, remainingPolls - 1), 1000);
            } else {
                setIsGenerating(false);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to load schema';
            setError(errorMessage);
            setIsGenerating(false);
        } finally {
            if (!isRetry) {
                setLoading(false);
            }
        }
    };

    const handleEdit = () => {
        navigate(`/agents/schema/${agentId}/edit`);
    };

    const handleRegenerate = async () => {
        setIsGenerating(true);
        setSchema(null);
        setMessage('');
        setError(null);
        try {
            await api.post(`agents/${agentId}/metadata/schema/generate/`);
            setMessage('Schema regeneration started');
            fetchSchema(true, 3);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to regenerate schema';
            setError(errorMessage);
            setIsGenerating(false);
        }
    };

    const handleConfirm = async () => {
        setConfirming(true);
        setMessage('');
        try {
            await api.post(`agents/${agentId}/metadata/schema/confirm/`);
            await api.post(`agents/${agentId}/metadata/semantic/generate/`);
            navigate(`/agents/semantic/${agentId}`);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to confirm schema';
            setError(errorMessage);
        } finally {
            setConfirming(false);
        }
    };

    if (loading || isGenerating) {
        return (
            <div className="schema-metadata-container">
                <div className="schema-content">
                    <div className="schema-status loading">
                        <span className="loading-spinner"></span>
                        {isGenerating ? 'Generating schema...' : 'Loading schema...'}
                    </div>
                </div>
            </div>
        );
    }

    if (error && !schema) {
        return (
            <div className="schema-metadata-container">
                <div className="schema-metadata-header">
                    <h4>Schema Metadata</h4>
                    <Button onClick={handleRegenerate}>
                        Regenerate
                    </Button>
                </div>
                <div className="schema-content">
                    <div className="schema-error-message">{error}</div>
                    <div className="schema-actions">
                        <Button onClick={fetchSchema}>Retry</Button>
                        <Button onClick={handleRegenerate}>Regenerate</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="schema-metadata-container">
            <div className="schema-metadata-header">
                <h4>Agent: {agentName || agentId}</h4>
                <div>
                    <Button onClick={handleRegenerate} disabled={confirming}>
                        Regenerate
                    </Button>
                </div>
            </div>
            <div className="schema-content">
                {error && (
                    <div className="schema-status error">{error}</div>
                )}
                <div className="schema-display-wrapper">
                    <div className="schema-editor-label">Schema (JSON)</div>
                    <div className="schema-json-viewer">
                        <pre>
                            {schema ? JSON.stringify(schema, null, 2) : 'No schema available'}
                        </pre>
                    </div>
                </div>
                <div className="schema-button-group">
                    <Button onClick={handleEdit} disabled={confirming}>
                        Edit
                    </Button>
                    <Button onClick={handleConfirm} disabled={confirming || !schema}>
                        {confirming ? 'Confirming...' : 'Confirm'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SchemaDetail;
