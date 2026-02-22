/**
 * Maps chart specifications from result_json.charts to plottable data
 * by extracting relevant data from the analysis sections.
 */

/**
 * Helper: Format number for display
 */
function fmt(n) {
    if (n === null || n === undefined) return '';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}

/**
 * Normalize univariate to always expose { numeric, categorical, datetime }
 * Supports backends that return either nested {numeric: {...}} or flat {col: {dtype: ...}}
 */
function normalizeUnivariate(univariate) {
    if (!univariate || typeof univariate !== 'object') return { numeric: {}, categorical: {}, datetime: {} };

    // Already in nested form
    if (univariate.numeric || univariate.categorical || univariate.datetime) {
        return {
            numeric: univariate.numeric || {},
            categorical: univariate.categorical || {},
            datetime: univariate.datetime || {},
        };
    }

    const numeric = {};
    const categorical = {};
    const datetime = {};

    Object.entries(univariate).forEach(([col, val]) => {
        if (!val || typeof val !== 'object') return;
        const dtype = (val.dtype || '').toLowerCase();
        if (dtype === 'int' || dtype === 'float' || dtype === 'number' || dtype === 'numeric') {
            numeric[col] = val;
        } else if (dtype === 'datetime' || dtype === 'date' || dtype === 'timestamp') {
            datetime[col] = val;
        } else {
            // default to categorical
            categorical[col] = val;
        }
    });

    return { numeric, categorical, datetime };
}

/**
 * Extract numeric distribution data for histograms
 */
function getHistogramData(resultJson, chartSpec) {
    const col = chartSpec.x_axis;
    if (!col) return [];

    const univariate = normalizeUnivariate(resultJson.univariate || {});
    const numericData = univariate.numeric || {};
    const colData = numericData[col];

    // Format 1: histogram is an array of bins [{bin_start, bin_end, count}]
    if (colData && colData.histogram && Array.isArray(colData.histogram)) {
        const arr = colData.histogram;
        // If there is 'bins' and 'counts' arrays nested inside a histogram object (alternate format)
        if (arr.length === 0 && colData.histogram.bins && Array.isArray(colData.histogram.bins)) {
            // fall through to next handler
        } else {
            return arr
                .filter(bin => (bin.count ?? bin.frequency ?? 0) > 0)
                .map((bin) => ({
                    name: bin.bin_label || `${fmt(bin.bin_start)}-${fmt(bin.bin_end)}`,
                    value: bin.count || bin.frequency || 0,
                }));
        }
    }

    // Format 2: histogram given as { bins: [num], counts: [num] }
    if (colData && colData.histogram && colData.histogram.bins && Array.isArray(colData.histogram.bins) && Array.isArray(colData.histogram.counts)) {
        const bins = colData.histogram.bins;
        const counts = colData.histogram.counts;
        const out = [];
        for (let i = 0; i < counts.length; i++) {
            const start = bins[i] ?? null;
            const end = bins[i + 1] ?? bins[i] ?? null;
            const count = counts[i] ?? 0;
            if (count > 0) out.push({ name: `${fmt(start)}-${fmt(end)}`, value: count });
        }
        if (out.length > 0) return out;
    }

    if (colData && colData.distribution) {
        return Object.entries(colData.distribution).map(([key, val]) => ({
            name: key,
            value: val,
        }));
    }

    return [];
}

/**
 * Extract categorical bar chart data from top_values or value_counts
 */
function getCategoricalData(resultJson, col) {
    const univariate = normalizeUnivariate(resultJson.univariate || {});
    const catData = univariate.categorical || {};
    const colData = catData[col];

    if (!colData) return [];

    // Backend returns top_values: array of {value, count, ratio}
    if (colData.top_values && Array.isArray(colData.top_values)) {
        return colData.top_values.map((item) => ({
            name: item.value,
            value: item.count,
        }));
    }

    // Backend returns top_values as an object mapping value->count
    if (colData.top_values && typeof colData.top_values === 'object') {
        return Object.entries(colData.top_values).map(([value, count]) => ({ name: value, value: count }));
    }

    // Fallback: value_counts object
    if (colData.value_counts && typeof colData.value_counts === 'object') {
        return Object.entries(colData.value_counts).map(([key, val]) => ({
            name: key,
            value: val,
        }));
    }

    return [];
}

