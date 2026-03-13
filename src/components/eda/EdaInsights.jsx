import React, { useState } from 'react';

const SEVERITY_CONFIG = {
    critical: { className: 'eda-severity-critical', icon: '🔴', label: 'Critical' },
    high:     { className: 'eda-severity-high',     icon: '🟠', label: 'High' },
    medium:   { className: 'eda-severity-warning',  icon: '🟡', label: 'Medium' },
    low:      { className: 'eda-severity-info',     icon: '🔵', label: 'Low' },
    warning:  { className: 'eda-severity-warning',  icon: '🟡', label: 'Warning' },
    info:     { className: 'eda-severity-info',     icon: '🔵', label: 'Info' },
};

const CATEGORY_LABELS = {
    distribution:      'Distribution',
    correlation:       'Correlation',
    outlier:           'Outlier',
    missing_data:      'Missing Data',
    temporal:          'Temporal',
    class_imbalance:   'Class Imbalance',
    multicollinearity: 'Multicollinearity',
    target_analysis:   'Target Analysis',
    data_leakage:      'Data Leakage',
    general:           'General',
};

// InsightCard — displays a single insight
const InsightCard = ({ insight }) => {
    const [expanded, setExpanded] = useState(false);
    // Safely read fields with defaults to avoid crashes on malformed insight objects
    const severityKey = (insight && typeof insight === 'object' && insight.severity) ? insight.severity : 'info';
    const severity = SEVERITY_CONFIG[severityKey] || SEVERITY_CONFIG.info;
    const title = insight && typeof insight === 'object' ? (insight.title || '') : String(insight);
    const description = insight && typeof insight === 'object' ? (insight.description || '') : '';
    const affected = insight && typeof insight === 'object' ? (Array.isArray(insight.affected_columns) ? insight.affected_columns : []) : [];
    const recommendation = insight && typeof insight === 'object' ? (insight.recommendation || '') : '';

    return (
        <div className={`eda-insight-card ${severity.className}`} onClick={() => setExpanded(!expanded)}>
            <div className="eda-insight-header">
                <div className="eda-insight-meta">
                    <span className="eda-severity-badge">{severity.icon} {severity.label}</span>
                    <span className="eda-category-badge">
                        {CATEGORY_LABELS[(insight && insight.category) || 'general'] || (insight && insight.category) || 'General'}
                    </span>
                    {insight && insight.id && (
                        <span className="eda-column-tag eda-insight-id-tag">{insight.id}</span>
                    )}
                </div>
                <h4 className="eda-insight-title">{title}</h4>
            </div>

            {expanded && (
                <div className="eda-insight-body">
                    <p className="eda-insight-description">{description}</p>

                    {affected.length > 0 && (
                        <div className="eda-insight-columns">
                            <strong>Affected Columns: </strong>
                            {affected.map((col, i) => (
                                <span key={col ?? i} className="eda-column-tag">{col}</span>
                            ))}
                        </div>
                    )}

                    {recommendation && (
                        <div className="eda-insight-recommendation">
                            <strong>Recommendation:</strong>
                            <p>{recommendation}</p>
                        </div>
                    )}
                </div>
            )}

            <span className="eda-expand-icon">{expanded ? '\u25b2' : '\u25bc'}</span>
        </div>
    );
};

const EdaInsights = ({ insights }) => {
    const [filter, setFilter] = useState('all');

    // Normalize insights to an array
    const safeInsights = Array.isArray(insights) ? insights.filter(Boolean) : (insights && typeof insights === 'object' ? [insights] : []);

    if (!safeInsights || safeInsights.length === 0) {
        return (
            <div className="eda-section eda-insights">
                <h3 className="eda-section-title">Insights</h3>
                <p className="eda-empty-msg">No insights generated for this analysis.</p>
            </div>
        );
    }

    const filtered = filter === 'all'
        ? safeInsights
        : safeInsights.filter(i => (i && i.severity) === filter);

    const counts = {
        all:      safeInsights.length,
        critical: safeInsights.filter(i => i && i.severity === 'critical').length,
        high:     safeInsights.filter(i => i && i.severity === 'high').length,
        medium:   safeInsights.filter(i => i && i.severity === 'medium').length,
        low:      safeInsights.filter(i => i && i.severity === 'low').length,
        warning:  safeInsights.filter(i => i && i.severity === 'warning').length,
        info:     safeInsights.filter(i => i && i.severity === 'info').length,
    };

    return (
        <div className="eda-section eda-insights">
            <h3 className="eda-section-title">Insights ({safeInsights.length})</h3>

            <div className="eda-insights-body">
                <div className="eda-insight-filters">
                    {Object.entries(counts).map(([key, count]) => (
                        count > 0 && (
                            <button
                                key={key}
                                className={`eda-filter-btn ${filter === key ? 'active' : ''}`}
                                onClick={() => setFilter(key)}
                            >
                                {key === 'all' ? 'All' : (SEVERITY_CONFIG[key]?.icon || '') + ' ' + key.charAt(0).toUpperCase() + key.slice(1)} ({count})
                            </button>
                        )
                    ))}
                </div>

                {/* Insight cards */}
                <div className="eda-insight-list">
                    {filtered.map((insight, idx) => (
                        <InsightCard
                            key={insight?.id ?? `insight-${idx}`}
                            insight={insight}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EdaInsights;
