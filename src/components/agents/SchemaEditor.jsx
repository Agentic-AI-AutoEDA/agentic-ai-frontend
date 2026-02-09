import { useParams } from 'react-router';
import api from '../../api.js';
import '../../styles/SchemaMetadata.css';
import JsonEditor from '../JsonEditor.jsx';
import Button from '../common/Button.jsx';
import {useCallback, useEffect, useState} from "react";

const SchemaEditor = ({ navigate }) => {
    const { agentId } = useParams();
    const [agentName, setAgentName] = useState('');
    const [schema, setSchema] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState(null);

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

    const fetchSchema = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`agents/${agentId}/metadata/schema/`);
            const schemaData = response.data.data || response.data;
            setSchema(JSON.stringify(schemaData, null,2));
        } catch (err) {
            const errorMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to load schema';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const validateJSON = useCallback((jsonString) => {
        try {
            JSON.parse(jsonString);
            setValidationError(null);
            return true;
        } catch (err) {
            setValidationError(`Invalid JSON: ${err.message}`);
            return false;
        }
    }, []);

    const handleEditorChange = useCallback(
        (value) => {
            setSchema(value);
            validateJSON(value);
        },
        [validateJSON],
    );

    const handleSave = async () => {
        if (!validateJSON(schema)) return;

        setSaving(true);
        setMessage('');
        setError(null);
        try {
            const payload = { schema_json: JSON.parse(schema) };
            const response = await api.put(
                `agents/${agentId}/metadata/schema/`,
                payload,
            );
            setMessage(response.data.message || 'Schema updated successfully');
            setTimeout(() => {
                navigate(`/agents/schema/${agentId}`);
            },1000);
        } catch (err) {
            const errorMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to save schema';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/agents/schema/${agentId}`);
    };

    if (loading) {
        return (
            <div className="schema-metadata-container">
                <div className="schema-content">
                    <div className="schema-status loading">
                        <span className="loading-spinner"></span>
                        Loading schema...
                    </div>
                </div>
            </div>
        );
    }

    if (error && !schema) {
        return (
            <div className="schema-metadata-container">
                <div className="schema-metadata-header">
                    <h4>Edit Schema Metadata</h4>
                    <Button onClick={() => navigate(-1)}>Back</Button>
                </div>
                <div className="schema-content">
                    <div className="schema-error-message">{error}</div>
                    <div className="schema-actions">
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                        <Button onClick={() => navigate(-1)}>Back</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <JsonEditor title={`Agent: ${agentName || agentId}`}
                    value={schema}
                    onChange={handleEditorChange}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    saving={saving}
                    validationError={validationError}
                    message={message}
                    error={error}
                    label="Edit Schema (JSON)"
        />
    );
};

export default SchemaEditor;