/**
 * Extract bar chart data
 */
function getBarData(resultJson, chartSpec) {
    const col = chartSpec.x_axis;
    if (!col) return [];

    // Try categorical first
    const catResult = getCategoricalData(resultJson, col);
    if (catResult.length > 0) return catResult;

    // Fallback: task_metrics class distribution (new schema: {label: {count, ratio}})
    const taskMetrics = resultJson.task_metrics || {};
    if (taskMetrics.class_distribution) {
        return Object.entries(taskMetrics.class_distribution).map(([key, val]) => ({
            name: key,
            value: (val && typeof val === 'object') ? (val.count ?? 0) : (val ?? 0),
        }));
    }

    // Fallback: numeric histogram
    return getHistogramData(resultJson, chartSpec);
}

/**
 * Remove common transform wrappers from axis/column labels, e.g. "Log(Price)" -> "Price"
 */
function unwrapColumnName(col) {
    if (!col || typeof col !== 'string') return col;
    let s = col.trim();
    // remove surrounding backticks or quotes
    s = s.replace(/^['"`]+|['"`]+$/g, '').trim();
    // common transforms like log(...), Log(...), ln(...), sqrt(...), abs(...)
    const m = s.match(/^(?:\s*(?:log|Log|ln|sqrt|abs|exp|log10)\s*\(?\s*)([^)]+)\s*\)?\s*$/);
    if (m && m[1]) return m[1].trim();
    // also handle patterns like "Log Price" or "log Price"
    const m2 = s.match(/^(?:\s*(?:log|Log|ln|sqrt|abs|exp|log10)\s+)(.+)$/);
    if (m2 && m2[1]) return m2[1].trim();
    return s;
}

/**
 * Find an object's key that matches `key` case-insensitively (trimmed). Returns the actual key or null.
 */
function findKey(obj, key) {
    if (!obj || typeof obj !== 'object' || !key) return null;
    const target = String(key).trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(obj, key)) return key; // exact
    const found = Object.keys(obj).find(k => String(k).trim().toLowerCase() === target);
    return found ?? null;
}

/**
 * Extract scatter plot data
 */
function getScatterData(resultJson, chartSpec) {
    let xCol = chartSpec.x_axis;
    let yCol = chartSpec.y_axis;
    // unwrap transformed axis names (e.g., "Log(Price)" -> "Price")
    xCol = unwrapColumnName(xCol);
    yCol = unwrapColumnName(yCol);
    if (!xCol || !yCol) return [];

    const bivariate = resultJson.bivariate || {};

    // Use categorical_numeric array (canonical schema) to approximate scatter if present
    const catNumGroupsArr = bivariate.categorical_numeric || [];

    // Try case-insensitive matching for categorical_numeric entries
    const matchingArr = catNumGroupsArr.find(
        cn => String(cn.categorical_column).trim().toLowerCase() === String(xCol).trim().toLowerCase()
           && String(cn.numeric_column).trim().toLowerCase() === String(yCol).trim().toLowerCase()
    );
    if (matchingArr && matchingArr.group_stats) {
        return matchingArr.group_stats
            .filter(g => g.mean !== null)
            .map(g => ({
                x: g.group,
                y: g.mean,
            }));
    }

    // Check for numeric_pairs / scatter points provided by backend: common schemas
    const numericPairsCandidates = bivariate.numeric_pairs || bivariate.numeric_pairs_xy || bivariate.pairs || bivariate.scatter || [];
    if (Array.isArray(numericPairsCandidates)) {
        const match = numericPairsCandidates.find(p => (
            (String(p.x_col || p.x || p.x_axis || '').trim().toLowerCase() === String(xCol).trim().toLowerCase()
                && String(p.y_col || p.y || p.y_axis || '').trim().toLowerCase() === String(yCol).trim().toLowerCase())
        ));
        if (match && Array.isArray(match.points) && match.points.length > 0) {
            const pts = match.points.map(pt => ({ x: Number(pt.x), y: Number(pt.y) })).filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y));
            if (pts.length > 0) return pts;
        }
    }

    // Build approximate scatter from numeric histograms (bin midpoints)
    const univariate = normalizeUnivariate(resultJson.univariate || {});
    // find actual keys case-insensitively
    const xKey = findKey(univariate.numeric || {}, xCol) || xCol;
    const yKey = findKey(univariate.numeric || {}, yCol) || yCol;
    const xData = univariate.numeric?.[xKey];
    const yData = univariate.numeric?.[yKey];
    if (xData?.histogram && yData?.histogram) {
        const xBins = (Array.isArray(xData.histogram) ? xData.histogram : []).filter(b => (b.count ?? 0) > 0);
        const yBins = (Array.isArray(yData.histogram) ? yData.histogram : []).filter(b => (b.count ?? 0) > 0);
        const len = Math.min(xBins.length, yBins.length, 50);
        const points = [];
        for (let i = 0; i < len; i++) {
            points.push({
                x: (xBins[i].bin_start + xBins[i].bin_end) / 2,
                y: (yBins[i].bin_start + yBins[i].bin_end) / 2,
            });
        }
        if (points.length > 0) return points;
    }

    // Fallback: if both columns provide sample values (array of raw examples), zip them into scatter points
    const xSamples = Array.isArray(xData?.sample_values) ? xData.sample_values : Array.isArray(xData?.values) ? xData.values : Array.isArray(xData?.sample) ? xData.sample : null;
    const ySamples = Array.isArray(yData?.sample_values) ? yData.sample_values : Array.isArray(yData?.values) ? yData.values : Array.isArray(yData?.sample) ? yData.sample : null;
    if (Array.isArray(xSamples) && Array.isArray(ySamples) && xSamples.length > 0 && ySamples.length > 0) {
        const len = Math.min(xSamples.length, ySamples.length, 500);
        const pts = [];
        for (let i = 0; i < len; i++) {
            const xv = Number(xSamples[i]);
            const yv = Number(ySamples[i]);
            if (Number.isFinite(xv) && Number.isFinite(yv)) pts.push({ x: xv, y: yv });
        }
        if (pts.length > 0) return pts;
    }

    return [];
}

