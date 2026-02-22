import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const TABS = [
    { key: 'task_metrics', label: 'Task Metrics' },
    { key: 'univariate', label: 'Univariate' },
    { key: 'bivariate', label: 'Bivariate' },
    { key: 'temporal', label: 'Temporal' },
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
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Key</th><th>Value</th></tr>
                        </thead>
                        <tbody>
                            {entries.map(([key, val]) => (
                                <tr key={key}>
                                    <td>{key}</td>
                                    <td>{renderValue(val)}</td>
                                </tr>
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
            return (
                <ul className="eda-list">
                    {arr.map((v, i) => (
                        <li key={i}>{String(v)}</li>
                    ))}
                </ul>
            );
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
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    {cols.map(col => (<th key={col}>{col}</th>))}
                                </tr>
                            </thead>
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
                        {item && typeof item === 'object' && !Array.isArray(item) ? (
                            <ObjectTable data={item} />
                        ) : (
                            <pre className="eda-pre">{renderValue(item)}</pre>
                        )}
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
                    {Array.isArray(data) ? (
                        renderArray(data)
                    ) : typeof data === 'object' && data !== null ? (
                        <ObjectTable data={data} />
                    ) : (
                        <pre className="eda-pre">{renderValue(data)}</pre>
                    )}
                </div>
            )}
        </div>
    );
};

