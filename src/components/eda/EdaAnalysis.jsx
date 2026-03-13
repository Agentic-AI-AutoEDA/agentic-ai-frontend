import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const TABS = [
    { key: 'semantic',          label: 'Semantic' },
    { key: 'univariate',        label: 'Univariate' },
    { key: 'bivariate',         label: 'Bivariate' },
    { key: 'temporal',          label: 'Temporal' },
    { key: 'detected_issues',   label: 'Issues' },
    { key: 'hypotheses',        label: 'Hypotheses' },
    { key: 'insight_mapping',   label: 'Insight Mapping' },
];

const renderValue = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'number') return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
};

const ObjectTable = ({ data, title }) => {
    if (!data || typeof data !== 'object') return null;

    const entries = Object.entries(data);
    if (entries.length === 0) return null;

    // If values are primitives, render a simple key-value table
    const allPrimitive = entries.every(([, v]) => typeof v !== 'object' || v === null);

    if (allPrimitive) {
        return (
            <div className="eda-analysis-block">
                {title && <h5 className="eda-analysis-block-title">{title}</h5>}
                <div className="eda-analysis-table-wrapper">
                    <table>
                        <thead><tr><th>Key</th><th>Value</th></tr></thead>
                        <tbody>
                            {entries.map(([key, val]) => (
                                <tr key={key}><td>{key}</td><td>{renderValue(val)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Nested objects: render collapsible subsections
    return (
        <div className="eda-analysis-block">
            {title && <h5 className="eda-analysis-block-title">{title}</h5>}
            {entries.map(([key, val]) => (
                <CollapsibleSection key={key} label={key} data={val} />
            ))}
        </div>
    );
};

const CollapsibleSection = ({ label, data }) => {
    const [open, setOpen] = useState(false);

    const renderArray = (arr) => {
        if (!Array.isArray(arr)) return null;
        if (arr.length === 0) return <div className="eda-empty-msg">Empty list</div>;

        const allPrimitive = arr.every(v => (v === null || v === undefined) || ['string','number','boolean'].includes(typeof v));
        if (allPrimitive) {
            return <ul className="eda-list">{arr.map((v, i) => <li key={i}>{String(v)}</li>)}</ul>;
        }

        // If array is homogeneous objects, render an aggregated table for easier scanning
        const allObjects = arr.every(item => item && typeof item === 'object' && !Array.isArray(item));
        if (allObjects) {
            // Compute union of keys preserving order seen
            const colsSet = new Set();
            arr.forEach(item => Object.keys(item).forEach(k => colsSet.add(k)));
            const cols = Array.from(colsSet);

            return (
                <div className="eda-array-agg-table">
                    <div className="eda-analysis-table-wrapper">
                        <table>
                            <thead><tr>{cols.map(col => <th key={col}>{col}</th>)}</tr></thead>
                            <tbody>
                                {arr.map((item, idx) => (
                                    <tr key={idx}>
                                        {cols.map(col => {
                                            const val = item[col];
                                            // If primitive show directly, if object stringify small
                                            const cell = (val === null || val === undefined) ? 'N/A' : (typeof val === 'object' ? JSON.stringify(val) : String(val));
                                            return <td key={col}>{cell}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        // Array contains mixed types or nested arrays — render each item with ObjectTable or pre
        return (
            <div className="eda-array-items">
                {arr.map((item, idx) => (
                    <div key={idx} className="eda-array-item">
                        <div className="eda-array-item-header">Item {idx + 1}</div>
                        {item && typeof item === 'object' && !Array.isArray(item)
                            ? <ObjectTable data={item} />
                            : <pre className="eda-pre">{renderValue(item)}</pre>}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="eda-collapsible">
            <button className="eda-collapsible-header" onClick={() => setOpen(!open)}>
                <span>{label}</span>
                <span>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="eda-collapsible-body">
                    {Array.isArray(data) ? renderArray(data)
                        : typeof data === 'object' && data !== null ? <ObjectTable data={data} />
                        : <pre className="eda-pre">{renderValue(data)}</pre>}
                </div>
            )}
        </div>
    );
};

// ── Helpers for temporal charts ───────────────────────────────────────────────
function mapTrendToChartData(trendData, limit = 200) {
    if (!Array.isArray(trendData)) return [];
    return trendData.slice(0, limit).map(pt => ({
        name: pt.period || pt.date || pt.period_label || '',
        value: pt.value ?? pt.mean ?? pt.sum ?? pt.count ?? null,
    }));
}

function SmallLineChart({ data, dataKey = 'value' }) {
    if (!data || data.length === 0) return <div className="eda-chart-empty">No series data</div>;
    return (
        <div className="eda-smalllinechart">
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 6, right: 8, left: 8, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey={dataKey} stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// Severity config — identical mapping to EdaInsights
const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'warning'];

// Card border class — each severity gets its own colour
const SEV_CARD_CLS = {
    critical: 'eda-severity-critical',
    high:     'eda-severity-high',
    medium:   'eda-severity-warning',
    low:      'eda-severity-info',
    warning:  'eda-severity-warning',
};

const SEV_ICONS = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', warning: '🟡' };

// Plain text badge — identical to EdaInsights eda-severity-badge
const SevBadge = ({ sev }) => (
    <span className="eda-severity-badge">
        {SEV_ICONS[sev] ?? '⚪'} {sev ?? 'unknown'}
    </span>
);

// Issues panel — cards ordered by severity
const DetectedIssuesPanel = ({ issues }) => {
    const [typeFilter, setTypeFilter] = useState('all');
    if (!issues || issues.length === 0) return <p className="eda-empty-msg">No detected issues.</p>;

    // Sorted by severity
    const sorted = [...issues].sort((a, b) => {
        const ai = SEV_ORDER.indexOf(a.severity ?? 'low');
        const bi = SEV_ORDER.indexOf(b.severity ?? 'low');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    // Unique types
    const types = ['all', ...Array.from(new Set(sorted.map(i => i.type).filter(Boolean)))];

    const filtered = typeFilter === 'all' ? sorted : sorted.filter(i => i.type === typeFilter);

    return (
        <div className="eda-issues-panel">
            {/* Filter by type */}
            <div className="eda-filter-group">
                <span className="eda-filter-group-label">Filter by type</span>
                <div className="eda-insight-filters">
                    {types.map(t => (
                        <button
                            key={t}
                            className={`eda-filter-btn ${typeFilter === t ? 'active' : ''}`}
                            onClick={() => setTypeFilter(t)}
                        >
                            {t === 'all' ? `All (${issues.length})` : `${t.replace(/_/g, ' ')} (${issues.filter(i => i.type === t).length})`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="eda-issues-cards">
                {filtered.map((issue) => {
                    const sev = issue.severity ?? 'low';
                    const evidence = issue.evidence
                        ? Object.entries(issue.evidence).filter(([, v]) => v !== null && v !== undefined)
                        : [];
                    const columns = Array.isArray(issue.columns) ? issue.columns : [];
                    return (
                        <div key={issue.id} className={`eda-issue-card ${SEV_CARD_CLS[sev] ?? 'eda-severity-info'}`}>
                            <div className="eda-issue-card-header">
                                <SevBadge sev={sev} />
                                <span className="eda-issue-type">{issue.type?.replace(/_/g, ' ') ?? 'N/A'}</span>
                                {issue.id && <span className="eda-issue-id">{issue.id}</span>}
                            </div>
                            {columns.length > 0 && (
                                <div className="eda-issue-section">
                                    <span className="eda-issue-section-label">Columns</span>
                                    <div className="eda-quality-tags">
                                        {columns.map((col, i) => (
                                            <span key={i} className="eda-column-tag">{col}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {issue.metric_reference && (
                                <div className="eda-issue-section">
                                    <span className="eda-issue-section-label">Metric</span>
                                    <span className="eda-issue-section-value">{issue.metric_reference}</span>
                                </div>
                            )}
                            {evidence.length > 0 && (
                                <div className="eda-issue-section">
                                    <span className="eda-issue-section-label">Evidence</span>
                                    <div className="eda-quality-tags">
                                        {evidence.map(([k, v]) => (
                                            <span key={k} className="eda-column-tag">
                                                {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const HypothesesPanel = ({ hypotheses, hypothesisSummary }) => {
    const [typeFilter, setTypeFilter] = useState('all');
    if (!hypotheses || hypotheses.length === 0) return <p className="eda-empty-msg">No hypotheses available.</p>;

    // Map status → severity for sorting and color
    const STATUS_SEV = { refuted: 'high', insufficient_data: 'medium', supported: 'low' };
    const STATUS_ORDER = ['refuted', 'insufficient_data', 'supported'];

    const types = ['all', ...Array.from(new Set(hypotheses.map(h => h.type).filter(Boolean)))];

    // Sort by status severity order first
    const sorted = [...hypotheses].sort((a, b) =>
        (STATUS_ORDER.indexOf(a.status) === -1 ? 99 : STATUS_ORDER.indexOf(a.status)) -
        (STATUS_ORDER.indexOf(b.status) === -1 ? 99 : STATUS_ORDER.indexOf(b.status))
    );

    const filtered = typeFilter === 'all' ? sorted : sorted.filter(h => h.type === typeFilter);

    return (
        <div>
            {hypothesisSummary && (
                <div className="eda-analysis-block">
                    <h5 className="eda-analysis-block-title">Hypothesis Summary</h5>
                    <div className="metrics-grid">
                        {[
                            ['Total',             hypothesisSummary.total],
                            ['Supported',         hypothesisSummary.supported],
                            ['Refuted',           hypothesisSummary.refuted],
                            ['Insufficient Data', hypothesisSummary.insufficient_data],
                            ['Support Rate',      hypothesisSummary.support_rate != null ? `${(hypothesisSummary.support_rate * 100).toFixed(0)}%` : 'N/A'],
                            ['Deterministic',     hypothesisSummary.deterministic_count],
                            ['LLM-generated',     hypothesisSummary.llm_count],
                        ].map(([label, val]) => (
                            <div key={label} className="metric-card">
                                <span className="metric-card-label">{label}</span>
                                <span className="metric-card-value">{val ?? 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="eda-analysis-block">
                <h5 className="eda-analysis-block-title">Hypotheses ({hypotheses.length})</h5>

                {/* Filter by type */}
                <div className="eda-filter-group">
                    <span className="eda-filter-group-label">Filter by type</span>
                    <div className="eda-insight-filters">
                        {types.map(t => (
                            <button
                                key={t}
                                className={`eda-filter-btn ${typeFilter === t ? 'active' : ''}`}
                                onClick={() => setTypeFilter(t)}
                            >
                                {t === 'all' ? `All (${hypotheses.length})` : `${t.replace(/_/g, ' ')} (${hypotheses.filter(h => h.type === t).length})`}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.map((h) => {
                    const sev = STATUS_SEV[h.status] ?? 'low';
                    const columns = Array.isArray(h.columns) ? h.columns : [];
                    const evidenceScalars = h.evidence
                        ? Object.entries(h.evidence).filter(([k, v]) => k !== 'referenced_pair' && v !== null && v !== undefined)
                        : [];
                    const refPair = h.evidence?.referenced_pair;

                    return (
                        <div key={h.id} className={`eda-hypothesis-card ${SEV_CARD_CLS[sev] ?? 'eda-severity-info'}`}>
                            <div className="eda-hypothesis-header">
                                <div className="eda-hypothesis-header-meta">
                                    <SevBadge sev={sev} />
                                    <span className="eda-hypothesis-source">{h.source}</span>
                                    <span className="eda-issue-id">{h.id}</span>
                                </div>
                                <p className="eda-hypothesis-statement">{h.statement}</p>
                            </div>

                            {/* Body — one row per top-level key */}
                            <div className="eda-hypothesis-body">

                                {/* status */}
                                <div className="eda-hypothesis-row">
                                    <span className="eda-hypothesis-row-label">Status</span>
                                    <span className="eda-hypothesis-row-value">{h.status?.replace(/_/g, ' ')}</span>
                                </div>

                                {/* verdict */}
                                {h.verdict && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Verdict</span>
                                        <span className="eda-hypothesis-row-value">{h.verdict}</span>
                                    </div>
                                )}

                                {/* rationale */}
                                {h.rationale && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Rationale</span>
                                        <span className="eda-hypothesis-row-value">{h.rationale}</span>
                                    </div>
                                )}

                                {/* type */}
                                {h.type && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Type</span>
                                        <span className="eda-hypothesis-row-value">{h.type}</span>
                                    </div>
                                )}

                                {/* direction */}
                                {h.direction && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Direction</span>
                                        <span className="eda-hypothesis-row-value">{h.direction}</span>
                                    </div>
                                )}

                                {/* expected_metric */}
                                {h.expected_metric && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Metric</span>
                                        <span className="eda-hypothesis-row-value">{h.expected_metric}</span>
                                    </div>
                                )}

                                {/* expected_threshold */}
                                {h.expected_threshold != null && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Threshold</span>
                                        <span className="eda-hypothesis-row-value">≥ {h.expected_threshold}</span>
                                    </div>
                                )}

                                {/* columns */}
                                {columns.length > 0 && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Columns</span>
                                        <div className="eda-quality-tags">
                                            {columns.map((col, i) => (
                                                <span key={i} className="eda-column-tag">{col}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* evidence scalars */}
                                {evidenceScalars.length > 0 && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Evidence</span>
                                        <div className="eda-quality-tags">
                                            {evidenceScalars.map(([k, v]) => (
                                                <span key={k} className="eda-column-tag">
                                                    {k.replace(/_/g, ' ')}: {String(v)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* referenced_pair */}
                                {refPair && (
                                    <div className="eda-hypothesis-row">
                                        <span className="eda-hypothesis-row-label">Ref Pair</span>
                                        <div className="eda-quality-tags">
                                            <span className="eda-column-tag">{refPair.col1} ↔ {refPair.col2}</span>
                                            {refPair.value != null && (
                                                <span className="eda-column-tag">r: {Number(refPair.value).toFixed(4)}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Mapped Insights Panel
const MappedInsightsPanel = ({ mappedInsights }) => {
    if (!Array.isArray(mappedInsights) || mappedInsights.length === 0)
        return <p className="eda-empty-msg">No mapped insights available.</p>;
    return (
        <div className="eda-issues-panel">
            <div className="eda-issues-cards">
                {mappedInsights.map((mi, i) => (
                    <div key={mi.insight_id ?? i} className="eda-issue-card">
                        <div className="eda-issue-card-header">
                            <span className="eda-issue-type">{mi.insight_id}</span>
                            {mi.is_orphan && (
                                <span className="eda-sev-badge sev-warning">orphan</span>
                            )}
                            {!mi.is_orphan && (
                                <span className="eda-sev-badge sev-low">grounded</span>
                            )}
                        </div>
                        {mi.issue_ids?.length > 0 && (
                            <div className="eda-issue-section">
                                <span className="eda-issue-section-label">Linked Issues</span>
                                <div className="eda-quality-tags">
                                    {mi.issue_ids.map((id, j) => (
                                        <span key={j} className="eda-column-tag">{id}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {mi.match_reasons?.length > 0 && (
                            <div className="eda-issue-section">
                                <span className="eda-issue-section-label">Match Reasons</span>
                                <div className="eda-quality-tags">
                                    {mi.match_reasons.map((r, j) => (
                                        <span key={j} className="eda-column-tag">{r}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Insight Coverage Panel
const InsightCoveragePanel = ({ insightCoverage }) => {
    if (!insightCoverage) return <p className="eda-empty-msg">No insight coverage data available.</p>;
    return (
        <div>
            <div className="metrics-grid">
                {[
                    ['Issues Found',        insightCoverage.issue_count],
                    ['Insights Generated',  insightCoverage.insight_count],
                    ['Issues Addressed',    insightCoverage.addressed_issue_count],
                    ['Issues Unaddressed',  insightCoverage.unaddressed_issue_count],
                    ['Coverage',            insightCoverage.coverage_ratio != null ? `${(insightCoverage.coverage_ratio * 100).toFixed(0)}%` : 'N/A'],
                    ['Grounded',            insightCoverage.grounded_insight_count],
                    ['Orphaned',            insightCoverage.orphan_insight_count],
                ].map(([label, val]) => (
                    <div key={label} className="metric-card">
                        <span className="metric-card-label">{label}</span>
                        <span className="metric-card-value">{val ?? 'N/A'}</span>
                    </div>
                ))}
            </div>
            {insightCoverage.unaddressed_issue_ids?.length > 0 && (
                <div className="eda-analysis-block mt-12">
                    <h5 className="eda-analysis-block-title">Unaddressed Issue IDs</h5>
                    <div className="eda-quality-tags">
                        {insightCoverage.unaddressed_issue_ids.map((id, i) => (
                            <span key={i} className="eda-column-tag">{id}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SemanticPanel = ({ semantic }) => {
    const cols = semantic?.columns || [];
    if (cols.length === 0) return <p className="eda-empty-msg">No semantic data available.</p>;
    return (
        <div className="eda-analysis-block">
            <h5 className="eda-analysis-block-title">Semantic Column Analysis ({cols.length})</h5>
            <div className="eda-analysis-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th><th>Type</th><th>Role</th><th>Modeling Role</th>
                            <th>Leakage Risk</th><th>Sensitivity</th><th>Time Dep.</th>
                            <th>Confidence</th><th>Category</th><th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cols.map((col) => (
                            <tr key={col.name}>
                                <td>{col.name}</td>
                                <td>{col.type ?? 'N/A'}</td>
                                <td>{col.role ?? 'N/A'}</td>
                                <td>{col.modeling_role ?? 'N/A'}</td>
                                <td>{col.leakage_risk ?? 'N/A'}</td>
                                <td>{col.sensitivity ?? 'N/A'}</td>
                                <td>{col.time_dependent ? 'Yes' : 'No'}</td>
                                <td>{col.target_confidence != null ? (col.target_confidence * 100).toFixed(0) + '%' : 'N/A'}</td>
                                <td>{col.business_category ?? 'N/A'}</td>
                                <td>{col.description ?? 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// Main component
const EdaAnalysis = ({ analysisDetails }) => {
    const [activeTab, setActiveTab] = useState('semantic');

    if (!analysisDetails) return (
        <div className="eda-section eda-analysis">
            <h3 className="eda-section-title">Analysis Details</h3>
            <p className="eda-empty-msg">No detailed analysis data available.</p>
        </div>
    );

    const getTabData = (key) => analysisDetails[key];

    const availableTabs = TABS.filter(tab => {
        if (tab.key === 'insight_mapping') {
            return !!(analysisDetails.mapped_insights || analysisDetails.insight_coverage);
        }
        const data = analysisDetails[tab.key];
        if (!data) return false;
        if (Array.isArray(data)) return data.length > 0;
        if (typeof data === 'object') return Object.keys(data).length > 0;
        return false;
    });

    if (availableTabs.length === 0) return (
        <div className="eda-section eda-analysis">
            <h3 className="eda-section-title">Analysis Details</h3>
            <p className="eda-empty-msg">No detailed analysis data available.</p>
        </div>
    );

    const currentTab = availableTabs.find(t => t.key === activeTab) || availableTabs[0];
    const tabData    = getTabData(currentTab.key);

    return (
        <div className="eda-section eda-analysis">
            <h3 className="eda-section-title">Analysis Details</h3>
            <div className="eda-analysis-body">
                <div className="eda-tabs">
                    {availableTabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`eda-tab-btn ${currentTab.key === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="eda-tab-content">
                    {currentTab.key === 'detected_issues' && (
                        <DetectedIssuesPanel issues={tabData} />
                    )}
                    {currentTab.key === 'hypotheses' && (
                        <HypothesesPanel hypotheses={tabData} hypothesisSummary={analysisDetails.hypothesis_summary} />
                    )}
                    {currentTab.key === 'insight_mapping' && (
                        <div>
                            <InsightCoveragePanel insightCoverage={analysisDetails.insight_coverage} />
                            <div className="mt-20">
                                <MappedInsightsPanel mappedInsights={analysisDetails.mapped_insights} />
                            </div>
                        </div>
                    )}
                    {currentTab.key === 'semantic' && (
                        <SemanticPanel semantic={tabData} />
                    )}
                    {currentTab.key === 'univariate' && (
                        <div>
                            {tabData && ['numeric', 'categorical', 'datetime'].map(group => {
                                const groupData = tabData[group];
                                if (!groupData || Object.keys(groupData).length === 0) return null;
                                return (
                                    <CollapsibleSection
                                        key={group}
                                        label={`${group.charAt(0).toUpperCase() + group.slice(1)} (${Object.keys(groupData).length})`}
                                        data={groupData}
                                    />
                                );
                            })}
                        </div>
                    )}
                    {currentTab.key === 'temporal' && (
                        <div>
                            {typeof tabData === 'object' && Object.keys(tabData).length > 0 ? (
                                (() => {
                                    const timeColumns = tabData.time_columns || tabData;
                                    return Object.entries(timeColumns).map(([timeCol, tdata]) => {
                                        if (!tdata || tdata.status === 'insufficient_data') {
                                            return (
                                                <div key={timeCol} className="eda-analysis-block">
                                                    <h5 className="eda-analysis-block-title">{timeCol}</h5>
                                                    <p className="eda-empty-msg">Insufficient temporal data.</p>
                                                </div>
                                            );
                                        }
                                        const periodData = tdata.record_count_by_period || {};
                                        // Collect all available granularities in preferred display order
                                        const GRANULARITY_ORDER = ['yearly', 'quarterly', 'monthly', 'weekly'];
                                        const periodEntries = GRANULARITY_ORDER
                                            .filter(g => Array.isArray(periodData[g]) && periodData[g].length > 0)
                                            .map(g => [g, periodData[g]]);
                                        // Also include any extra keys not in the order list
                                        Object.keys(periodData).forEach(g => {
                                            if (!GRANULARITY_ORDER.includes(g) && Array.isArray(periodData[g]) && periodData[g].length > 0) {
                                                periodEntries.push([g, periodData[g]]);
                                            }
                                        });

                                        const trendsObj = tdata.trends || {};
                                        const trendKeys = Object.keys(trendsObj);
                                        return (
                                            <div key={timeCol} className="eda-analysis-block">
                                <h5 className="eda-temporal-col-header">{timeCol}</h5>
                                {tdata.semantic_description && <p className="eda-temporal-desc">{tdata.semantic_description}</p>}
                                {/* Semantic annotations */}
                                {(tdata.semantic_time_dependent != null || tdata.semantic_modeling_role || tdata.semantic_business_category) && (
                                    <div className="eda-quality-tags mb-10">
                                        {tdata.semantic_modeling_role && <span className="eda-column-tag">Role: {tdata.semantic_modeling_role}</span>}
                                        {tdata.semantic_business_category && <span className="eda-column-tag">Category: {tdata.semantic_business_category}</span>}
                                        {tdata.semantic_time_dependent != null && <span className="eda-column-tag">Time Dep: {tdata.semantic_time_dependent ? 'Yes' : 'No'}</span>}
                                    </div>
                                )}
                                                {/* Record counts for each available granularity */}
                                                {periodEntries.map(([granularity, rows]) => (
                                                    <div key={granularity} className="eda-monthly-section">
                                                        <strong>Record count ({granularity})</strong>
                                                        <div className="eda-analysis-table-wrapper mt-8">
                                                            <table>
                                                                <thead><tr><th>Period</th><th>Count</th></tr></thead>
                                                                <tbody>
                                                                    {rows.slice(0, 52).map((r, i) => (
                                                                        <tr key={i}><td>{r.period}</td><td>{r.count}</td></tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ))}
                                                {trendKeys.length > 0 ? trendKeys.map((numCol) => {
                                                    const seriesArr = trendsObj[numCol] || [];
                                                    const trendChart = mapTrendToChartData(seriesArr, 500);
                                                    return (
                                                        <div key={numCol} className="eda-trend-item">
                                                            <strong>{numCol}</strong>
                                                            {trendChart.length > 0 && (
                                                                <div className="eda-trend-chart-wrap">
                                                                    <SmallLineChart data={trendChart} />
                                                                </div>
                                                            )}
                                                            {seriesArr.length > 0 && (
                                                                <div className="eda-analysis-table-wrapper mt-8">
                                                                    <table>
                                                                        <thead><tr><th>Period</th><th>Mean</th><th>Sum</th><th>Count</th></tr></thead>
                                                                        <tbody>
                                                                            {seriesArr.slice(0, 200).map((r, i) => (
                                                                                <tr key={i}><td>{r.period || r.date}</td><td>{renderValue(r.mean)}</td><td>{renderValue(r.sum)}</td><td>{renderValue(r.count)}</td></tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }) : <div className="eda-empty-msg">No numeric trend series available.</div>}
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <p className="eda-empty-msg">No temporal data available.</p>
                            )}
                        </div>
                    )}
                    {currentTab.key === 'bivariate' && (
                        <div>
                            {/* Correlation Matrix */}
                            {tabData?.correlation_matrix && Object.keys(tabData.correlation_matrix).length > 0 && (() => {
                                const cols = Object.keys(tabData.correlation_matrix);
                                return (
                                    <div className="eda-analysis-block">
                                        <h5 className="eda-analysis-block-title">Correlation Matrix</h5>
                                        <div className="eda-analysis-table-wrapper">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th></th>
                                                        {cols.map(c => <th key={c}>{c}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cols.map(row => (
                                                        <tr key={row}>
                                                            <td><strong>{row}</strong></td>
                                                            {cols.map(col => {
                                                                const v = tabData.correlation_matrix[row]?.[col];
                                                                return <td key={col}>{v != null ? Number(v).toFixed(3) : '—'}</td>;
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}
                            {/* High Correlations */}
                            {tabData?.high_correlations?.length > 0 && (
                                <div className="eda-analysis-block">
                                    <h5 className="eda-analysis-block-title">High Correlations</h5>
                                    <div className="eda-analysis-table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Col 1</th><th>Col 2</th><th>Correlation</th><th>Strength</th>
                                                    <th>Col 1 Role</th><th>Col 1 Leakage</th><th>Col 1 Category</th>
                                                    <th>Col 2 Role</th><th>Col 2 Leakage</th><th>Col 2 Category</th>
                                                    <th>Leaky?</th><th>Ignored?</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tabData.high_correlations.map((p, i) => (
                                                    <tr key={i}>
                                                        <td>{p.column_1}</td>
                                                        <td>{p.column_2}</td>
                                                        <td>{p.correlation?.toFixed(4)}</td>
                                                        <td>{p.strength}</td>
                                                        <td>{p.col1_modeling_role ?? 'N/A'}</td>
                                                        <td>{p.col1_leakage_risk ?? 'N/A'}</td>
                                                        <td>{p.col1_business_category ?? 'N/A'}</td>
                                                        <td>{p.col2_modeling_role ?? 'N/A'}</td>
                                                        <td>{p.col2_leakage_risk ?? 'N/A'}</td>
                                                        <td>{p.col2_business_category ?? 'N/A'}</td>
                                                        <td>{p.involves_leaky_col ? '⚠ Yes' : 'No'}</td>
                                                        <td>{p.involves_ignored_col ? 'Yes' : 'No'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* High Corr Feature Groups */}
                            {tabData?.high_corr_feature_groups?.length > 0 && (
                                <div className="eda-analysis-block">
                                    <h5 className="eda-analysis-block-title">High-Correlation Feature Groups</h5>
                                    <div className="eda-analysis-table-wrapper">
                                        <table>
                                            <thead><tr><th>Group</th><th>Features</th><th>Max |r|</th><th>Pairs</th></tr></thead>
                                            <tbody>
                                                {tabData.high_corr_feature_groups.map((g, i) => (
                                                    <tr key={i}>
                                                        <td>{g.group_id}</td>
                                                        <td>{(g.features || []).join(', ')}</td>
                                                        <td>{g.max_abs_corr?.toFixed(4) ?? 'N/A'}</td>
                                                        <td>{g.pair_count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* Categorical vs Numeric */}
                            {tabData?.categorical_numeric?.length > 0 && (
                                <div className="eda-analysis-block">
                                    <h5 className="eda-analysis-block-title">Categorical vs Numeric</h5>
                                    {tabData.categorical_numeric.map((item, i) => (
                                        <div key={i} className="eda-catnum-item">
                                            <p className="eda-catnum-header">{item.categorical_column} → {item.numeric_column}</p>
                                            <div className="eda-analysis-table-wrapper">
                                                <table>
                                                    <thead><tr><th>Group</th><th>Mean</th><th>Median</th><th>Std</th><th>Count</th></tr></thead>
                                                    <tbody>
                                                        {item.group_stats?.map((gs, j) => (
                                                            <tr key={j}>
                                                                <td>{gs.group}</td>
                                                                <td>{renderValue(gs.mean)}</td>
                                                                <td>{renderValue(gs.median)}</td>
                                                                <td>{renderValue(gs.std)}</td>
                                                                <td>{gs.count}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Pairwise Mutual Information */}
                            {tabData?.pairwise_mutual_information && Object.keys(tabData.pairwise_mutual_information).length > 0 && (
                                <div className="eda-analysis-block">
                                    <h5 className="eda-analysis-block-title">Pairwise Mutual Information</h5>
                                    <div className="eda-analysis-table-wrapper">
                                        <table>
                                            <thead><tr><th>Col 1</th><th>Col 2</th><th>MI Score</th></tr></thead>
                                            <tbody>
                                                {Object.entries(tabData.pairwise_mutual_information).flatMap(([col1, inner]) =>
                                                    Object.entries(inner || {}).map(([col2, score]) => (
                                                        <tr key={`${col1}-${col2}`}>
                                                            <td>{col1}</td>
                                                            <td>{col2}</td>
                                                            <td>{score != null ? Number(score).toFixed(4) : 'N/A'}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* Pairwise Categorical Lift */}
                            {tabData?.pairwise_categorical_lift?.length > 0 && (
                                <div className="eda-analysis-block">
                                    <h5 className="eda-analysis-block-title">Pairwise Categorical Lift</h5>
                                    <div className="eda-analysis-table-wrapper">
                                        <table>
                                            <thead><tr><th>Col 1</th><th>Col 2</th><th>Max Lift</th></tr></thead>
                                            <tbody>
                                                {tabData.pairwise_categorical_lift.map((p, i) => (
                                                    <tr key={i}>
                                                        <td>{p.col1}</td>
                                                        <td>{p.col2}</td>
                                                        <td>{p.max_lift != null ? Number(p.max_lift).toFixed(4) : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {!['detected_issues','hypotheses','insight_mapping','semantic','univariate','temporal','bivariate'].includes(currentTab.key) && (
                        Array.isArray(tabData) ? (
                            <div>
                                {tabData.length === 0 ? <p className="eda-empty-msg">No data available.</p> : tabData.map((item, idx) => (
                                    <div key={idx} className="eda-analysis-block">
                                        {item && typeof item === 'object'
                                            ? <ObjectTable data={item} />
                                            : <pre className="eda-pre">{renderValue(item)}</pre>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ObjectTable data={tabData} title={currentTab.label} />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default EdaAnalysis;