/**
 * Extract line chart data (often temporal)
 */
function getLineData(resultJson, chartSpec) {
    const xCol = chartSpec.x_axis;
    const yCol = chartSpec.y_axis;

    const temporal = resultJson.temporal || {};

    // New schema: temporal.time_columns: { <dt_col>: { trends: { <num_col>: [{period, mean, sum, count}] } } }
    // Use nullish coalescing to safely get time_columns or null when absent
    const timeCols = temporal.time_columns ?? null;

    if (timeCols && typeof timeCols === 'object') {
        // If xCol is a datetime column and has trends for yCol
        if (xCol && timeCols[xCol] && timeCols[xCol].trends && yCol && timeCols[xCol].trends[yCol]) {
            const seriesArr = timeCols[xCol].trends[yCol];
            const data = seriesArr.map(pt => ({ name: pt.period || pt.date, value: (pt.mean ?? pt.sum ?? pt.count ?? null) }));
            return { data, series: [] };
        }

        // If yCol is provided, search for any time column that contains trends for yCol
        if (yCol) {
            for (const dtCol of Object.keys(timeCols)) {
                const tc = timeCols[dtCol];
                if (tc && tc.trends && tc.trends[yCol]) {
                    const seriesArr = tc.trends[yCol];
                    const data = seriesArr.map(pt => ({ name: pt.period || pt.date, value: (pt.mean ?? pt.sum ?? pt.count ?? null) }));
                    return { data, series: [] };
                }
            }
        }

        // If xCol is a datetime column with any numeric trend (pick first numeric key)
        if (xCol && timeCols[xCol] && timeCols[xCol].trends) {
            const firstNum = Object.keys(timeCols[xCol].trends)[0];
            if (firstNum) {
                const seriesArr = timeCols[xCol].trends[firstNum];
                const data = seriesArr.map(pt => ({ name: pt.period || pt.date, value: (pt.mean ?? pt.sum ?? pt.count ?? null) }));
                return { data, series: [] };
            }
        }
    }

    // Canonical temporal only; no legacy fallbacks
    return { data: [], series: [] };
}

/**
 * Extract box plot data
 * When both x_axis (categorical) and y_axis (numeric) are present,
 * use bivariate.categorical_numeric group_stats or bivariate.cat_num_groups entries.
 * Otherwise fall back to univariate stats.
 */
