import React, { useState } from 'react';

const TASK_TYPE_LABELS = {
    general: 'General EDA',
    regression: 'Regression',
    classification: 'Classification',
    clustering: 'Clustering',
    time_series: 'Time Series',
};

const fmt = (v, decimals = 2) => {
    if (v === null || v === undefined) return 'N/A';
    if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: decimals });
    return String(v);
};

const pct = (v) => (v === null || v === undefined) ? 'N/A' : `${(Number(v) * 100).toFixed(1)}%`;

// Plain Yes/No helper
const YesNo = ({ value }) => {
    if (value === null || value === undefined) return <span>N/A</span>;
    return <span>{value ? 'Yes' : 'No'}</span>;
};

// Tab definitions
const TABS = [
    { key: 'overview',    label: 'Overview' },
    { key: 'task',        label: 'Task Metrics' },
    { key: 'columns',     label: 'Columns' },
    { key: 'plan',        label: 'Analysis Plan' },
    { key: 'readiness',   label: 'Readiness' },
    { key: 'reflection',  label: 'Self-Reflection' },
];

// Overview tab
const OverviewTab = ({ summary, task, taskType, overview, readiness }) => (
    <div>
        {/* Context cards */}
        {(summary.goal || summary.dataset_context?.domain || summary.dataset_context?.description || summary.overall_assessment) && (
            <div className="summary-context">
                {summary.goal && (
                    <div className="context-item"><strong>Analysis Goal</strong><p>{summary.goal}</p></div>
                )}
                {summary.dataset_context?.domain && (
                    <div className="context-item"><strong>Domain</strong><p>{summary.dataset_context.domain}</p></div>
                )}
                {summary.dataset_context?.description && (
                    <div className="context-item"><strong>Description</strong><p>{summary.dataset_context.description}</p></div>
                )}
                {summary.overall_assessment && (
                    <div className="context-item"><strong>Assessment</strong><p>{summary.overall_assessment}</p></div>
                )}
            </div>
        )}

        {/* Stat cards */}
        <div className="eda-summary-grid">
            <div className="eda-stat-card">
                <span className="eda-stat-label">Task Type</span>
                <span className="eda-stat-value">{TASK_TYPE_LABELS[taskType] || taskType || 'N/A'}</span>
            </div>
            {task.target_column && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Target Column</span>
                    <span className="eda-stat-value">{task.target_column}</span>
                </div>
            )}
            {task.time_column && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Time Column</span>
                    <span className="eda-stat-value">{task.time_column}</span>
                </div>
            )}
            {task.ready_for_modeling != null && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Ready for Modeling</span>
                    <span className="eda-stat-value"><YesNo value={task.ready_for_modeling} /></span>
                </div>
            )}
            {overview.row_count !== undefined && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Rows</span>
                    <span className="eda-stat-value">{fmt(overview.row_count, 0)}</span>
                </div>
            )}
            {overview.column_count !== undefined && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Columns</span>
                    <span className="eda-stat-value">{fmt(overview.column_count, 0)}</span>
                </div>
            )}
            {summary.confidence_score != null && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Confidence</span>
                    <span className="eda-stat-value">{pct(summary.confidence_score)}</span>
                </div>
            )}
            {readiness.data_quality_score !== undefined && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Data Quality</span>
                    <span className="eda-stat-value">{pct(readiness.data_quality_score)}</span>
                </div>
            )}
            {readiness.leakage_risk_score !== undefined && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Leakage Risk</span>
                    <span className="eda-stat-value">{pct(readiness.leakage_risk_score)}</span>
                </div>
            )}
            {readiness.feature_redundancy_score !== undefined && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Redundancy</span>
                    <span className="eda-stat-value">{pct(readiness.feature_redundancy_score)}</span>
                </div>
            )}
            {readiness.class_imbalance_flag !== undefined && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Class Imbalance</span>
                    <span className="eda-stat-value"><YesNo value={readiness.class_imbalance_flag} /></span>
                </div>
            )}
            {readiness.target_missing_flag !== undefined && (
                <div className="eda-stat-card">
                    <span className="eda-stat-label">Target Missing</span>
                    <span className="eda-stat-value"><YesNo value={readiness.target_missing_flag} /></span>
                </div>
            )}
        </div>
    </div>
);

