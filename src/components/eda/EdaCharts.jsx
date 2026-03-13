import React, { useRef, useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, LineChart, Line, PieChart, Pie,
    AreaChart, Area,
    Legend,
} from 'recharts';
import mapChartData from '../../utils/chartDataMapper';

const COLORS = [
    '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
    '#34d399', '#60a5fa', '#f472b6', '#fbbf24',
    '#fb923c', '#f87171', '#2dd4bf', '#818cf8',
];

// SVG box plot renderer
const BoxPlotRenderer = ({ data }) => {
    const containerRef = useRef(null);
    const [hover, setHover] = useState({ index: null, x: 0, y: 0, content: '' });
    const [dims, setDims] = useState({ width: 800, height: 320 });

    useEffect(() => {
        function measure() {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            setDims({ width: Math.max(320, rect.width), height: Math.max(260, rect.height) });
        }
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    if (!data || data.length === 0) return <div className="eda-chart-empty">No data for box plot</div>;

    // collect numeric values
    const vals = data.flatMap(d => [d.min, d.q1, d.median, d.q3, d.max].filter(v => typeof v === 'number'));
    if (vals.length === 0) return <div className="eda-chart-empty">No numeric stats available</div>;

    const gMin = Math.min(...vals);
    const gMax = Math.max(...vals);
    const padding = 60; // left/right padding in viewBox units
    const topPad = 20;
    const bottomPad = 70;

    const viewW = Math.max(800, dims.width);
    const viewH = Math.max(260, dims.height);
    const plotW = viewW - padding * 2;
    const plotH = viewH - topPad - bottomPad;

    const xStep = plotW / Math.max(1, data.length);
    const boxWidth = Math.min(120, xStep * 0.6);

    const yFor = (v) => {
        if (v === null || v === undefined || isNaN(v)) return null;
        if (gMax === gMin) return topPad + plotH / 2; // flat
        const frac = (v - gMin) / (gMax - gMin);
        return topPad + (1 - frac) * plotH;
    };

    const handleMouse = (e, i, d) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const lines = [];
        if (d.name !== undefined) lines.push(String(d.name));
        if (d.count !== undefined) lines.push(`Count: ${d.count}`);
        if (d.mean !== undefined) lines.push(`Mean: ${d.mean}`);
        if (d.median !== undefined) lines.push(`Median: ${d.median}`);
        if (d.q1 !== undefined && d.q3 !== undefined) lines.push(`Q1–Q3: ${d.q1} – ${d.q3}`);
        if (d.min !== undefined && d.max !== undefined) lines.push(`Min–Max: ${d.min} – ${d.max}`);
        setHover({ index: i, x, y, content: lines.join('\n') });
    };

    const clearHover = () => setHover({ index: null, x: 0, y: 0, content: '' });

    return (
        <div ref={containerRef} className="eda-boxplot-container">
            <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                {/* Y axis grid and labels */}
                {Array.from({ length: 5 }).map((_, i) => {
                    const tv = gMin + (i / 4) * (gMax - gMin);
                    const y = yFor(tv);
                    return (
                        <g key={i}>
                            <line x1={padding - 10} x2={viewW - padding + 10} y1={y} y2={y} className="boxplot-grid" />
                            <text x={12} y={y + 4} className="boxplot-grid-label">{Number.isFinite(tv) ? tv.toLocaleString() : ''}</text>
                        </g>
                    );
                })}

                {/* Boxes and whiskers */}
                {data.map((d, i) => {
                    const cx = padding + xStep * (i + 0.5);
                    const minY = yFor(d.min);
                    const q1Y = yFor(d.q1);
                    const medianY = yFor(d.median);
                    const q3Y = yFor(d.q3);
                    const maxY = yFor(d.max);

                    const boxLeft = cx - boxWidth / 2;
                    const boxRight = cx + boxWidth / 2;

                    const isHover = hover.index === i;

                    // compute mean y
                    const meanY = (typeof d.mean === 'number') ? yFor(d.mean) : null;

                    return (
                        <g key={i}
                           onMouseMove={(e) => handleMouse(e, i, d)}
                           onMouseLeave={clearHover}
                           className={`eda-boxplot-group ${isHover ? 'hover' : ''}`}>

                            {/* whisker line */}
                            {minY !== null && maxY !== null && (
                                <line x1={cx} x2={cx} y1={minY} y2={maxY} className="boxplot-whisker" />
                            )}

                            {/* whisker caps */}
                            {minY !== null && (
                                <line x1={cx - boxWidth / 6} x2={cx + boxWidth / 6} y1={minY} y2={minY} className="boxplot-whisker-cap" />
                            )}
                            {maxY !== null && (
                                <line x1={cx - boxWidth / 6} x2={cx + boxWidth / 6} y1={maxY} y2={maxY} className="boxplot-whisker-cap" />
                            )}

                            {/* IQR box */}
                            {q1Y !== null && q3Y !== null && (
                                <rect x={boxLeft} y={Math.min(q1Y, q3Y)} width={boxWidth} height={Math.max(1, Math.abs(q3Y - q1Y))} rx={6} ry={6}
                                      className="boxplot-iqr" />
                            )}

                            {/* median line */}
                            {medianY !== null && (
                                <line x1={boxLeft} x2={boxRight} y1={medianY} y2={medianY} className="boxplot-median" />
                            )}

                            {/* mean dot (green) */}
                            {meanY !== null && (
                                <circle cx={cx} cy={meanY} r={isHover ? 5 : 4} className="boxplot-mean" />
                            )}

                            {/* outliers as small red dots if provided */}
                            {Array.isArray(d.outliers) && d.outliers.map((ov, oi) => {
                                const oy = yFor(ov);
                                if (oy === null) return null;
                                // jitter x slightly to avoid overlap
                                const jitter = ((oi % 5) - 2) * (boxWidth / 18);
                                return <circle key={oi} cx={cx + jitter} cy={oy} r={isHover ? 4 : 3} className="boxplot-outlier" />;
                            })}

                            {/* x label */}
                            <text x={cx} y={viewH - 18} className="boxplot-xlabel">{String(d.name)}</text>
                        </g>
                    );
                })}

            </svg>

            {/* HTML tooltip overlay */}
            {hover.index !== null && (
                <div className={`eda-boxplot-tooltip visible`}>
                    <pre className="eda-pre eda-boxplot-tooltip-pre">{hover.content}</pre>
                </div>
            )}
        </div>
    );
};

const ChartRenderer = ({ mapped }) => {
    // Defensive defaults for mapped object to avoid crashes when mapper returns unexpected shapes
    const safe = mapped && typeof mapped === 'object' ? mapped : {};
    const { chartType = 'bar', data = [], description = '', xAxis, yAxis, columns = [], series = [], isPairPlot = false } = safe;

    // pair plot — no single chart possible
    if (isPairPlot) {
        return (
            <div className="eda-chart-empty">
                <p>Pair plot requires a grid of scatter plots.</p>
                <p className="eda-chart-unsupported-msg">This chart type is not supported in the inline renderer.</p>
            </div>
        );
    }

    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="eda-chart-empty">
                <p>No data available for this chart</p>
                {description && <p className="eda-chart-desc">{description}</p>}
            </div>
        );
    }

    const commonProps = { width: '100%', height: 300 };
    const gridStroke = 'rgba(255,255,255,0.1)';

    switch (chartType) {

        // Bar / Histogram / Treemap / Missingness / Correlation Bar
        case 'histogram':
        case 'bar':
        case 'treemap':
        case 'missingness':
        case 'correlation_bar':
            return (
                <ResponsiveContainer {...commonProps}>
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS[0]} radius={[3,3,0,0]} />
                    </BarChart>
                </ResponsiveContainer>
            );

        // Density / ECDF
        case 'density':
        case 'ecdf':
            return (
                <ResponsiveContainer {...commonProps}>
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                        <YAxis domain={chartType === 'ecdf' ? [0, 1] : ['auto', 'auto']} tickFormatter={v => chartType === 'ecdf' ? `${(v*100).toFixed(0)}%` : v} />
                        <Tooltip formatter={v => chartType === 'ecdf' ? `${(v*100).toFixed(1)}%` : v} />
                        <Area type="monotone" dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            );

        // QQ / Scatter / Strip / Bubble
        case 'qq':
        case 'scatter':
        case 'strip':
        case 'bubble': {
            return (
                <ResponsiveContainer {...commonProps}>
                    <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="x" name={chartType === 'qq' ? 'Theoretical' : (xAxis || 'X')} type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="y" name={chartType === 'qq' ? 'Sample' : (yAxis || 'Y')} tick={{ fontSize: 11 }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        {chartType === 'qq' && (() => {
                            const xs = data.map(d => d.x).filter(Number.isFinite);
                            const ys = data.map(d => d.y).filter(Number.isFinite);
                            if (xs.length < 2) return null;
                            const refData = [{ x: Math.min(...xs), y: Math.min(...ys) }, { x: Math.max(...xs), y: Math.max(...ys) }];
                            return <Scatter data={refData} fill="rgba(255,255,255,0.2)" line={{ stroke: '#a5b4fc', strokeDasharray: '4 4' }} shape={() => null} />;
                        })()}
                        <Scatter data={data} fill={COLORS[1]} fillOpacity={0.75} />
                    </ScatterChart>
                </ResponsiveContainer>
            );
        }

        // Line
        case 'line': {
            const lineSeries = Array.isArray(series) && series.length > 0 ? series : ['value'];
            return (
                <ResponsiveContainer {...commonProps}>
                    <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {lineSeries.map((s, idx) => (
                            <Line key={s} type="monotone" dataKey={s} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        // Area
        case 'area': {
            const areaSeries = Array.isArray(series) && series.length > 0 ? series : ['value'];
            return (
                <ResponsiveContainer {...commonProps}>
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {areaSeries.map((s, idx) => (
                            <Area key={s} type="monotone" dataKey={s} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.15} dot={false} />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            );
        }

        // Pie
        case 'pie': {
            const pieData = data.map((d, idx) => ({ ...d, fill: COLORS[idx % COLORS.length] }));
            return (
                <ResponsiveContainer {...commonProps}>
                    <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} />
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );
        }

        // Box / Violin
        case 'box':
        case 'violin':
            if (data.length > 0 && (data[0].q1 !== undefined || data[0].median !== undefined)) {
                return <div className="eda-boxplot-wrapper"><BoxPlotRenderer data={data} /></div>;
            }

            // Fallback to bar/table rendering when structured stats are not available
            return (
                <ResponsiveContainer {...commonProps}>
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS[2]} radius={[3,3,0,0]} />
                    </BarChart>
                </ResponsiveContainer>
            );

        // Heatmap
        case 'heatmap':
            return <HeatmapGrid data={data} columns={columns} />;

        // Default fallback
        default:
            return (
                <ResponsiveContainer {...commonProps}>
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS[0]} radius={[3,3,0,0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
    }
};

const HeatmapGrid = ({ data, columns }) => {
    if (!data || data.length === 0 || !columns || columns.length === 0) {
        return <p className="eda-chart-empty">No correlation data available</p>;
    }

    const lookup = {};
    data.forEach(d => {
        if (!lookup[d.y]) lookup[d.y] = {};
        lookup[d.y][d.x] = d.value;
    });

    const getHeatmapClass = (value) => {
        if (value >= 0.7) return 'very-high';
        if (value >= 0.4) return 'high';
        if (value >= 0.1) return 'moderate';
        if (value >= -0.1) return 'neutral';
        if (value >= -0.4) return 'low';
        if (value >= -0.7) return 'very-low';
        return 'extreme-low';
    };

    const LEGEND_STEPS = [
        { key: 'very-high', label: '≥ 0.7', title: 'Strong positive' },
        { key: 'high', label: '0.4 – 0.69', title: 'Positive' },
        { key: 'moderate', label: '0.1 – 0.39', title: 'Light positive' },
        { key: 'neutral', label: '-0.1 – 0.09', title: 'Near zero' },
        { key: 'low', label: '-0.39 – -0.11', title: 'Light negative' },
        { key: 'very-low', label: '-0.69 – -0.40', title: 'Negative' },
        { key: 'extreme-low', label: '< -0.7', title: 'Strong negative' },
    ];

    return (
        <div className="eda-heatmap-wrapper">
             {/* Heatmap legend - discrete swatches (analyst-friendly) */}
             <div className={`eda-heatmap-legend`} role="list" aria-label="Correlation color legend">
                {LEGEND_STEPS.map(step => (
                    <div key={step.key} className="eda-heatmap-legend-item" role="listitem" title={step.title}>
                        <div className={`swatch ${step.key}`} aria-hidden="true"></div>
                        <div className="legend-label">{step.label}</div>
                    </div>
                ))}
            </div>
             <div className="eda-heatmap-scroll">
                 <table className="eda-heatmap">
                     <thead>
                         <tr>
                             <th></th>
                             {columns.map(col => (
                                 <th key={col} title={col}>{col.length > 10 ? col.slice(0, 10) + '...' : col}</th>
                             ))}
                         </tr>
                     </thead>
                     <tbody>
                         {columns.map(row => (
                             <tr key={row}>
                                 <td className="eda-heatmap-label" title={row}>{row.length > 10 ? row.slice(0, 10) + '...' : row}</td>
                                 {columns.map(col => {
                                     const rawVal = lookup[row]?.[col];
                                     const val = (typeof rawVal === 'number' && Number.isFinite(rawVal)) ? rawVal : (rawVal ? Number(rawVal) : 0);
                                     const cls = `heatmap-${getHeatmapClass(val ?? 0)}`;
                                     return (
                                         <td key={col} className={cls} title={`${row} x ${col}: ${val ?? '-'}`}>
                                             {val !== undefined ? val : '-'}
                                         </td>
                                     );
                                 })}
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         </div>
     );
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const EdaCharts = ({ charts, analysisDetails, summary, dataQuality }) => {
    // Build mapper context from own props — no cross-component data passing needed
    const ad = analysisDetails || {};
    const mapperContext = {
        univariate:   ad.univariate   || {},
        bivariate:    ad.bivariate    || {},
        temporal:     ad.temporal     || {},
        task_metrics: summary?.task?.task_metrics || {},
        data_quality: dataQuality || {},
    };

    // Normalize charts to an array and filter out falsy/malformed entries before sorting/mapping
    const safeCharts = Array.isArray(charts) ? charts.filter(Boolean) : [];

    if (safeCharts.length === 0) {
        return (
            <div className="eda-section eda-charts">
                <h3 className="eda-section-title">Charts</h3>
                <p className="eda-empty-msg">No chart specifications generated for this analysis.</p>
            </div>
        );
    }

    const sorted = [...safeCharts].sort((a, b) =>
        (PRIORITY_ORDER[a?.priority] ?? 1) - (PRIORITY_ORDER[b?.priority] ?? 1)
    );

    return (
        <div className="eda-section eda-charts">
            <h3 className="eda-section-title">Charts ({safeCharts.length})</h3>
            <div className="eda-charts-grid">
                {sorted.map((chartSpec, idx) => {
                    const mapped = (() => {
                        try { return mapChartData(mapperContext, chartSpec || {}); } catch (e) { console.warn('mapChartData error', e); return { chartType: chartSpec?.chart_type || 'bar', data: [], columns: [] }; }
                    })();
                    const cardKey = chartSpec?.id ?? chartSpec?.title ?? `chart-${idx}`;
                    return (
                        <div key={cardKey} className={`eda-chart-card priority-${chartSpec?.priority || 'medium'}`}>
                            <div className="eda-chart-header">
                                <h4>{chartSpec?.title || 'Chart'}</h4>
                                <div className="eda-chart-header-actions">
                                    {chartSpec?.id && (
                                        <span className="eda-column-tag eda-column-tag-meta">{chartSpec.id}</span>
                                    )}
                                    <span className={`eda-priority-badge priority-${chartSpec?.priority || 'medium'}`}>
                                        {chartSpec?.priority || 'medium'}
                                    </span>
                                </div>
                            </div>
                            {chartSpec?.description && (
                                <p className="eda-chart-desc">{chartSpec.description}</p>
                            )}
                            <div className="eda-chart-body">
                                <ChartRenderer mapped={mapped} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EdaCharts;
