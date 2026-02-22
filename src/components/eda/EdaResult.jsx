import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import api from '../../api.js';
import '../../styles/RunAnalysis.css';
import Button from '../common/Button.jsx';
import EdaSummary from './EdaSummary.jsx';
import EdaInsights from './EdaInsights.jsx';
import EdaCharts from './EdaCharts.jsx';
import EdaQuality from './EdaQuality.jsx';
import EdaAnalysis from './EdaAnalysis.jsx';

const EdaResult = ({ navigate }) => {
    const { jobId } = useParams();
    const [resultJson, setResultJson] = useState(null);
    const [rawResponse, setRawResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('summary');

    const fetchResult = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`eda/result/${jobId}/`);
            const data = response.data;

            // Store raw response for debugging
            setRawResponse(data);
            console.log('EDA result raw response:', data);

            const inner = data.data || data;
            const jobStatus = inner.status || data.status;

            if (jobStatus === 'failed') {
                setError(inner.error_message || data.message || 'Analysis failed');
                return;
            }

            const result = inner.result ?? inner.data?.result ?? null;


            // Capture job-level metadata (id/status) from common shapes: top-level or nested under data/result_json
            const jobIdFromResp = inner.eda_job_id ?? inner.id ?? null;
            const jobStatusFromResp = inner.status ?? null;

            // Attach metadata to result object for easy consumption by UI components
            if (result && typeof result === 'object') {
                if (jobIdFromResp) result._eda_job_id = jobIdFromResp;
                if (jobStatusFromResp) result._eda_status = jobStatusFromResp;
            }

            console.log('Extracted result object:', result);
            setResultJson(result);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to load result';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => { fetchResult(); }, [fetchResult]);

    if (loading) return <p className="eda-loading">Loading results...</p>;

    if (error) {
        return (
            <div className="eda-result-container">
                <div className="full-content-header">
                    <h3>EDA Result</h3>
                    <Button onClick={() => navigate('/eda')}>Back</Button>
                </div>
                <p className="error-message">{error}</p>
            </div>
        );
    }

    if (!resultJson) {
        return (
            <div className="eda-result-container">
                <div className="full-content-header">
                    <h3>EDA Result</h3>
                    <Button onClick={() => navigate('/eda')}>Back</Button>
                </div>
                <p className="error-message">No result data available. Check the raw response below:</p>
                {rawResponse && (
                    <pre className="eda-pre eda-raw-pre">
                        {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                )}
            </div>
        );
    }

    // Ensure we pass a safe object to child components and compute counts without throwing if fields are missing or of unexpected types.
    const safeResult = (resultJson && typeof resultJson === 'object') ? resultJson : {};
    const insightsCount = Array.isArray(safeResult.insights) ? safeResult.insights.length : (safeResult.insights && typeof safeResult.insights === 'object' ? 1 : 0);
    const chartsCount = Array.isArray(safeResult.charts) ? safeResult.charts.length : (safeResult.charts && typeof safeResult.charts === 'object' ? 1 : 0);

    const sections = [
        { key: 'summary', label: 'Summary' },
        { key: 'quality', label: 'Data Quality' },
        { key: 'analysis', label: 'Analysis Details' },
        { key: 'charts', label: `Charts${chartsCount ? ` (${chartsCount})` : ''}` },
        { key: 'insights', label: `Insights${insightsCount ? ` (${insightsCount})` : ''}` },
        { key: 'raw', label: 'Raw JSON' },
    ];

    return (
        <div className="eda-result-container">
            <div className="full-content-header">
                <h3>EDA Result</h3>
                <div>
                    <Button onClick={() => navigate('/eda')}>New Analysis</Button>
                    &nbsp;&nbsp;
                    <Button onClick={() => navigate('/eda/history')}>History</Button>
                    &nbsp;&nbsp;
                    <Button onClick={() => navigate(-1)}>Back</Button>
                </div>
            </div>

            <div className="eda-result-nav">
                {sections.map((sec) => (
                    <button
                        key={sec.key}
                        className={`eda-nav-btn ${activeSection === sec.key ? 'active' : ''}`}
                        onClick={() => setActiveSection(sec.key)}
                    >
                        {sec.label}
                    </button>
                ))}
            </div>

            <div className="eda-result-content">
                {activeSection === 'summary' && (
                    <EdaSummary resultJson={safeResult} />
                )}
                {activeSection === 'quality' && (
                    <EdaQuality quality={safeResult.quality} />
                )}
                {activeSection === 'analysis' && (
                    <EdaAnalysis resultJson={safeResult} />
                )}
                {activeSection === 'charts' && (
                    <EdaCharts charts={safeResult.charts} resultJson={safeResult} />
                )}
                {activeSection === 'insights' && (
                    <EdaInsights insights={safeResult.insights} />
                )}
                {activeSection === 'raw' && (
                    <div className="eda-section">
                        <h3 className="eda-section-title">Raw JSON Response</h3>
                        <pre className="eda-pre eda-raw-pre">
                            {JSON.stringify(safeResult, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EdaResult;