// Task Metrics tab
const TaskMetricsTab = ({ taskMetrics, taskType, task }) => {
    if (!taskMetrics || Object.keys(taskMetrics).length === 0)
        return <p className="eda-empty-msg">No task metrics available.</p>;
    return (
        <div>
            {/* Cross-cutting columns */}
            {(taskMetrics.sensitive_columns?.length > 0 || taskMetrics.high_leakage_columns?.length > 0 ||
              taskMetrics.auxiliary_columns?.length > 0 || taskMetrics.ignored_columns?.length > 0) && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Column Roles</h4>
                    {taskMetrics.sensitive_columns?.length > 0 && (
                        <div className="eda-col-role-row">
                            <span className="eda-col-role-label">SENSITIVE</span>
                            {taskMetrics.sensitive_columns.map((c, i) => (
                                <span key={i} className="eda-column-tag tag-warning">{c.name} ({c.sensitivity})</span>
                            ))}
                        </div>
                    )}
                    {taskMetrics.high_leakage_columns?.length > 0 && (
                        <div className="eda-col-role-row">
                            <span className="eda-col-role-label">HIGH LEAKAGE</span>
                            {taskMetrics.high_leakage_columns.map((c, i) => (
                                <span key={i} className="eda-column-tag tag-danger">{typeof c === 'string' ? c : c.name}</span>
                            ))}
                        </div>
                    )}
                    {taskMetrics.auxiliary_columns?.length > 0 && (
                        <div className="eda-col-role-row">
                            <span className="eda-col-role-label">AUXILIARY</span>
                            {taskMetrics.auxiliary_columns.map((c, i) => (
                                <span key={i} className="eda-column-tag">{c}</span>
                            ))}
                        </div>
                    )}
                    {taskMetrics.ignored_columns?.length > 0 && (
                        <div className="eda-col-role-row">
                            <span className="eda-col-role-label">IGNORED</span>
                            {taskMetrics.ignored_columns.map((c, i) => (
                                <span key={i} className="eda-column-tag">{c}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Target Semantic */}
            {taskMetrics.target_semantic && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Target Semantic — {taskMetrics.target_column}</h4>
                    <div className="eda-summary-grid">
                        {[
                            ['Description', taskMetrics.target_semantic.description],
                            ['Business Category', taskMetrics.target_semantic.business_category],
                            ['Sensitivity', taskMetrics.target_semantic.sensitivity],
                            ['Leakage Risk', taskMetrics.target_semantic.leakage_risk],
                            ['Target Confidence', pct(taskMetrics.target_semantic.target_confidence)],
                            ['Time Dependent', taskMetrics.target_semantic.time_dependent != null ? (taskMetrics.target_semantic.time_dependent ? 'Yes' : 'No') : 'N/A'],
                        ].map(([label, val]) => (
                            <div key={label} className="eda-stat-card">
                                <span className="eda-stat-label">{label}</span>
                                <span className="eda-stat-value">{val ?? 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Regression */}
            {taskType === 'regression' && taskMetrics.target_stats && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Target Stats — {task.target_column}</h4>
                    <div className="eda-summary-grid">
                        {[
                            ['Mean',             fmt(taskMetrics.target_stats.mean)],
                            ['Std',              fmt(taskMetrics.target_stats.std)],
                            ['CV',               fmt(taskMetrics.target_stats.cv)],
                            ['Variance',         fmt(taskMetrics.target_stats.variance)],
                            ['Min',              fmt(taskMetrics.target_stats.min, 0)],
                            ['Max',              fmt(taskMetrics.target_stats.max, 0)],
                            ['Range',            fmt(taskMetrics.target_stats.range, 0)],
                            ['P25',              fmt(taskMetrics.target_stats.p25)],
                            ['P50',              fmt(taskMetrics.target_stats.p50)],
                            ['P75',              fmt(taskMetrics.target_stats.p75)],
                            ['IQR',              fmt(taskMetrics.target_stats.iqr)],
                            ['Skewness',         fmt(taskMetrics.target_stats.skewness)],
                            ['Skew Category',    taskMetrics.target_stats.skew_category ?? 'N/A'],
                            ['Kurtosis',         fmt(taskMetrics.target_stats.kurtosis)],
                            ['Outliers',         `${taskMetrics.target_stats.outlier_count ?? 'N/A'} (${pct(taskMetrics.target_stats.outlier_ratio)})`],
                            ['Outlier Severity', fmt(taskMetrics.target_stats.outlier_severity_index)],
                            ['Zeros',            `${taskMetrics.target_stats.zero_count ?? 'N/A'} (${pct(taskMetrics.target_stats.zero_ratio)})`],
                            ['Nulls',            `${taskMetrics.target_stats.null_count ?? 'N/A'} (${pct(taskMetrics.target_stats.null_ratio)})`],
                            ['Dominant Ratio',   pct(taskMetrics.target_stats.dominant_ratio)],
                        ].map(([label, val]) => (
                            <div key={label} className="eda-stat-card">
                                <span className="eda-stat-label">{label}</span>
                                <span className="eda-stat-value">{val}</span>
                            </div>
                        ))}
                    </div>
                    {taskMetrics.target_stats.distribution_shape_flags?.length > 0 && (
                        <div className="eda-quality-tags eda-quality-tags--mt">
                            {taskMetrics.target_stats.distribution_shape_flags.map((f, i) => (
                                <span key={i} className="eda-column-tag tag-warning">{f}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {taskType === 'regression' && taskMetrics.feature_target_correlations &&
             Object.keys(taskMetrics.feature_target_correlations).length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Feature → Target Correlations</h4>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Feature</th><th>Correlation</th></tr></thead>
                            <tbody>
                                {Object.entries(taskMetrics.feature_target_correlations)
                                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                                    .map(([col, val]) => (
                                        <tr key={col}><td>{col}</td><td>{fmt(val, 4)}</td></tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Classification */}
            {taskType === 'classification' && taskMetrics.class_distribution && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Class Distribution</h4>
                    <div className="eda-summary-grid eda-summary-grid--mb">
                        {[
                            ['Num Classes',     taskMetrics.num_classes],
                            ['Imbalance Ratio', fmt(taskMetrics.imbalance_ratio)],
                        ].map(([label, val]) => (
                            <div key={label} className="eda-stat-card">
                                <span className="eda-stat-label">{label}</span>
                                <span className="eda-stat-value">{val ?? 'N/A'}</span>
                            </div>
                        ))}
                        {taskMetrics.is_imbalanced !== undefined && (
                            <div className="eda-stat-card">
                                <span className="eda-stat-label">Is Imbalanced</span>
                                <span className="eda-stat-value"><YesNo value={taskMetrics.is_imbalanced} invertColor /></span>
                            </div>
                        )}
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Class</th><th>Count</th><th>Ratio</th></tr></thead>
                            <tbody>
                                {Object.entries(taskMetrics.class_distribution).map(([label, obj]) => (
                                    <tr key={label}>
                                        <td>{label}</td>
                                        <td>{fmt(obj?.count, 0)}</td>
                                        <td>{pct(obj?.ratio)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {taskMetrics.target_classes?.length > 0 && (
                        <div className="eda-quality-tags eda-quality-tags--mt">
                            <strong className="eda-col-role-label">CLASSES</strong>
                            {taskMetrics.target_classes.map((c, i) => <span key={i} className="eda-column-tag">{c}</span>)}
                        </div>
                    )}
                </div>
            )}

            {/* Clustering */}
            {taskType === 'clustering' && taskMetrics.feature_variances &&
             Object.keys(taskMetrics.feature_variances).length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Feature Variances</h4>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Feature</th><th>Variance</th><th>Range</th><th>Complexity</th></tr></thead>
                            <tbody>
                                {Object.entries(taskMetrics.feature_variances)
                                    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                                    .map(([col, variance]) => (
                                        <tr key={col}>
                                            <td>{col}</td>
                                            <td>{fmt(variance, 4)}</td>
                                            <td>{fmt(taskMetrics.feature_ranges?.[col], 4)}</td>
                                            <td>{fmt(taskMetrics.feature_complexity_scores?.[col], 4)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Time Series */}
            {taskType === 'time_series' && (
                <>
                    {(taskMetrics.leakage_risk != null || taskMetrics.target_confidence != null || taskMetrics.time_dependent != null) && (
                        <div className="eda-quality-table-section">
                            <h4 className="eda-subsection-title">Time Series Target Metadata</h4>
                            <div className="eda-summary-grid">
                                {taskMetrics.leakage_risk != null && (
                                    <div className="eda-stat-card"><span className="eda-stat-label">Leakage Risk</span><span className="eda-stat-value">{taskMetrics.leakage_risk}</span></div>
                                )}
                                {taskMetrics.target_confidence != null && (
                                    <div className="eda-stat-card"><span className="eda-stat-label">Target Confidence</span><span className="eda-stat-value">{pct(taskMetrics.target_confidence)}</span></div>
                                )}
                                {taskMetrics.time_dependent != null && (
                                    <div className="eda-stat-card"><span className="eda-stat-label">Time Dependent</span><span className="eda-stat-value">{taskMetrics.time_dependent ? 'Yes' : 'No'}</span></div>
                                )}
                            </div>
                        </div>
                    )}
                    {taskMetrics.time_coverage && (
                        <div className="eda-quality-table-section">
                            <h4 className="eda-subsection-title">Time Coverage</h4>
                            <div className="eda-summary-grid">
                                {[
                                    ['Start',              taskMetrics.time_coverage.start],
                                    ['End',                taskMetrics.time_coverage.end],
                                    ['Range (days)',        taskMetrics.time_coverage.range_days],
                                    ['Records',            fmt(taskMetrics.time_coverage.record_count, 0)],
                                    ['Median Gap (hrs)',   fmt(taskMetrics.time_coverage.median_gap_hours)],
                                    ['Missing Timestamps', taskMetrics.time_coverage.missing_timestamps],
                                ].map(([label, val]) => (
                                    <div key={label} className="eda-stat-card">
                                        <span className="eda-stat-label">{label}</span>
                                        <span className="eda-stat-value">{val ?? 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {taskMetrics.stationarity_hint && Object.keys(taskMetrics.stationarity_hint).length > 0 && (
                        <div className="eda-quality-table-section">
                            <h4 className="eda-subsection-title">Stationarity Hint</h4>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Column</th><th>Rolling Mean Range</th><th>Rolling Std Range</th></tr></thead>
                                    <tbody>
                                        {Object.entries(taskMetrics.stationarity_hint).map(([col, hints]) => (
                                            <tr key={col}>
                                                <td>{col}</td>
                                                <td>{fmt(hints?.rolling_mean_range, 4)}</td>
                                                <td>{fmt(hints?.rolling_std_range, 4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Columns tab
const ColumnRow = ({ col }) => {
    const [open, setOpen] = useState(false);
    const hasStats    = col.statistics && typeof col.statistics === 'object';
    const hasTopVals  = Array.isArray(col.top_values) && col.top_values.length > 0;
    const hasValDist  = Array.isArray(col.value_distribution) && col.value_distribution.length > 0;
    const hasDatetime = col.datetime_min || col.datetime_max || col.time_coverage;
    const hasDetail   = hasStats || hasTopVals || hasValDist || hasDatetime;

    return (
        <>
            <tr
                onClick={() => hasDetail && setOpen(o => !o)}
                className={`eda-col-row${hasDetail ? ' eda-col-row--clickable' : ''}${open ? ' eda-col-row--open' : ''}`}
            >
                <td>
                    {hasDetail && <span className="eda-col-expand-icon">{open ? '▲' : '▼'}</span>}
                    {col.name}
                </td>
                <td>{col.storage_type}</td>
                <td>{col.logical_type}</td>
                <td>{col.nullable ? 'Yes' : 'No'}</td>
                <td>{col.null_count ?? 0} ({pct(col.null_ratio)})</td>
                <td>{col.non_null_count ?? 'N/A'}</td>
                <td>{col.distinct_count ?? 'N/A'}</td>
                <td>{col.cardinality_level ?? 'N/A'}</td>
                <td>{col.complexity_score != null ? Number(col.complexity_score).toFixed(2) : 'N/A'}</td>
                <td>{col.is_unique_non_nullable ? 'Yes' : 'No'}</td>
                <td>{col.is_categorical ? 'Yes' : 'No'}</td>
                <td>{col.is_potential_id_like ? 'Yes' : 'No'}</td>
                <td>{col.dominant_ratio != null ? pct(col.dominant_ratio) : 'N/A'}</td>
                <td>{col.entropy != null ? Number(col.entropy).toFixed(2) : 'N/A'}</td>
                <td>{Array.isArray(col.sample) ? col.sample.slice(0, 3).join(', ') : 'N/A'}</td>
            </tr>
            {open && hasDetail && (
                <tr>
                    <td colSpan={15} className="eda-col-detail-td">
                        {hasStats && (
                            <div className="eda-quality-table-section">
                                <h4 className="eda-subsection-title">Statistics</h4>
                                <div className="eda-summary-grid">
                                    {[
                                        ['Min',              fmt(col.statistics.min)],
                                        ['Max',              fmt(col.statistics.max)],
                                        ['Mean',             fmt(col.statistics.mean)],
                                        ['Std',              fmt(col.statistics.std)],
                                        ['CV',               fmt(col.statistics.cv)],
                                        ['Variance',         fmt(col.statistics.variance)],
                                        ['Range',            fmt(col.statistics.range)],
                                        ['P25',              fmt(col.statistics.p25)],
                                        ['P50',              fmt(col.statistics.p50)],
                                        ['P75',              fmt(col.statistics.p75)],
                                        ['IQR',              fmt(col.statistics.iqr)],
                                        ['Skewness',         fmt(col.statistics.skewness)],
                                        ['Skew Category',    col.statistics.skew_category ?? 'N/A'],
                                        ['Kurtosis',         fmt(col.statistics.kurtosis)],
                                        ['Outliers',         `${col.statistics.outlier_count ?? 'N/A'} (${pct(col.statistics.outlier_ratio)})`],
                                        ['Outlier Severity', fmt(col.statistics.outlier_severity_index)],
                                        ['Zeros',            `${col.statistics.zero_count ?? 'N/A'} (${pct(col.statistics.zero_ratio)})`],
                                    ].map(([label, val]) => (
                                        <div key={label} className="eda-stat-card">
                                            <span className="eda-stat-label">{label}</span>
                                            <span className="eda-stat-value">{val}</span>
                                        </div>
                                    ))}
                                </div>
                                {col.statistics.distribution_shape_flags?.length > 0 && (
                                    <div className="eda-quality-tags eda-quality-tags--mt">
                                        {col.statistics.distribution_shape_flags.map((f, i) => (
                                            <span key={i} className="eda-column-tag tag-warning">{f}</span>
                                        ))}
                                    </div>
                                )}
                                {col.statistics.histogram?.length > 0 && (
                                    <div className="eda-histogram-section">
                                        <h4 className="eda-subsection-title">Histogram</h4>
                                        <div className="table-wrapper">
                                            <table>
                                                <thead><tr><th>Bin Start</th><th>Bin End</th><th>Count</th></tr></thead>
                                                <tbody>
                                                    {col.statistics.histogram.map((bin, i) => (
                                                        <tr key={i}>
                                                            <td>{fmt(bin.bin_start)}</td>
                                                            <td>{fmt(bin.bin_end)}</td>
                                                            <td>{bin.count}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {hasTopVals && (
                            <div className="eda-quality-table-section">
                                <h4 className="eda-subsection-title">Top Values</h4>
                                <div className="table-wrapper">
                                    <table>
                                        <thead><tr><th>Value</th><th>Count</th></tr></thead>
                                        <tbody>
                                            {col.top_values.map((tv, i) => (
                                                <tr key={i}><td>{tv.value}</td><td>{tv.count}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {hasValDist && (
                            <div className="eda-quality-table-section">
                                <h4 className="eda-subsection-title">Value Distribution</h4>
                                <div className="table-wrapper">
                                    <table>
                                        <thead><tr><th>Value</th><th>Count</th><th>Ratio</th></tr></thead>
                                        <tbody>
                                            {col.value_distribution.map((vd, i) => (
                                                <tr key={i}><td>{vd.value}</td><td>{vd.count}</td><td>{pct(vd.ratio)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {hasDatetime && (
                            <div className="eda-quality-table-section">
                                <h4 className="eda-subsection-title">Datetime Info</h4>
                                <div className="eda-summary-grid">
                                    {[
                                        ['Min',               col.datetime_min],
                                        ['Max',               col.datetime_max],
                                        ['Granularity',       col.time_granularity],
                                        ...(col.time_coverage ? [
                                            ['Coverage Start',     col.time_coverage.start],
                                            ['Coverage End',       col.time_coverage.end],
                                            ['Range Days',         col.time_coverage.range_days],
                                            ['Records',            col.time_coverage.record_count],
                                            ['Median Gap (hrs)',   col.time_coverage.median_gap_hours],
                                            ['Missing Timestamps', col.time_coverage.missing_timestamps],
                                        ] : []),
                                    ].map(([label, val]) => (
                                        <div key={label} className="eda-stat-card">
                                            <span className="eda-stat-label">{label}</span>
                                            <span className="eda-stat-value">{val ?? 'N/A'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
};

const ColumnsTab = ({ columns }) => {
    if (!columns || columns.length === 0)
        return <p className="eda-empty-msg">No column data available.</p>;
    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Name</th><th>Storage Type</th><th>Logical</th><th>Nullable</th>
                        <th>Nulls</th><th>Non-Null</th><th>Distinct</th><th>Cardinality</th>
                        <th>Complexity</th><th>Unique</th><th>Categorical</th><th>ID-like</th>
                        <th>Dominant Ratio</th><th>Entropy</th><th>Sample</th>
                    </tr>
                </thead>
                <tbody>
                    {columns.map((col) => <ColumnRow key={col.name} col={col} />)}
                </tbody>
            </table>
        </div>
    );
};

// Readiness tab
const ReadinessTab = ({ readiness }) => {
    if (!readiness || Object.keys(readiness).length === 0)
        return <p className="eda-empty-msg">No readiness data available.</p>;
    const sb = readiness.score_breakdown || {};
    return (
        <div>
            {/* Score cards */}
            <div className="eda-summary-grid eda-summary-grid--mb-lg">
                {readiness.data_quality_score != null && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Data Quality</span>
                        <span className="eda-stat-value">{pct(readiness.data_quality_score)}</span>
                    </div>
                )}
                {readiness.leakage_risk_score != null && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Leakage Risk</span>
                        <span className="eda-stat-value">{pct(readiness.leakage_risk_score)}</span>
                    </div>
                )}
                {readiness.feature_redundancy_score != null && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Redundancy</span>
                        <span className="eda-stat-value">{pct(readiness.feature_redundancy_score)}</span>
                    </div>
                )}
                {readiness.class_imbalance_flag !== undefined && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Class Imbalance</span>
                        <span className="eda-stat-value"><YesNo value={readiness.class_imbalance_flag} /></span>
                    </div>
                )}
                {readiness.target_missing_flag !== undefined && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Target Missing</span>
                        <span className="eda-stat-value"><YesNo value={readiness.target_missing_flag} /></span>
                    </div>
                )}
                {readiness.ready_for_modeling !== undefined && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Ready for Modeling</span>
                        <span className="eda-stat-value"><YesNo value={readiness.ready_for_modeling} /></span>
                    </div>
                )}
            </div>

            {/* Blockers */}
            {readiness.blockers?.length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Blockers</h4>
                    {readiness.blockers.map((b, i) => (
                        <div key={i} className="eda-alert eda-alert-critical">
                            <strong>{b.code}</strong>{b.severity ? ` [${b.severity}]` : ''}: {b.message}
                            {b.issue_ids?.length > 0 && (
                                <div className="eda-quality-tags eda-quality-tags--mt-sm">
                                    <span className="eda-issues-label">Issues: </span>
                                    {b.issue_ids.map((id, j) => <span key={j} className="eda-column-tag">{id}</span>)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Warnings */}
            {readiness.warnings?.length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Warnings</h4>
                    {readiness.warnings.map((w, i) => (
                        <div key={i} className="eda-alert eda-alert-warning">
                            <strong>{w.code}</strong>: {w.message}
                        </div>
                    ))}
                </div>
            )}

            {/* Score breakdown */}
            {sb.quality && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Quality Breakdown</h4>
                    <div className="eda-summary-grid">
                        {[
                            ['Total Missing',       pct(sb.quality.total_missing_ratio)],
                            ['Duplicate Rows',      pct(sb.quality.duplicate_row_ratio)],
                            ['Constant Col Ratio',  pct(sb.quality.constant_col_ratio)],
                            ['Severe Outlier Ratio',pct(sb.quality.severe_outlier_ratio)],
                            ['Quality Penalty',     fmt(sb.quality.penalty)],
                            ['Severe Outlier Cols', (sb.quality.severe_outlier_cols || []).join(', ') || 'None'],
                            ['Constant Cols',       (sb.quality.constant_cols || []).join(', ') || 'None'],
                        ].map(([label, val]) => (
                            <div key={label} className="eda-stat-card">
                                <span className="eda-stat-label">{label}</span>
                                <span className="eda-stat-value">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {sb.leakage && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Leakage Breakdown</h4>
                    <div className="eda-summary-grid">
                        {[
                            ['High Leakage Cols',     sb.leakage.high_leakage_count],
                            ['Moderate Leakage Cols', sb.leakage.moderate_leakage_count],
                            ['Ignored Role Cols',     sb.leakage.ignore_role_count],
                            ['Total Features',        sb.leakage.n_features],
                            ['Leakage Raw Score',     fmt(sb.leakage.raw)],
                        ].map(([label, val]) => (
                            <div key={label} className="eda-stat-card">
                                <span className="eda-stat-label">{label}</span>
                                <span className="eda-stat-value">{val ?? 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {sb.redundancy && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Redundancy Breakdown</h4>
                    <div className="eda-summary-grid eda-summary-grid--mb">
                        {[
                            ['Redundant Pairs',     sb.redundancy.redundant_pair_count],
                            ['All Possible Pairs',  sb.redundancy.all_possible_pairs],
                            ['Numeric Features',    sb.redundancy.numeric_feature_count],
                        ].map(([label, val]) => (
                            <div key={label} className="eda-stat-card">
                                <span className="eda-stat-label">{label}</span>
                                <span className="eda-stat-value">{val ?? 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                    {sb.redundancy.top_redundant_pairs?.length > 0 && (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Col 1</th><th>Col 2</th><th>Correlation</th></tr></thead>
                                <tbody>
                                    {sb.redundancy.top_redundant_pairs.map((p, i) => (
                                        <tr key={i}><td>{p.col1}</td><td>{p.col2}</td><td>{fmt(p.correlation, 3)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {(sb.imbalance || sb.target) && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Target &amp; Imbalance</h4>
                    <div className="eda-summary-grid">
                        {sb.imbalance && (
                            <>
                                <div className="eda-stat-card">
                                    <span className="eda-stat-label">Class Imbalance</span>
                                    <span className="eda-stat-value"><YesNo value={sb.imbalance.class_imbalance_flag} /></span>
                                </div>
                                <div className="eda-stat-card">
                                    <span className="eda-stat-label">Imbalance Ratio</span>
                                    <span className="eda-stat-value">{fmt(sb.imbalance.imbalance_ratio)}</span>
                                </div>
                                <div className="eda-stat-card">
                                    <span className="eda-stat-label">Task Type</span>
                                    <span className="eda-stat-value">{sb.imbalance.task_type ?? 'N/A'}</span>
                                </div>
                            </>
                        )}
                        {sb.target && (
                            <>
                                <div className="eda-stat-card">
                                    <span className="eda-stat-label">Target Column</span>
                                    <span className="eda-stat-value">{sb.target.target_column ?? 'N/A'}</span>
                                </div>
                                <div className="eda-stat-card">
                                    <span className="eda-stat-label">Target Null Ratio</span>
                                    <span className="eda-stat-value">{pct(sb.target.target_null_ratio)}</span>
                                </div>
                                <div className="eda-stat-card">
                                    <span className="eda-stat-label">Target Missing</span>
                                    <span className="eda-stat-value"><YesNo value={sb.target.target_missing} /></span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Analysis Plan tab
const PlanTab = ({ plan }) => {
    if (!plan || Object.keys(plan).length === 0)
        return <p className="eda-empty-msg">No analysis plan available.</p>;
    const signals = plan.dataset_signals || {};
    return (
        <div>
        <div className="eda-summary-grid eda-summary-grid--mb-lg">
            <div className="eda-stat-card">
                <span className="eda-stat-label">Correlation</span>
                <span className="eda-stat-value"><YesNo value={plan.run_correlation} /></span>
            </div>
            <div className="eda-stat-card">
                <span className="eda-stat-label">Mutual Info</span>
                <span className="eda-stat-value"><YesNo value={plan.run_mutual_information} /></span>
            </div>
            <div className="eda-stat-card">
                <span className="eda-stat-label">Temporal Profiles</span>
                <span className="eda-stat-value"><YesNo value={plan.run_temporal_profiles} /></span>
            </div>
            <div className="eda-stat-card">
                <span className="eda-stat-label">Categorical Profiles</span>
                <span className="eda-stat-value"><YesNo value={plan.run_categorical_profiles} /></span>
            </div>
            <div className="eda-stat-card">
                <span className="eda-stat-label">Univariate Depth</span>
                <span className="eda-stat-value">{plan.univariate_depth ?? 'N/A'}</span>
            </div>
            <div className="eda-stat-card">
                <span className="eda-stat-label">Max Pairs</span>
                <span className="eda-stat-value">{fmt(plan.max_pairwise_pairs, 0)}</span>
            </div>
        </div>

            {Object.keys(signals).length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Dataset Signals</h4>
                    <div className="eda-summary-grid">
                        {[
                            ['Rows',              signals.row_count],
                            ['Cols',              signals.col_count],
                            ['Numeric Cols',      signals.numeric_col_count],
                            ['Categorical Cols',  signals.categorical_col_count],
                            ['Datetime Cols',     signals.datetime_col_count],
                            ['Avg Null Ratio',    pct(signals.avg_null_ratio)],
                            ['High-Card Cat',     pct(signals.high_card_cat_ratio)],
                            ['Leakage Cols',      signals.leakage_col_count],
                            ['Ignored Cols',      signals.ignored_col_count],
                            ['Possible Pairs',    signals.all_possible_pairs],
                        ].map(([label, val]) => (
                            <div key={label} className="eda-stat-card">
                                <span className="eda-stat-label">{label}</span>
                                <span className="eda-stat-value">{val ?? 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {plan.skip_reasons && Object.keys(plan.skip_reasons).length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Skip Reasons</h4>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Step</th><th>Reason</th></tr></thead>
                            <tbody>
                                {Object.entries(plan.skip_reasons).map(([step, reason]) => (
                                    <tr key={step}><td>{step}</td><td>{reason}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Self-Reflection tab
const ReflectionTab = ({ reflection }) => {
    if (!reflection || Object.keys(reflection).length === 0)
        return <p className="eda-empty-msg">No self-reflection data available.</p>;
    return (
        <div>
            {/* Scores */}
            <div className="eda-summary-grid eda-summary-grid--mb-lg">
                {reflection.confidence_score != null && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Confidence Score</span>
                        <span className="eda-stat-value">{pct(reflection.confidence_score)}</span>
                    </div>
                )}
                {reflection.meta != null && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Fallback Used</span>
                        <span className="eda-stat-value"><YesNo value={reflection.meta.fallback_used} /></span>
                    </div>
                )}
                {reflection.meta?.error && (
                    <div className="eda-stat-card">
                        <span className="eda-stat-label">Reflection Error</span>
                        <span className="eda-stat-value">{reflection.meta.error}</span>
                    </div>
                )}
            </div>

            {reflection.overall_assessment && (
                <div className="context-item context-item--mb">
                    <strong>Overall Assessment</strong>
                    <p>{reflection.overall_assessment}</p>
                </div>
            )}
            {reflection.reasoning_trace && (
                <div className="context-item context-item--mb">
                    <strong>Reasoning Trace</strong>
                    <p>{reflection.reasoning_trace}</p>
                </div>
            )}

            {reflection.blind_spots?.length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Blind Spots ({reflection.blind_spots.length})</h4>
                    {reflection.blind_spots.map((bs) => (
                        <div key={bs.id} className={`eda-alert eda-alert-${bs.severity ?? 'medium'}`}>
                            <strong>{bs.title}</strong>
                            <em className="eda-blind-spot-meta">({bs.severity}{bs.category ? ` · ${bs.category}` : ''})</em>
                            <p className="eda-blind-spot-desc">{bs.description}</p>
                            {bs.suggested_action && <p className="eda-blind-spot-action">→ {bs.suggested_action}</p>}
                        </div>
                    ))}
                </div>
            )}

            {reflection.weakly_supported_insights?.length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Weakly Supported Insights</h4>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Insight</th><th>Concern</th><th>Missing Evidence</th></tr></thead>
                            <tbody>
                                {reflection.weakly_supported_insights.map((w, i) => (
                                    <tr key={i}>
                                        <td>{w.insight_reference}</td>
                                        <td>{w.concern}</td>
                                        <td>{w.missing_evidence}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {reflection.missing_domain_factors?.length > 0 && (
                <div className="eda-quality-table-section">
                    <h4 className="eda-subsection-title">Missing Domain Factors</h4>
                    <div className="eda-quality-tags">
                        {reflection.missing_domain_factors.map((f, i) => (
                            <span key={i} className="eda-column-tag">{f}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Main component
const EdaSummary = ({ summary }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!summary) {
        return (
            <div className="eda-section eda-summary">
                <h3 className="eda-section-title">Summary</h3>
                <p className="eda-empty-msg">No summary data available.</p>
            </div>
        );
    }

    const task        = summary.task || {};
    const taskMetrics = task.task_metrics || {};
    const taskType    = task.task_type || taskMetrics.task_type || 'general';
    const overview    = summary.dataset_overview || {};
    const columns     = overview.columns || [];
    const readiness   = summary.model_readiness || {};
    const plan        = summary.analysis_plan || {};
    const reflection  = summary.self_reflection || {};

    // Determine which tabs have data
    const availableTabs = TABS.filter(tab => {
        switch (tab.key) {
            case 'overview':   return true;
            case 'task':       return Object.keys(taskMetrics).length > 0;
            case 'columns':    return columns.length > 0;
            case 'readiness':  return Object.keys(readiness).length > 0;
            case 'plan':       return Object.keys(plan).length > 0;
            case 'reflection': return Object.keys(reflection).length > 0;
            default:           return false;
        }
    });

    // Count badges for tabs
    const tabBadges = {
        columns:    columns.length > 0 ? columns.length : null,
        readiness:  readiness.blockers?.length > 0 ? readiness.blockers.length : null,
        reflection: reflection.blind_spots?.length > 0 ? reflection.blind_spots.length : null,
    };

    const currentTab = availableTabs.find(t => t.key === activeTab) || availableTabs[0];

    return (
        <div className="eda-section eda-summary">
            <h3 className="eda-section-title">
                Summary
            </h3>

            {/* Tab bar — same pattern as EdaAnalysis */}
            <div className="eda-tabs">
                {availableTabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`eda-tab-btn ${currentTab.key === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                        {tabBadges[tab.key] != null && (
                            <span className={`eda-tab-badge${tab.key === 'readiness' ? ' eda-tab-badge--danger' : tab.key === 'reflection' ? ' eda-tab-badge--warn' : ''}`}>
                                {tabBadges[tab.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="eda-tab-content">
                {currentTab.key === 'overview' && (
                    <OverviewTab summary={summary} task={task} taskType={taskType} overview={overview} readiness={readiness} />
                )}
                {currentTab.key === 'task' && (
                    <TaskMetricsTab taskMetrics={taskMetrics} taskType={taskType} task={task} />
                )}
                {currentTab.key === 'columns' && (
                    <ColumnsTab columns={columns} />
                )}
                {currentTab.key === 'readiness' && (
                    <ReadinessTab readiness={readiness} />
                )}
                {currentTab.key === 'plan' && (
                    <PlanTab plan={plan} />
                )}
                {currentTab.key === 'reflection' && (
                    <ReflectionTab reflection={reflection} />
                )}
            </div>
        </div>
    );
};

export default EdaSummary;