function getBoxData(resultJson, chartSpec) {
    const xCol = chartSpec.x_axis;
    let yCol = chartSpec.y_axis;

    // If y_axis is a generic count/frequency label or not provided, treat this as single-column box using x_axis
    const countLike = (v) => !v || ['count', 'counts', 'frequency', 'value', 'values'].includes(String(v).toLowerCase());
    const singleColumnMode = !yCol || countLike(yCol);

    // Box plot with categorical x and numeric y (e.g., "Price by Fuel Type")
    if (!singleColumnMode && xCol && yCol) {
        const bivariate = resultJson.bivariate || {};
        const catNumArr = bivariate.categorical_numeric || [];

        const matching = catNumArr.find(
            cn => cn.categorical_column === xCol && cn.numeric_column === yCol
        );
        if (matching && matching.group_stats) {
            return matching.group_stats
                .filter(g => g.count >= 0)
                .map(g => {
                    // If quartiles are missing, approximate them using median +/- 0.67*std (approx for q1/q3) when possible
                    let q1 = g.q1 ?? null;
                    let q3 = g.q3 ?? null;
                    let min = g.min ?? null;
                    let max = g.max ?? null;
                    if ((q1 === null || q3 === null) && typeof g.median === 'number' && typeof g.std === 'number') {
                        // 0.674*std approximates distance from median to Q1/Q3 for normal-ish
                        const delta = 0.674 * g.std;
                        if (q1 === null) q1 = Math.max((g.median - delta), (g.min ?? Number.NEGATIVE_INFINITY));
                        if (q3 === null) q3 = Math.min((g.median + delta), (g.max ?? Number.POSITIVE_INFINITY));
                    }

                    // If min/max are missing but mean and std exist, approximate min/max as mean +/- 3*std (clamped)
                    if ((min === null || max === null) && typeof g.mean === 'number' && typeof g.std === 'number') {
                        if (min === null) min = Math.max(g.mean - 3 * g.std, min ?? (g.median ?? Number.NEGATIVE_INFINITY));
                        if (max === null) max = Math.min(g.mean + 3 * g.std, max ?? (g.median ?? Number.POSITIVE_INFINITY));
                    }

                    return {
                        name: g.group,
                        mean: g.mean ?? null,
                        median: g.median ?? null,
                        min: min ?? null,
                        q1: q1 ?? null,
                        q3: q3 ?? null,
                        max: max ?? null,
                        count: g.count ?? null,
                    };
                });
        }
    }

    // Fallback / single-column: use xCol when yCol is count-like or missing
    const col = (!singleColumnMode && yCol) ? yCol : xCol;
    if (!col) return [];

    const univariate = normalizeUnivariate(resultJson.univariate || {});
    const numericData = univariate.numeric || {};
    const colData = numericData[col];

    if (colData) {
        // If colData already contains quartiles, return a single-entry boxed object
        if (colData.median !== undefined || colData.q1 !== undefined || colData.q3 !== undefined) {
            return [{
                name: col,
                min: colData.min ?? null,
                q1: colData.q1 ?? colData.q25 ?? null,
                median: colData.median ?? null,
                q3: colData.q3 ?? colData.q75 ?? null,
                max: colData.max ?? null,
                mean: colData.mean ?? null,
                count: colData.count ?? colData.non_null_count ?? null,
            }];
        }

        // If only distribution/histogram available, approximate quartiles from histogram buckets (best-effort)
        if (colData.histogram && Array.isArray(colData.histogram)) {
            const bins = colData.histogram.filter(b => (b.count ?? 0) > 0);
            const total = bins.reduce((s, b) => s + (b.count ?? 0), 0);
            if (total > 0) {
                let cum = 0;
                const quantiles = { q1: null, median: null, q3: null };
                for (let i = 0; i < bins.length; i++) {
                    cum += bins[i].count ?? 0;
                    const frac = cum / total;
                    if (quantiles.q1 === null && frac >= 0.25) quantiles.q1 = (bins[i].bin_start + bins[i].bin_end) / 2;
                    if (quantiles.median === null && frac >= 0.5) quantiles.median = (bins[i].bin_start + bins[i].bin_end) / 2;
                    if (quantiles.q3 === null && frac >= 0.75) { quantiles.q3 = (bins[i].bin_start + bins[i].bin_end) / 2; break; }
                }
                return [{
                    name: col,
                    min: colData.min ?? bins[0]?.bin_start ?? null,
                    q1: quantiles.q1,
                    median: quantiles.median,
                    q3: quantiles.q3,
                    max: colData.max ?? bins[bins.length - 1]?.bin_end ?? null,
                    mean: colData.mean ?? null,
                    count: total,
                }];
            }
        }
    }

    return [];
}