// helpers for charts
function mapTrendToChartData(trendData, limit = 200) {
    if (!Array.isArray(trendData)) return [];
    const slice = trendData.slice(0, limit);
    return slice.map((pt) => {
        // pt may be { period, value } or { period, mean, sum, count }
        const val = (pt.value ?? pt.mean ?? pt.sum ?? pt.count ?? null);
        return ({ name: pt.period || pt.date || pt.period_label || '', value: val });
    });
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

// Task-specific metrics renderer (helper functions)
const TaskSpecificMetrics = ({ metrics, taskType }) => {
    if (!metrics || typeof metrics !== 'object') return (
        <div className="eda-analysis-block">
            <h5 className="eda-analysis-block-title">Task Metrics</h5>
            <p className="eda-empty-msg">No task-specific metrics available.</p>
        </div>
    );

    function renderRegression() {
        // schema: target_stats and feature_target_correlations
        const targetStats = metrics.target_stats || null;
        const correlations = metrics.feature_target_correlations || {};
        const corrEntries = Object.entries(correlations || {}).sort((a, b) => Math.abs(b[1] || 0) - Math.abs(a[1] || 0)).slice(0, 20);

        return (
            <div className="eda-analysis-block">
                <h5 className="eda-analysis-block-title">Regression Metrics</h5>
                <div className="metrics-grid">
                    {targetStats && (
                        <div className="metric-card">
                            <strong>Target statistics</strong>
                            <div className="metric-values">
                                <div>Mean: {renderValue(targetStats.mean)}</div>
                                <div>Std: {renderValue(targetStats.std)}</div>
                                <div>Skewness: {renderValue(targetStats.skewness)}</div>
                                <div>Min: {renderValue(targetStats.min)}</div>
                                <div>Max: {renderValue(targetStats.max)}</div>
                                <div>Null count: {renderValue(targetStats.null_count)}</div>
                            </div>
                        </div>
                    )}

                    {corrEntries.length > 0 && (
                        <div className="metric-card">
                            <strong>Feature-target correlations (top)</strong>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Feature</th><th>|r|</th></tr></thead>
                                    <tbody>
                                        {corrEntries.map(([f, val]) => (
                                            <tr key={f}><td>{f}</td><td>{(val !== null && val !== undefined) ? Number(val).toFixed(3) : 'N/A'}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderClassification() {
        // schema: class_distribution: { label: {count, ratio} }
        const dist = metrics.class_distribution || metrics.class_distribution || null;
        const entries = dist ? Object.entries(dist) : [];

        return (
            <div className="eda-analysis-block">
                <h5 className="eda-analysis-block-title">Classification Metrics</h5>
                <div className="metrics-grid">
                    {entries.length > 0 && (
                        <div className="metric-card">
                            <strong>Class distribution</strong>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Class</th><th>Count</th><th>Ratio</th></tr></thead>
                                    <tbody>
                                        {entries.map(([label, obj]) => (
                                            <tr key={label}><td>{label}</td><td>{renderValue(obj?.count)}</td><td>{renderValue(obj?.ratio)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="metric-card">
                        <strong>Balance</strong>
                        <div className="metric-values">
                            <div>Num classes: {metrics.num_classes ?? 'N/A'}</div>
                            <div>Imbalance ratio: {metrics.imbalance_ratio ?? 'N/A'}</div>
                            <div>Imbalanced: {metrics.is_imbalanced ? 'Yes' : 'No'}</div>
                            {metrics.target_classes && <div>Classes: {Array.isArray(metrics.target_classes) ? metrics.target_classes.join(', ') : String(metrics.target_classes)}</div>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderClustering() {
        //schema: feature_variances and feature_ranges
        const variances = metrics.feature_variances || {};
        const ranges = metrics.feature_ranges || {};
        const varEntries = Object.entries(variances || {}).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0, 20);

        return (
            <div className="eda-analysis-block">
                <h5 className="eda-analysis-block-title">Clustering Metrics</h5>
                <div className="metrics-grid">
                    {varEntries.length > 0 && (
                        <div className="metric-card">
                            <strong>Top feature variances</strong>
                            <ul className="feature-list">
                                {varEntries.map(([f, v]) => <li key={f}>{f}: {v === null || v === undefined ? 'N/A' : Number(v).toFixed(3)}</li>)}
                            </ul>
                        </div>
                    )}

                    {Object.keys(ranges || {}).length > 0 && (
                        <div className="metric-card">
                            <strong>Feature ranges</strong>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Feature</th><th>Range</th></tr></thead>
                                    <tbody>
                                        {Object.entries(ranges).map(([f, r]) => (
                                            <tr key={f}><td>{f}</td><td>{renderValue(r)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderTimeSeries() {
        // schema: time_coverage & stationarity_hint
        const coverage = metrics.time_coverage || metrics.time_range || null;
        const station = metrics.stationarity_hint || metrics.stationarity || null;

        return (
            <div className="eda-analysis-block">
                <h5 className="eda-analysis-block-title">Time Series Metrics</h5>
                <div className="metrics-grid">
                    {coverage && (
                        <div className="metric-card">
                            <strong>Time coverage</strong>
                            <div className="metric-values">
                                <div>Start: {coverage.start ?? 'N/A'}</div>
                                <div>End: {coverage.end ?? 'N/A'}</div>
                                <div>Range (days): {coverage.range_days ?? 'N/A'}</div>
                                <div>Records: {coverage.record_count ?? 'N/A'}</div>
                                <div>Median gap (hrs): {coverage.median_gap_hours ?? 'N/A'}</div>
                                <div>Missing timestamps: {coverage.missing_timestamps ?? 'N/A'}</div>
                            </div>
                        </div>
                    )}

                    {station && (
                        <div className="metric-card">
                            <strong>Stationarity hint</strong>
                            <div className="metric-values">
                                <div>Rolling mean range: {station.rolling_mean_range ?? 'N/A'}</div>
                                <div>Rolling std range: {station.rolling_std_range ?? 'N/A'}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderGeneral() {
        return (
            <div className="eda-analysis-block">
                <h5 className="eda-analysis-block-title">General Metrics</h5>
                <div className="metrics-grid">
                    {metrics.top_variance_features && (
                        <div className="metric-card">
                            <strong>Top variance features</strong>
                            <ul className="feature-list">
                                {metrics.top_variance_features.map(f => <li key={f}>{f}</li>)}
                            </ul>
                        </div>
                    )}

                    <div className="metric-card">
                        <div>Numeric features: {metrics.numeric_feature_count ?? 'N/A'}</div>
                        <div>Categorical features: {metrics.categorical_feature_count ?? 'N/A'}</div>
                    </div>
                </div>
            </div>
        );
    }

    switch (taskType) {
        case 'regression': return renderRegression();
        case 'classification': return renderClassification();
        case 'clustering': return renderClustering();
        case 'time_series': return renderTimeSeries();
        default: return renderGeneral();
    }
};

const EdaAnalysis = ({ resultJson }) => {
    const [activeTab, setActiveTab] = useState('task_metrics');

    if (!resultJson) return null;

    const availableTabs = TABS.filter(tab => {
        const data = resultJson[tab.key];
        return data && typeof data === 'object' && Object.keys(data).length > 0;
    });

    if (availableTabs.length === 0) {
        return (
            <div className="eda-section eda-analysis">
                <h3 className="eda-section-title">Analysis Details</h3>
                <p className="eda-empty-msg">No detailed analysis data available.</p>
            </div>
        );
    }

    const currentTab = availableTabs.find(t => t.key === activeTab) || availableTabs[0];
    const tabData = resultJson[currentTab.key];

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
                    {currentTab.key === 'task_metrics' ? (
                        <TaskSpecificMetrics metrics={tabData} taskType={resultJson.task_type} />
                    ) : currentTab.key === 'temporal' ? (
                        // temporal: render each time-column's trend/rolling/decomposition with small charts
                        <div>
                            {typeof tabData === 'object' && Object.keys(tabData).length > 0 ? (
                                // normalize schema: tabData may be { time_columns: { <dt_col>: {...} } }
                                (() => {
                                    const timeColumns = tabData.time_columns || tabData;
                                    return Object.entries(timeColumns).map(([timeCol, tdata]) => {
                                        // handle insufficient data marker
                                        if (!tdata || tdata.status === 'insufficient_data') {
                                            return (
                                                <div key={timeCol} className="eda-analysis-block">
                                                    <h5 className="eda-analysis-block-title">{timeCol}</h5>
                                                    <p className="eda-empty-msg">Insufficient temporal data.</p>
                                                </div>
                                            );
                                        }

                                        // record counts by period (monthly) - show as small table
                                        const monthly = tdata.record_count_by_period?.monthly || (tdata.record_count_by_period ? tdata.record_count_by_period.monthly : null) || null;

                                        // trends: schema has trends: { <num_col>: [ {period, mean, sum, count} ] }
                                        const trendsObj = tdata.trends || {};
                                        const trendKeys = Object.keys(trendsObj || {});

                                        return (
                                            <div key={timeCol} className="eda-analysis-block">
                                                <h5 className="eda-analysis-block-title">{timeCol}</h5>

                                                {monthly && (
                                                    <div className="eda-monthly-section">
                                                        <strong>Record count (monthly)</strong>
                                                        <div className="table-wrapper mt-8">
                                                            <table>
                                                                <thead><tr><th>Period</th><th>Count</th></tr></thead>
                                                                <tbody>
                                                                    {monthly.slice(0, 24).map((r, i) => (
                                                                        <tr key={i}><td>{r.period}</td><td>{r.count}</td></tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Render each numeric trend series as a small chart + table */}
                                                {trendKeys.length > 0 ? (
                                                    trendKeys.map((numCol) => {
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

                                                                {seriesArr && seriesArr.length > 0 && (
                                                                    <div className="table-wrapper mt-8">
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
                                                    })
                                                ) : (
                                                    <div className="eda-empty-msg">No numeric trend series available for this time column.</div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <p className="eda-empty-msg">No temporal data available.</p>
                            )}
                        </div>
                    ) : currentTab.key === 'bivariate' ? (
                        <div>
                            {/* show high correlation pairs if present */}
                            {resultJson.bivariate && Array.isArray(resultJson.bivariate.high_correlations) && resultJson.bivariate.high_correlations.length > 0 && (
                                <div className="eda-analysis-block">
                                    <h5 className="eda-analysis-block-title">High Correlations</h5>
                                    <ul className="feature-list">
                                        {resultJson.bivariate.high_correlations.map((p, i) => (
                                            <li key={i}>{p.column_1} ↔ {p.column_2} — {p.correlation?.toFixed(3)} ({p.strength ?? 'n/a'})</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <ObjectTable data={tabData} title={currentTab.label} />
                        </div>
                    ) : (
                        // If tabData is an array (some backends return lists for univariate or other sections), render each item
                        Array.isArray(tabData) ? (
                            <div>
                                {tabData.length === 0 ? (
                                    <p className="eda-empty-msg">No data available.</p>
                                ) : (
                                    tabData.map((item, idx) => (
                                        <div key={idx} className="eda-analysis-block">
                                            <h5 className="eda-analysis-block-title">{currentTab.label} {tabData.length > 1 ? `#${idx + 1}` : ''}</h5>
                                            {item && typeof item === 'object' ? (
                                                <ObjectTable data={item} />
                                            ) : (
                                                <pre className="eda-pre">{renderValue(item)}</pre>
                                            )}
                                        </div>
                                    ))
                                )}
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

