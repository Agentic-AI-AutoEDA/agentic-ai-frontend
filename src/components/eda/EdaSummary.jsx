import React from 'react';

const TASK_TYPE_LABELS = {
    general: 'General EDA',
    regression: 'Regression',
    classification: 'Classification',
    clustering: 'Clustering',
    time_series: 'Time Series',
};

const EdaSummary = ({ resultJson }) => {
    if (!resultJson) {
        return (
            <div className="eda-section eda-summary">
                <h3 className="eda-section-title">Dataset Summary</h3>
                <p className="eda-empty-msg">No summary data available.</p>
            </div>
        );
    }

    const context = resultJson.dataset_context || {};

    return (
        <div className="eda-section eda-summary">
            <h3 className="eda-section-title">Dataset Summary</h3>

            {/* Context Section */}
            {(resultJson.goal || context.domain || context.description) && (
                <div className="summary-context">
                    {resultJson.goal && (
                        <div className="context-item">
                            <strong>Analysis Goal:</strong>
                            <p>{resultJson.goal}</p>
                        </div>
                    )}
                    {context.domain && (
                        <div className="context-item">
                            <strong>Domain:</strong>
                            <p>{context.domain}</p>
                        </div>
                    )}
                    {context.description && (
                        <div className="context-item">
                            <strong>Description:</strong>
                            <p>{context.description}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Metrics Grid */}
            <div className="eda-summary-grid">
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Rows</span>
                    <span className="eda-stat-value">{resultJson.row_count?.toLocaleString() ?? 'N/A'}</span>
                </div>
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Columns</span>
                    <span className="eda-stat-value">{resultJson.column_count?.toLocaleString() ?? 'N/A'}</span>
                </div>
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Task Type</span>
                    <span className="eda-stat-value">{TASK_TYPE_LABELS[resultJson.task_type] || resultJson.task_type || 'N/A'}</span>
                </div>
                {resultJson.target_column && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Target Column</span>
                        <span className="eda-stat-value">{resultJson.target_column}</span>
                    </div>
                )}
                {resultJson.time_column && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Time Column</span>
                        <span className="eda-stat-value">{resultJson.time_column}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EdaSummary;
