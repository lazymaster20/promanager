// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../utils/api';
import { fmtCurrency, progressColor, STATUS_CONFIG } from '../utils/constants';
import { LoadingScreen, ErrorMessage, StatusBadge, PageHeader } from '../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LabelList, CartesianGrid
} from 'recharts';

const CHART_COLORS = { ongoing:'#6366f1', planned:'#8b5cf6', completed:'#10b981', site_not_ready:'#f59e0b' };

function CustomLabel({ x, y, width, value }) {
  if (!value) return null;
  const display = value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(0)}K` : value;
  return (
    <text x={x + width / 2} y={y - 6} fill="#94a3b8" textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono">
      {display}
    </text>
  );
}

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const navigate              = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await projectsApi.getDashboard();
      setData(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  const { stats, recent, statusBreakdown,monthlyInvoice, monthWiseInvoice } = data;

  const statCards = [
    {
      label: 'Total Order Value',
      value: fmtCurrency(stats.total_order_value),
      icon: '💰',
      sub: `${stats.total_projects} total projects`,
      color: 'indigo',
    },
    // {
    //   label: 'Total Budget',
    //   value: fmtCurrency(stats.total_budget),
    //   icon: '📊',
    //   sub: 'Planned cost across all projects',
    //   color: 'violet',
    // },
    {
      label: 'Invoice thismonth',
      value: fmtCurrency(monthlyInvoice?.planned_invoice_this_month || 0),
      icon: '📊',
      sub: 'Expected invoicing for the current month',
      color: 'violet',
    },
    {
      // Changed: now shows invoiced total not generic sales
      label: 'Total Invoiced',
      value: fmtCurrency(stats.total_invoiced_value),
      icon: '🧾',
      sub: `${stats.invoiced_count || 0} invoiced projects`,
      color: 'teal',
      highlight: true,
    },
    {
      label: 'Active Projects',
      value: stats.ongoing_count || 0,
      icon: '⚡',
      sub: `${stats.planned_count || 0} planned · ${stats.completed_count || 0} completed`,
      color: 'blue',
    },
  ];

  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
    teal:   'from-teal-500/20 to-teal-500/5 border-teal-500/30',
    blue:   'from-blue-500/20 to-blue-500/5 border-blue-500/20',
  };
  const iconBg = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    violet: 'bg-violet-500/20 text-violet-400',
    teal:   'bg-teal-500/20 text-teal-400',
    blue:   'bg-blue-500/20 text-blue-400',
  };

  // Chart data — only ongoing, planned, completed, site_not_ready
  const chartData = statusBreakdown.map(r => ({
    name:  STATUS_CONFIG[r.status]?.label || r.status,
    count: Number(r.count),
    value: Number(r.value),
    color: CHART_COLORS[r.status] || '#6366f1',
  }));

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Overview of all project performance">
        <button className="btn-primary" onClick={() => navigate('/projects')}>+ New Project</button>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <div key={card.label} className={`card p-5 bg-gradient-to-br border ${colorMap[card.color]} ${card.highlight ? 'ring-1 ring-teal-500/30' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${iconBg[card.color]}`}>{card.icon}</span>
            </div>
            <div className="font-display font-bold text-2xl text-white mb-1">{card.value}</div>
            <div className="text-xs text-slate-500">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Month Wise Invoice Value */}

<div className="card p-5 my-5">
  <div className="flex items-center justify-between mb-1">
    <h2 className="font-display font-bold text-base text-white">
      Month Wise Invoice Value
    </h2>
    <span className="text-xs text-slate-500 font-mono">
    {monthWiseInvoice?.length || 0} months
    </span>
  </div>
  <p className="text-xs text-slate-500 mb-4">
    Total invoiced value per month
  </p>

  {monthWiseInvoice?.length > 0 ? (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={monthWiseInvoice}
        barCategoryGap="35%"
        margin={{ top: 25, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="month_label"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v =>
            v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` :
            v >= 1000    ? `${(v / 1000).toFixed(0)}K`    : v
          }
        />
        <Tooltip
          formatter={(val) => [`QAR ${Number(val).toLocaleString()}`, 'Invoice Value']}
          contentStyle={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            fontSize: 11
          }}
          labelStyle={{ color: '#e2e8f0' }}
          itemStyle={{ color: '#94a3b8' }}
          cursor={{ fill: 'rgba(99,102,241,0.08)' }}
        />
        <Bar dataKey="total_value" radius={[6, 6, 0, 0]} fill="#10b981">
          <LabelList
            dataKey="total_value"
            position="top"
            formatter={v =>
              v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` :
              v >= 1000    ? `${(v / 1000).toFixed(0)}K`    : v
            }
            style={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex flex-col items-center justify-center h-40 text-center">
      <div className="text-3xl mb-2 opacity-30">🧾</div>
      <p className="text-slate-600 text-sm">No invoiced projects yet</p>
      <p className="text-slate-700 text-xs mt-1">
        Mark projects as invoiced to see data here
      </p>
    </div>
  )}

  {/* Month summary row below chart */}
  {monthWiseInvoice?.length > 0 && (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800 pt-4">
      {monthWiseInvoice.map((m, i) => (
        <div key={i} className="text-center p-2 bg-slate-800/50 rounded-xl">
          <p className="text-xs text-slate-500 mb-1">{m.month_label}</p>
          <p className="text-sm font-bold font-mono text-emerald-400">
            {Number(m.total_value) >= 1000000
              ? `QAR ${(m.total_value / 1000000).toFixed(2)}M`
              : `QAR ${Number(m.total_value).toLocaleString()}`
            }
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            {m.project_count} project{m.project_count > 1 ? 's' : ''}
          </p>
        </div>
      ))}
    </div>
  )}
</div>     



      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent Projects */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base text-white">Active Projects</h2>
            <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium" onClick={() => navigate('/projects')}>View all →</button>
          </div>
          <div className="space-y-2">
            {recent.map(proj => (
              <div
                key={proj.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group"
                onClick={() => navigate(`/projects/${proj.id}`)}
              >
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{proj.project_name}</p>
                    <StatusBadge status={proj.status}/>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="progress-bar flex-1">
                      <div className={`progress-fill ${progressColor(proj.progress)}`} style={{ width:`${proj.progress}%` }}/>
                    </div>
                    <span className="text-xs text-slate-500 font-mono w-8 text-right">{proj.progress}%</span>
                  </div>
                  {proj.sales_person && <p className="text-xs text-slate-600 mt-0.5">Sales: {proj.sales_person}</p>}
                </div>
                <div className="text-right hidden sm:block flex-shrink-0">
                  <div className="text-sm font-semibold text-white font-mono">{fmtCurrency(proj.order_value)}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[120px]">{proj.customer_name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Chart with value data labels */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-base text-white mb-1">Projects by Status</h2>
          <p className="text-xs text-slate-500 mb-4">Order value with data labels</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill:'#64748b', fontSize:9 }}
                  axisLine={false} tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(val) => [`QAR ${Number(val).toLocaleString()}`, 'Order Value']}
                  contentStyle={{ backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius:'12px', fontSize:11 }}
                  labelStyle={{ color:'#e2e8f0' }}
                  itemStyle={{ color:'#94a3b8' }}
                />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  <LabelList dataKey="value" content={<CustomLabel />}/>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No data</div>
          )}

          {/* Legend */}
          <div className="mt-2 space-y-1.5">
            {chartData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}/>
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-300 font-medium">{item.count}</span>
                  <span className="text-slate-600 ml-2 font-mono text-xs">{fmtCurrency(item.value)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Invoiced profit summary */}
          {stats.total_invoiced_profit > 0 && (
            <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
              <p className="text-xs text-teal-400 font-bold mb-1">Invoiced Profit</p>
              <p className="text-sm font-bold text-teal-300 font-mono">{fmtCurrency(stats.total_invoiced_profit)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