/**
 * Extract heatmap data (correlation matrix)
 */
function getHeatmapData(resultJson) {
    const bivariate = resultJson.bivariate || {};
    const matrix = bivariate.correlation_matrix || {};

    // Support two possible shapes:
    // 1) correlation_matrix: { ColA: { ColA: 1, ColB: 0.3 }, ... }
    // 2) correlation_matrix: [ { x, y, value }, ... ]
    const data = [];
    let columns = [];

    if (Array.isArray(matrix)) {
        // matrix already in flat array form
        matrix.forEach((d) => {
            const x = d.x ?? d.col_x ?? d.column_x ?? null;
            const y = d.y ?? d.col_y ?? d.column_y ?? null;
            const rawVal = d.value ?? d.correlation ?? null;
            const num = Number(rawVal);
            const value = Number.isFinite(num) ? parseFloat(num.toFixed(2)) : 0;
            if (x !== null && y !== null) data.push({ x, y, value });
            if (x && !columns.includes(x)) columns.push(x);
            if (y && !columns.includes(y)) columns.push(y);
        });
    } else if (matrix && typeof matrix === 'object') {
        columns = Object.keys(matrix);
        columns.forEach((row) => {
            columns.forEach((col) => {
                const raw = matrix[row] && matrix[row][col] !== undefined ? matrix[row][col] : null;
                const num = Number(raw);
                const value = Number.isFinite(num) ? parseFloat(num.toFixed(2)) : 0;
                data.push({ x: col, y: row, value });
            });
        });
    }

    return { data, columns };
}

/**
 * Extract pie chart data
 */
function getPieData(resultJson, chartSpec) {
    const col = chartSpec.x_axis || chartSpec.group_by;
    if (!col) {
        const taskMetrics = resultJson.task_metrics || {};
        if (taskMetrics.class_distribution) {
            return Object.entries(taskMetrics.class_distribution).map(([key, val]) => ({
                name: key,
                value: (val && typeof val === 'object') ? (val.count ?? 0) : (val ?? 0),
            }));
        }
        return [];
    }

    return getCategoricalData(resultJson, col);
}

/**
 * Extract area chart data
 */
function getAreaData(resultJson, chartSpec) {
    return getLineData(resultJson, chartSpec);
}

/**
 * Main mapper: given the full result_json and a chart spec,
 * returns { chartType, data, title, description, xAxis, yAxis, columns, groupBy, priority }
 */
function mapChartData(resultJson, chartSpec) {
     const chartType = chartSpec.chart_type;

     let data = [];
     let extra = {};
     let series = [];

     switch (chartType) {
         case 'histogram':
             data = getHistogramData(resultJson, chartSpec);
             break;
         case 'bar':
             data = getBarData(resultJson, chartSpec);
             break;
         case 'scatter':
             data = getScatterData(resultJson, chartSpec);
             break;
         case 'line': {
             const line = getLineData(resultJson, chartSpec);
             data = line.data;
             series = line.series || [];
             break;
         }
         case 'box':
         case 'violin':
             data = getBoxData(resultJson, chartSpec);
             break;
         case 'heatmap':
             extra = getHeatmapData(resultJson);
             data = extra.data || [];
             break;
         case 'pie':
             data = getPieData(resultJson, chartSpec);
             break;
         case 'area':
             data = getAreaData(resultJson, chartSpec);
             break;
         default:
             data = getBarData(resultJson, chartSpec);
     }

     return {
         chartType,
         data,
         columns: extra.columns || [],
         title: chartSpec.title,
         description: chartSpec.description,
         xAxis: chartSpec.x_axis,
         yAxis: chartSpec.y_axis,
         groupBy: chartSpec.group_by,
         priority: chartSpec.priority,
         series,
     };
}

export default mapChartData;

