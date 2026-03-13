import React from 'react';

const safeNum = (v) =>
    v === null || v === undefined
        ? null
        : Number.isFinite(v)
            ? v
            : typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))
                ? Number(v)
                : null;


// Compact tag list
const TagList = ({ items }) => (
    <div className="eda-quality-tags">
        {items.map((col, i) => (
            <span key={i} className="eda-column-tag">{col}</span>
        ))}
    </div>
);

const fmt = (v) => {
    const n = safeNum(v);
    return n === null ? 'N/A' : n.toLocaleString();
};

const EdaQuality = ({ quality }) => {
    if (!quality) {
        return (
            <div className="eda-section eda-quality">
                <h3 className="eda-section-title">Data Quality</h3>
                <p className="eda-empty-msg">No data quality information available.</p>
            </div>
        );
    }

    const missingValues          = quality.missing_per_column         || {};
    const outliers               = quality.outlier_summary            || {};
    const constantColumns        = quality.constant_columns           || [];
    const highCardinalityColumns = quality.high_cardinality_columns   || [];
    const potentialIdColumns     = quality.potential_id_columns       || [];
    const sensitiveColumns       = quality.sensitive_columns          || [];
    const highLeakageCols        = quality.high_leakage_columns       || [];
    const moderateLeakageCols    = quality.moderate_leakage_columns   || [];
    const ignoreRecommendedCols  = quality.ignore_recommended_columns || [];
    const timeDependentColumns   = quality.time_dependent_columns     || [];
    const missingCorrMatrix      = quality.missing_correlation_matrix || {};

    const duplicateCount = quality.duplicate_row_count ?? null;
    const duplicateRatio = quality.duplicate_row_ratio ?? null;

    const missingEntries = Object.entries(missingValues)
        .filter(([, val]) => (val?.null_count ?? 0) > 0)
        .sort((a, b) => (b[1]?.null_count ?? 0) - (a[1]?.null_count ?? 0));

    const outlierEntries = Object.entries(outliers)
        .filter(([, val]) => (val?.outlier_count ?? 0) > 0)
        .sort((a, b) => (b[1]?.outlier_count ?? 0) - (a[1]?.outlier_count ?? 0));

    return (
        <div className="eda-section eda-quality">
            <h3 className="eda-section-title">Data Quality</h3>

            <div className="eda-quality-body">

                {/* Overview Cards */}
                <div className="eda-quality-grid">

                    {quality.total_rows !== undefined && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Total Rows</span>
                            <span className="eda-quality-value">{fmt(quality.total_rows)}</span>
                        </div>
                    )}

                    {quality.total_cells !== undefined && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Total Cells</span>
                            <span className="eda-quality-value">{fmt(quality.total_cells)}</span>
                        </div>
                    )}

                    <div className="eda-quality-card">
                        <span className="eda-quality-label">Duplicate Rows</span>
                        <span className="eda-quality-value">{duplicateCount !== null ? fmt(duplicateCount) : 'N/A'}</span>
                        {duplicateRatio !== null && (
                            <span className="eda-quality-pct">{(duplicateRatio * 100).toFixed(1)}% of rows</span>
                        )}
                    </div>

                    {quality.total_missing !== undefined && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Total Missing</span>
                            <span className="eda-quality-value">{fmt(quality.total_missing)}</span>
                            {quality.total_missing_ratio !== undefined && (
                                <span className="eda-quality-pct">{(quality.total_missing_ratio * 100).toFixed(2)}% of cells</span>
                            )}
                        </div>
                    )}

                    {quality.memory_usage_mb !== undefined && quality.memory_usage_mb !== null && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Memory Usage</span>
                            <span className="eda-quality-value">
                                {quality.memory_usage_mb}
                                <span className="eda-quality-unit"> MB</span>
                            </span>
                        </div>
                    )}

                    {constantColumns.length > 0 && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Constant Columns</span>
                            <span className="eda-quality-value">{constantColumns.length}</span>
                            <TagList items={constantColumns} />
                        </div>
                    )}

                    {highCardinalityColumns.length > 0 && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">High Cardinality</span>
                            <span className="eda-quality-value">{highCardinalityColumns.length}</span>
                            <TagList items={highCardinalityColumns} />
                        </div>
                    )}

                    {potentialIdColumns.length > 0 && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Potential ID Columns</span>
                            <span className="eda-quality-value">{potentialIdColumns.length}</span>
                            <TagList items={potentialIdColumns} />
                        </div>
                    )}

                    {timeDependentColumns.length > 0 && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Time-Dependent</span>
                            <span className="eda-quality-value">{timeDependentColumns.length}</span>
                            <TagList items={timeDependentColumns} />
                        </div>
                    )}

                </div>

                {/* Missing Values Table */}
                {missingEntries.length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">Missing Values by Column</h4>
                        <div className="eda-quality-table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Missing Count</th>
                                        <th>Missing Ratio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {missingEntries.map(([col, val]) => (
                                        <tr key={col}>
                                            <td>{col}</td>
                                            <td>{fmt(val?.null_count ?? 0)}</td>
                                            <td>{val?.null_ratio != null ? `${(val.null_ratio * 100).toFixed(2)}%` : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Outliers Table */}
                {outlierEntries.length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">Outliers by Column</h4>
                        <div className="eda-quality-table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Outlier Count</th>
                                        <th>Outlier Ratio</th>
                                        <th>Lower Bound</th>
                                        <th>Upper Bound</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outlierEntries.map(([col, val]) => {
                                        const lower = val?.lower_bound ?? null;
                                        const upper = val?.upper_bound ?? null;
                                        return (
                                            <tr key={col}>
                                                <td>{col}</td>
                                                <td>{fmt(val?.outlier_count ?? 0)}</td>
                                                <td>{val?.outlier_ratio != null ? `${(val.outlier_ratio * 100).toFixed(2)}%` : 'N/A'}</td>
                                                <td>{lower !== null ? (Number.isFinite(lower) ? lower.toLocaleString() : String(lower)) : 'N/A'}</td>
                                                <td>{upper !== null ? (Number.isFinite(upper) ? upper.toLocaleString() : String(upper)) : 'N/A'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Sensitive Columns */}
                {sensitiveColumns.length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">Sensitive Columns</h4>
                        <div className="eda-quality-table-wrapper">
                            <table>
                                <thead><tr><th>Column</th><th>Sensitivity</th></tr></thead>
                                <tbody>
                                    {sensitiveColumns.map((c, i) => (
                                        <tr key={i}><td>{c.name}</td><td>{c.sensitivity}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* High Leakage Columns */}
                {highLeakageCols.length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">High Leakage Columns</h4>
                        <div className="eda-quality-table-wrapper">
                            <table>
                                <thead><tr><th>Column</th><th>Leakage Risk</th><th>Description</th></tr></thead>
                                <tbody>
                                    {highLeakageCols.map((c, i) => (
                                        <tr key={i}>
                                            <td>{c.name}</td>
                                            <td>{c.leakage_risk}</td>
                                            <td>{c.description ?? 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Moderate Leakage Columns */}
                {moderateLeakageCols.length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">Moderate Leakage Columns</h4>
                        <div className="eda-quality-table-wrapper">
                            <table>
                                <thead><tr><th>Column</th><th>Leakage Risk</th><th>Description</th></tr></thead>
                                <tbody>
                                    {moderateLeakageCols.map((c, i) => (
                                        <tr key={i}>
                                            <td>{c.name}</td>
                                            <td>{c.leakage_risk}</td>
                                            <td>{c.description ?? 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Ignore-Recommended Columns */}
                {ignoreRecommendedCols.length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">Ignore-Recommended Columns</h4>
                        <div className="eda-quality-table-wrapper">
                            <table>
                                <thead><tr><th>Column</th><th>Modeling Role</th><th>Reason</th></tr></thead>
                                <tbody>
                                    {ignoreRecommendedCols.map((c, i) => (
                                        <tr key={i}>
                                            <td>{c.name}</td>
                                            <td>{c.modeling_role}</td>
                                            <td>{c.reason ?? 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Missing Correlation Matrix */}
                {Object.keys(missingCorrMatrix).length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">Missing Value Correlation Matrix</h4>
                        <div className="eda-corr-matrix-wrapper">
                            <table className="eda-corr-matrix-table">
                                <thead>
                                    <tr>
                                        <th className="eda-corr-matrix-label-cell"></th>
                                        {Object.keys(missingCorrMatrix).map(col => (
                                            <th key={col}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(missingCorrMatrix).map(([row, vals]) => (
                                        <tr key={row}>
                                            <td className="eda-corr-matrix-label-cell"><strong>{row}</strong></td>
                                            {Object.keys(missingCorrMatrix).map(col => {
                                                const v = vals[col];
                                                const n = v != null ? Number(v) : null;
                                                return (
                                                    <td key={col} className="eda-corr-matrix-cell">
                                                        {n !== null ? n.toFixed(3) : '—'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default EdaQuality;

