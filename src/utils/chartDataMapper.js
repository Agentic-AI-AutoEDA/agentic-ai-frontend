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
        return { numeric: univariate.numeric || {}, categorical: univariate.categorical || {}, datetime: univariate.datetime || {} };
    }
    const numeric = {}, categorical = {}, datetime = {};
    Object.entries(univariate).forEach(([col, val]) => {
        if (!val || typeof val !== 'object') return;
        const dtype = (val.dtype || '').toLowerCase();
        if (dtype === 'int' || dtype === 'float' || dtype === 'number' || dtype === 'numeric') numeric[col] = val;
        else if (dtype === 'datetime' || dtype === 'date' || dtype === 'timestamp') datetime[col] = val;
        else categorical[col] = val;
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
    const colData = (univariate.numeric || {})[col];
    if (colData && colData.histogram && Array.isArray(colData.histogram)) {
        const bins = colData.histogram
            .filter(bin => (bin.count ?? bin.frequency ?? 0) > 0)
            .map(bin => ({ name: bin.bin_label || `${fmt(bin.bin_start)}-${fmt(bin.bin_end)}`, value: bin.count || bin.frequency || 0 }));
        if (bins.length > 0) return bins;
    }
    if (colData && colData.histogram && Array.isArray(colData.histogram?.bins)) {
        const { bins, counts } = colData.histogram;
        const out = [];
        for (let i = 0; i < (counts || []).length; i++) {
            if ((counts[i] ?? 0) > 0) out.push({ name: `${fmt(bins[i])}-${fmt(bins[i + 1] ?? bins[i])}`, value: counts[i] });
        }
        if (out.length > 0) return out;
    }

    if (colData && colData.distribution) {
        return Object.entries(colData.distribution).map(([key, val]) => ({ name: key, value: val }));
    }

    return [];
}

/**
 * Extract categorical bar chart data from top_values or value_counts
 */
function getCategoricalData(resultJson, col) {
    const univariate = normalizeUnivariate(resultJson.univariate || {});
    const colData = (univariate.categorical || {})[col];
    if (!colData) return [];
    if (colData.top_values && Array.isArray(colData.top_values))
        return colData.top_values.map(item => ({ name: item.value, value: item.count }));
    if (colData.top_values && typeof colData.top_values === 'object')
        return Object.entries(colData.top_values).map(([value, count]) => ({ name: value, value: count }));
    if (colData.value_counts && typeof colData.value_counts === 'object')
        return Object.entries(colData.value_counts).map(([key, val]) => ({ name: key, value: val }));
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
    const cd = (resultJson.task_metrics || {}).class_distribution;
    if (cd) return Object.entries(cd).map(([key, val]) => ({ name: key, value: (val && typeof val === 'object') ? (val.count ?? 0) : (val ?? 0) }));
    return getHistogramData(resultJson, chartSpec);
}

/**
 * Remove common transform wrappers from axis/column labels, e.g. "Log(Price)" -> "Price"
 */
function unwrapColumnName(col) {
    if (!col || typeof col !== 'string') return col;
    let s = col.trim().replace(/^['"`]+|['"`]+$/g, '').trim();
    const m = s.match(/^\s*(?:log|Log|ln|sqrt|abs|exp|log10)\s*\(?\s*([^)]+)\s*\)?\s*$/);
    if (m && m[1]) return m[1].trim();
    const m2 = s.match(/^\s*(?:log|Log|ln|sqrt|abs|exp|log10)\s+(.+)$/);
    if (m2 && m2[1]) return m2[1].trim();
    return s;
}

/**
 * Find an object's key that matches `key` case-insensitively (trimmed). Returns the actual key or null.
 */
function findKey(obj, key) {
    if (!obj || typeof obj !== 'object' || !key) return null;
    const target = String(key).trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(obj, key)) return key;
    return Object.keys(obj).find(k => String(k).trim().toLowerCase() === target) ?? null;
}

/**
 * Extract scatter plot data
 */
function getScatterData(resultJson, chartSpec) {
    const xCol = unwrapColumnName(chartSpec.x_axis);
    const yCol = unwrapColumnName(chartSpec.y_axis);
    if (!xCol || !yCol) return [];

    const bivariate = resultJson.bivariate || {};
    const matchingArr = (bivariate.categorical_numeric || []).find(
        cn => String(cn.categorical_column).trim().toLowerCase() === String(xCol).trim().toLowerCase()
           && String(cn.numeric_column).trim().toLowerCase() === String(yCol).trim().toLowerCase()
    );
    if (matchingArr?.group_stats) {
        return matchingArr.group_stats.filter(g => g.mean !== null).map(g => ({ x: g.group, y: g.mean }));
    }

    const numericPairs = bivariate.numeric_pairs || bivariate.pairs || bivariate.scatter || [];
    if (Array.isArray(numericPairs)) {
        const match = numericPairs.find(p =>
            String(p.x_col || p.x || '').trim().toLowerCase() === String(xCol).trim().toLowerCase() &&
            String(p.y_col || p.y || '').trim().toLowerCase() === String(yCol).trim().toLowerCase()
        );
        if (match?.points?.length > 0) {
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
            points.push({ x: (xBins[i].bin_start + xBins[i].bin_end) / 2, y: (yBins[i].bin_start + yBins[i].bin_end) / 2 });
        }
        if (points.length > 0) return points;
    }

    const xSamples = xData?.sample_values ?? xData?.values ?? xData?.sample ?? null;
    const ySamples = yData?.sample_values ?? yData?.values ?? yData?.sample ?? null;
    if (Array.isArray(xSamples) && Array.isArray(ySamples)) {
        const len = Math.min(xSamples.length, ySamples.length, 500);
        const pts = [];
        for (let i = 0; i < len; i++) {
            const xv = Number(xSamples[i]), yv = Number(ySamples[i]);
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
    const timeCols = (resultJson.temporal || {}).time_columns ?? null;
    if (timeCols && typeof timeCols === 'object') {
        if (xCol && timeCols[xCol]?.trends && yCol && timeCols[xCol].trends[yCol]) {
            return { data: timeCols[xCol].trends[yCol].map(pt => ({ name: pt.period || pt.date, value: pt.mean ?? pt.sum ?? pt.count ?? null })), series: [] };
        }

        // If yCol is provided, search for any time column that contains trends for yCol
        if (yCol) {
            for (const dtCol of Object.keys(timeCols)) {
                if (timeCols[dtCol]?.trends?.[yCol]) {
                    return { data: timeCols[dtCol].trends[yCol].map(pt => ({ name: pt.period || pt.date, value: pt.mean ?? pt.sum ?? pt.count ?? null })), series: [] };
                }
            }
        }
        if (xCol && timeCols[xCol]?.trends) {
            const firstNum = Object.keys(timeCols[xCol].trends)[0];
            if (firstNum) {
                return { data: timeCols[xCol].trends[firstNum].map(pt => ({ name: pt.period || pt.date, value: pt.mean ?? pt.sum ?? pt.count ?? null })), series: [] };
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
 * Otherwise, fall back to univariate stats.
 */
function getBoxData(resultJson, chartSpec) {
    const xCol = chartSpec.x_axis;
    const yCol = chartSpec.y_axis;
    const countLike = v => !v || ['count','counts','frequency','value','values'].includes(String(v).toLowerCase());
    const singleColumnMode = !yCol || countLike(yCol);

    // Box plot with categorical x and numeric y (e.g., "Price by Fuel Type")
    if (!singleColumnMode && xCol && yCol) {
        const bivariate = resultJson.bivariate || {};
        const matching = (bivariate.categorical_numeric || []).find(cn => cn.categorical_column === xCol && cn.numeric_column === yCol);
        if (matching?.group_stats) {
            return matching.group_stats.filter(g => g.count >= 0).map(g => {
                let q1 = g.q1 ?? null, q3 = g.q3 ?? null, min = g.min ?? null, max = g.max ?? null;
                if ((q1 === null || q3 === null) && typeof g.median === 'number' && typeof g.std === 'number') {
                    const delta = 0.674 * g.std;
                    if (q1 === null) q1 = Math.max(g.median - delta, g.min ?? Number.NEGATIVE_INFINITY);
                    if (q3 === null) q3 = Math.min(g.median + delta, g.max ?? Number.POSITIVE_INFINITY);
                }
                if (min === null && typeof g.mean === 'number' && typeof g.std === 'number') min = g.mean - 3 * g.std;
                if (max === null && typeof g.mean === 'number' && typeof g.std === 'number') max = g.mean + 3 * g.std;
                return { name: g.group, mean: g.mean ?? null, median: g.median ?? null, min, q1, q3, max, count: g.count ?? null };
            });
        }
    }

    // Fallback / single-column: use xCol when yCol is count-like or missing
    const col = (!singleColumnMode && yCol) ? yCol : xCol;
    if (!col) return [];

    const univariate = normalizeUnivariate(resultJson.univariate || {});
    const colData = (univariate.numeric || {})[col];
    if (colData) {
        // If colData already contains quartiles, return a single-entry boxed object
        if (colData.median !== undefined || colData.q1 !== undefined || colData.q3 !== undefined) {
            return [{ name: col, min: colData.min ?? null, q1: colData.q1 ?? colData.q25 ?? null, median: colData.median ?? null, q3: colData.q3 ?? colData.q75 ?? null, max: colData.max ?? null, mean: colData.mean ?? null, count: colData.count ?? colData.non_null_count ?? null }];
        }

        // If only distribution/histogram available, approximate quartiles from histogram buckets (best-effort)
        if (colData.histogram && Array.isArray(colData.histogram)) {
            const bins = colData.histogram.filter(b => (b.count ?? 0) > 0);
            const total = bins.reduce((s, b) => s + (b.count ?? 0), 0);
            if (total > 0) {
                let cum = 0;
                const q = { q1: null, median: null, q3: null };
                for (let i = 0; i < bins.length; i++) {
                    cum += bins[i].count ?? 0;
                    const frac = cum / total;
                    if (q.q1 === null && frac >= 0.25) q.q1 = (bins[i].bin_start + bins[i].bin_end) / 2;
                    if (q.median === null && frac >= 0.5) q.median = (bins[i].bin_start + bins[i].bin_end) / 2;
                    if (q.q3 === null && frac >= 0.75) { q.q3 = (bins[i].bin_start + bins[i].bin_end) / 2; break; }
                }
                return [{ name: col, min: colData.min ?? bins[0]?.bin_start ?? null, q1: q.q1, median: q.median, q3: q.q3, max: colData.max ?? bins[bins.length - 1]?.bin_end ?? null, mean: colData.mean ?? null, count: total }];
            }
        }
    }

    return [];
}

/**
 * Extract heatmap data (correlation matrix)
 */
function getHeatmapData(resultJson) {
    const matrix = (resultJson.bivariate || {}).correlation_matrix || {};
    const data = [];
    let columns = [];

    if (Array.isArray(matrix)) {
        matrix.forEach(d => {
            const x = d.x ?? d.col_x ?? d.column_x ?? null;
            const y = d.y ?? d.col_y ?? d.column_y ?? null;
            const raw = d.value ?? d.correlation ?? null;
            const value = Number.isFinite(Number(raw)) ? parseFloat(Number(raw).toFixed(2)) : 0;
            if (x !== null && y !== null) data.push({ x, y, value });
            if (x && !columns.includes(x)) columns.push(x);
            if (y && !columns.includes(y)) columns.push(y);
        });
    } else if (matrix && typeof matrix === 'object') {
        columns = Object.keys(matrix);
        columns.forEach(row => columns.forEach(col => {
            const raw = matrix[row]?.[col] ?? null;
            data.push({ x: col, y: row, value: Number.isFinite(Number(raw)) ? parseFloat(Number(raw).toFixed(2)) : 0 });
        }));
    }

    return { data, columns };
}

/**
 * Extract pie chart data
 */
function getPieData(resultJson, chartSpec) {
    const col = chartSpec.x_axis || chartSpec.group_by;
    if (!col) {
        const cd = (resultJson.task_metrics || {}).class_distribution;
        if (cd) return Object.entries(cd).map(([key, val]) => ({ name: key, value: (val && typeof val === 'object') ? (val.count ?? 0) : (val ?? 0) }));
        return [];
    }

    return getCategoricalData(resultJson, col);
}

/**
 * Extract Density chart data
 */
function getDensityData(resultJson, chartSpec) {
    const bins = getHistogramData(resultJson, chartSpec);
    if (bins.length === 0) return [];
    const total = bins.reduce((s, b) => s + b.value, 0);
    return bins.map(b => ({ name: b.name, value: total > 0 ? +(b.value / total).toFixed(4) : 0 }));
}

/**
 * ECDF chart data
 */
function getEcdfData(resultJson, chartSpec) {
    const bins = getHistogramData(resultJson, chartSpec);
    if (bins.length === 0) return [];
    const total = bins.reduce((s, b) => s + b.value, 0);
    let cum = 0;
    return bins.map(b => { cum += b.value; return { name: b.name, value: total > 0 ? +(cum / total).toFixed(4) : 0 }; });
}

/**
 * QQ plot data
 */
function getQQData(resultJson, chartSpec) {
    const col = chartSpec.x_axis;
    if (!col) return [];
    const univariate = normalizeUnivariate(resultJson.univariate || {});
    const colData = univariate.numeric?.[col];
    if (!colData?.histogram) return [];
    const bins = Array.isArray(colData.histogram) ? colData.histogram.filter(b => (b.count ?? 0) > 0) : [];
    const total = bins.reduce((s, b) => s + b.count, 0);
    if (total === 0) return [];
    const points = [];
    let cum = 0;
    for (let i = 0; i < Math.min(bins.length, 50); i++) {
        cum += bins[i].count;
        const p = Math.max(0.001, Math.min(0.999, (cum - 0.5) / total));
        const theoretical = (() => {
            const a = [2.515517, 0.802853, 0.010328], b = [1.432788, 0.189269, 0.001308];
            const t = p < 0.5 ? Math.sqrt(-2 * Math.log(p)) : Math.sqrt(-2 * Math.log(1 - p));
            const num = a[0] + a[1]*t + a[2]*t*t, den = 1 + b[0]*t + b[1]*t*t + b[2]*t*t*t;
            return p < 0.5 ? -(t - num/den) : (t - num/den);
        })();
        points.push({ x: +theoretical.toFixed(3), y: +((bins[i].bin_start + bins[i].bin_end) / 2).toFixed(3) });
    }
    return points;
}

/**
 * Bubble chart data
 */
function getBubbleData(resultJson, chartSpec) {
    return getScatterData(resultJson, chartSpec).map(pt => ({ ...pt, z: 1 }));
}

/**
 * Correlation bar chart data
 */
function getCorrelationBarData(resultJson, chartSpec) {
    const corrs = (resultJson.task_metrics || {}).feature_target_correlations;
    if (corrs && typeof corrs === 'object') {
        return Object.entries(corrs)
            .map(([col, val]) => ({ name: col, value: typeof val === 'number' ? +Math.abs(val).toFixed(4) : 0 }))
            .sort((a, b) => b.value - a.value);
    }
    return getBarData(resultJson, chartSpec);
}

/**
 * Missingness chart data
 */
function getMissingnessData(resultJson) {
    const univariate = normalizeUnivariate(resultJson.univariate || {});
    const all = { ...univariate.numeric, ...univariate.categorical, ...univariate.datetime };
    return Object.entries(all)
        .map(([col, d]) => ({ name: col, value: +(d.null_ratio ?? d.missing_ratio ?? 0) * 100 }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 30);
}

/**
 * Main mapper: given the full result_json and a chart spec,
 * returns { chartType, data, title, description, xAxis, yAxis, columns, groupBy, priority, series, isPairPlot }
 */
function mapChartData(resultJson, chartSpec) {
    const chartType = chartSpec.chart_type;
    let data = [];
    let extra = {};
    let series = [];

    switch (chartType) {
        case 'histogram':       data = getHistogramData(resultJson, chartSpec); break;
        case 'density':         data = getDensityData(resultJson, chartSpec); break;
        case 'ecdf':            data = getEcdfData(resultJson, chartSpec); break;
        case 'qq':              data = getQQData(resultJson, chartSpec); break;
        case 'bar':
        case 'treemap':         data = getBarData(resultJson, chartSpec); break;
        case 'correlation_bar': data = getCorrelationBarData(resultJson, chartSpec); break;
        case 'missingness':     data = getMissingnessData(resultJson); break;
        case 'scatter':
        case 'strip':           data = getScatterData(resultJson, chartSpec); break;
        case 'bubble':          data = getBubbleData(resultJson, chartSpec); break;
        case 'line': {
            const line = getLineData(resultJson, chartSpec);
            data = line.data; series = line.series || [];
            break;
        }
        case 'area': {
            const area = getLineData(resultJson, chartSpec);
            data = area.data; series = area.series || [];
            break;
        }
        case 'box':
        case 'violin':          data = getBoxData(resultJson, chartSpec); break;
        case 'heatmap':
            extra = getHeatmapData(resultJson);
            data = extra.data || [];
            break;
        case 'pie':             data = getPieData(resultJson, chartSpec); break;
        case 'pair':
            data = [];
            extra = { isPairPlot: true };
            break;
        default:                data = getBarData(resultJson, chartSpec);
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
        isPairPlot: extra.isPairPlot || false,
    };
}

export default mapChartData;

