import React from 'react';

const safeNum = (v) => (v === null || v === undefined) ? null : (Number.isFinite(v) ? v : (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) ? Number(v) : null));

const fmt = (v) => {
    const n = safeNum(v);
    return (n === null) ? 'N/A' : n.toLocaleString();
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

    // Use schema field names
    const missingValues = quality.missing_per_column || {};
    const outliers = quality.outlier_summary || {};
    const constantColumns = quality.constant_columns || [];
    const highCardinalityColumns = quality.high_cardinality_columns || [];

    const duplicateCount = quality.duplicate_row_count ?? null;
    const duplicateRatio = quality.duplicate_row_ratio ?? null;

    const hasMissing = missingValues && typeof missingValues === 'object' && Object.keys(missingValues).length > 0;
    const hasOutliers = outliers && typeof outliers === 'object' && Object.keys(outliers).length > 0;
    const hasConstants = Array.isArray(constantColumns) && constantColumns.length > 0;
    const hasHighCardinality = Array.isArray(highCardinalityColumns) && highCardinalityColumns.length > 0;

    // Filter missing values to only show columns with missing data
    const missingEntries = hasMissing
        ? Object.entries(missingValues)
            .filter(([, val]) => {
                const count = val?.null_count ?? 0;
                return count > 0;
            })
            .sort((a, b) => {
                const aVal = a[1]?.null_count ?? 0;
                const bVal = b[1]?.null_count ?? 0;
                return bVal - aVal;
            })
        : [];

    // Sort outliers by count descending
    const outlierEntries = hasOutliers
        ? Object.entries(outliers)
            .filter(([, val]) => {
                const count = val?.outlier_count ?? 0;
                return count > 0;
            })
            .sort((a, b) => {
                const aVal = a[1]?.outlier_count ?? 0;
                const bVal = b[1]?.outlier_count ?? 0;
                return bVal - aVal;
            })
        : [];

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
                        <span className="eda-quality-value">
                            {duplicateCount !== null ? fmt(duplicateCount) : 'N/A'}
                        </span>
                        {duplicateRatio !== null && duplicateRatio !== undefined && (
                            <span className="eda-quality-pct">({(duplicateRatio * 100).toFixed(1)}%)</span>
                        )}
                    </div>
                    {quality.total_missing !== undefined && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Total Missing</span>
                            <span className="eda-quality-value">{fmt(quality.total_missing)}</span>
                            {quality.total_missing_ratio !== undefined && (
                                <span className="eda-quality-pct">({(quality.total_missing_ratio * 100).toFixed(2)}%)</span>
                            )}
                        </div>
                    )}
                    {hasConstants && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">Constant Columns</span>
                            <span className="eda-quality-value">{constantColumns.length}</span>
                            <div className="eda-quality-tags">
                                {constantColumns.map((col, i) => (
                                    <span key={i} className="eda-column-tag">{col}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {hasHighCardinality && (
                        <div className="eda-quality-card">
                            <span className="eda-quality-label">High Cardinality</span>
                            <span className="eda-quality-value">{highCardinalityColumns.length}</span>
                            <div className="eda-quality-tags">
                                {highCardinalityColumns.map((col, i) => (
                                    <span key={i} className="eda-column-tag">{col}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Missing Values Table */}
                {missingEntries.length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">Missing Values by Column</h4>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Missing Count</th>
                                        <th>Missing Ratio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {missingEntries.map(([col, val]) => {
                                        const count = val?.null_count ?? 0;
                                        const ratio = val?.null_ratio ?? null;
                                        return (
                                            <tr key={col}>
                                                <td>{col}</td>
                                                <td>{fmt(count)}</td>
                                                <td>{ratio !== null && ratio !== undefined ? `${(ratio * 100).toFixed(2)}%` : 'N/A'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Outliers Table */}
                {outlierEntries.length > 0 && (
                    <div className="eda-quality-table-section">
                        <h4 className="eda-subsection-title">Outliers by Column</h4>
                        <div className="table-wrapper">
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
                                        const count = val?.outlier_count ?? 0;
                                        const ratio = val?.outlier_ratio ?? null;
                                        const lower = val?.lower_bound ?? null;
                                        const upper = val?.upper_bound ?? null;
                                        return (
                                            <tr key={col}>
                                                <td>{col}</td>
                                                <td>{fmt(count)}</td>
                                                <td>{ratio !== null && ratio !== undefined ? `${(ratio * 100).toFixed(2)}%` : 'N/A'}</td>
                                                <td>{lower !== null && lower !== undefined ? (Number.isFinite(lower) ? lower.toLocaleString() : String(lower)) : 'N/A'}</td>
                                                <td>{upper !== null && upper !== undefined ? (Number.isFinite(upper) ? upper.toLocaleString() : String(upper)) : 'N/A'}</td>
                                            </tr>
                                        );
                                    })}
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

