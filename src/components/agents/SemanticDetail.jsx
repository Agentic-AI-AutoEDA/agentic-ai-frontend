import React, {useEffect, useState} from 'react';
import { useParams } from 'react-router';
import api from '../../api.js';
import '../../styles/SchemaMetadata.css';
import Button from "../common/Button.jsx";

const SemanticDetail = ({ navigate }) => {
    const { agentId } = useParams();
    const [agentName, setAgentName] = useState('');
    const [semantic, setSemantic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchAgent();
        fetchSemantic();
    }, [agentId]);

    const fetchAgent = async () => {
        try {
            const response = await api.get(`agents/${agentId}/`);
            setAgentName(response.data.name || response.data.data?.name);
        } catch (err) {
            console.error('Failed to load agent details:', err);
        }
    };

    const fetchSemantic = async (isRetry = false, remainingPolls = 0) => {
        if (!isRetry) {
            setLoading(true);
        }
        setError(null);
        try {
            const response = await api.get(`agents/${agentId}/metadata/semantic/`);
            const semanticData = response.data.data || response.data;

            if (!semanticData || Object.keys(semanticData).length === 0) {
                setIsGenerating(true);
                setTimeout(() => fetchSemantic(true, remainingPolls), 1000);
                return;
            }

            setSemantic(semanticData);

            if (remainingPolls > 0) {
                setIsGenerating(true);
                setTimeout(() => fetchSemantic(true, remainingPolls - 1), 2000);
            } else {
                setIsGenerating(false);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to load semantic metadata';
            setError(errorMessage);
            setIsGenerating(false);
        } finally {
            if (!isRetry) {
                setLoading(false);
            }
        }
    };

    const handleEdit = () => {
        navigate(`/agents/semantic/${agentId}/edit`);
    };

    const handleRegenerate = async () => {
        setIsGenerating(true);
        setSemantic(null);
        setMessage('');
        setError(null);
        try {
            await api.post(`agents/${agentId}/metadata/semantic/generate/`);
            setMessage('Semantic regeneration started');
            fetchSemantic(true, 3);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to regenerate semantic metadata';
            setError(errorMessage);
            setIsGenerating(false);
        }
    };

    const handleConfirm = async () => {
        setConfirming(true);
        setMessage('');
        try {
            const response = await api.post(`agents/${agentId}/metadata/semantic/confirm/`);
            setMessage(response.data.message || 'Semantic metadata confirmed');
            setTimeout(() => {
                navigate(`/agents/`);
            }, 1000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to confirm semantic metadata';
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
                        {isGenerating ? 'Generating semantic metadata...' : 'Loading semantic metadata...'}
                    </div>
                </div>
            </div>
        );
    }

    if (error && !semantic) {
        return (
            <div className="schema-metadata-container">
                <div className="schema-metadata-header">
                    <h4>Semantic Metadata</h4>
                    <Button onClick={handleRegenerate}>
                        Regenerate
                    </Button>
                </div>
                <div className="schema-content">
                    <div className="schema-error-message">{error}</div>
                    <div className="schema-actions">
                        <Button onClick={fetchSemantic}>Retry</Button>
                        <Button onClick={handleRegenerate}>Regenerate</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="schema-metadata-container">
            <div className="schema-metadata-header">
                <h4>Semantic Metadata - Agent: {agentName || agentId}</h4>
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
                    <div className="schema-editor-label">Semantic Metadata (JSON)</div>
                    <div className="schema-json-viewer">
                        <pre>
                            {semantic ? JSON.stringify(semantic, null, 2) : 'No semantic metadata available'}
                        </pre>
                    </div>
                </div>
                <div className="schema-button-group">
                    <Button onClick={handleEdit} disabled={confirming}>
                        Edit
                    </Button>
                    <Button onClick={handleConfirm} disabled={confirming || !semantic}>
                        {confirming ? 'Confirming...' : 'Confirm'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SemanticDetail;
