import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import TableViewer from './TableViewer';
import { logout } from './api';

const TABS = ['tyres', 'vehicles', 'companies', 'depots', 'users'];
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Dashboard view options
const DASHBOARD_VIEWS = {
  clean: 'Clean & Focused',
  analytics: 'Data Analytics',
  detailed: 'Detailed Overview'
};

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getPeriodRange(referenceDate, period) {
  const ref = new Date(referenceDate);
  if (period === 'day') {
    return [startOfDay(ref), endOfDay(ref)];
  }
  if (period === 'week') {
    // Week starting Sunday -> Saturday
    const day = ref.getDay(); // 0 = Sunday
    const sunday = new Date(ref);
    sunday.setDate(ref.getDate() - day);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return [startOfDay(sunday), endOfDay(saturday)];
  }
  if (period === 'month') {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return [startOfDay(start), endOfDay(end)];
  }
  if (period === 'year') {
    const start = new Date(ref.getFullYear(), 0, 1);
    const end = new Date(ref.getFullYear(), 11, 31);
    return [startOfDay(start), endOfDay(end)];
  }
  return [startOfDay(ref), endOfDay(ref)];
}

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState(TABS[0]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortKey, setSortKey] = useState('report_date');
  const [sortDir, setSortDir] = useState('desc');
  const [dashboardView, setDashboardView] = useState('clean');
  const [stats, setStats] = useState({ tyres_today: 0, total_vehicles: 0 });

  useEffect(() => {
    fetchInspections();
    fetchStats();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/inspections`, { withCredentials: true });
      setInspections(res.data || []);
    } catch (err) {
      console.error('Failed to fetch inspections for dashboard', err);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/stats`, { withCredentials: true });
      setStats(res.data || { tyres_today: 0, total_vehicles: 0 });
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const [rangeStart, rangeEnd] = useMemo(() => getPeriodRange(referenceDate, period), [referenceDate, period]);

  const inRange = (ins) => {
    const dStr = ins.report_date || ins.inspectionDate || ins.created_at || ins.createdAt;
    if (!dStr) return false;
    const d = new Date(dStr);
    return d >= rangeStart && d <= rangeEnd;
  };

  const filtered = inspections.filter(inRange);

  const counts = useMemo(() => {
    const res = { total: filtered.length, toDo: 0, inProgress: 0, completed: 0 };
    filtered.forEach(s => {
      const st = (s.status || '').toLowerCase();
      if (st === 'completed') res.completed += 1;
      else if (st === 'in progress') res.inProgress += 1;
      else res.toDo += 1;
    });
    return res;
  }, [filtered]);

  // Custom KPIs based on user's philosophy: Safety, Uptime, Money
  const kpis = useMemo(() => {
    const safetyScore = Math.max(0, 100 - (counts.toDo * 5)); // Lower incomplete inspections = higher safety
    const uptimePercentage = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 100;
    const estimatedSavings = counts.completed * 250; // Rough estimate: $250 saved per completed inspection

    return [
      {
        title: "Fleet Safety Score",
        value: `${safetyScore}%`,
        trend: safetyScore > 90 ? "+2%" : safetyScore > 80 ? "0%" : "-5%",
        color: safetyScore > 90 ? "green" : safetyScore > 80 ? "yellow" : "red",
        icon: "🛡️",
        description: "Based on completed inspections"
      },
      {
        title: "Fleet Uptime",
        value: `${uptimePercentage}%`,
        trend: uptimePercentage > 95 ? "+1%" : uptimePercentage > 85 ? "0%" : "-3%",
        color: uptimePercentage > 95 ? "green" : uptimePercentage > 85 ? "blue" : "orange",
        icon: "⚡",
        description: "Vehicles with recent inspections"
      },
      {
        title: "Maintenance Savings",
        value: `$${estimatedSavings.toLocaleString()}`,
        trend: estimatedSavings > 1000 ? "+15%" : estimatedSavings > 500 ? "+8%" : "+2%",
        color: estimatedSavings > 1000 ? "green" : estimatedSavings > 500 ? "blue" : "purple",
        icon: "💰",
        description: "Estimated cost savings this period"
      }
    ];
  }, [counts, stats]);

  const priorityAlerts = useMemo(() => {
    const alerts = [];

    // Critical safety alerts
    if (counts.toDo > 5) {
      alerts.push({
        type: 'critical',
        message: `${counts.toDo} vehicles overdue for inspection`,
        action: 'Schedule Inspections',
        icon: '🚨'
      });
    }

    // Maintenance alerts
    if (stats.tyres_today > 0) {
      alerts.push({
        type: 'info',
        message: `${stats.tyres_today} tyres inspected today`,
        action: 'View Details',
        icon: '🔧'
      });
    }

    // Predictive maintenance (simulated)
    const overdueVehicles = inspections.filter(ins => {
      const daysSince = (new Date() - new Date(ins.created_at || ins.inspectionDate)) / (1000 * 60 * 60 * 24);
      return daysSince > 30 && (ins.status || '').toLowerCase() !== 'completed';
    });

    if (overdueVehicles.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${overdueVehicles.length} vehicles due for maintenance`,
        action: 'Schedule Service',
        icon: '⚠️'
      });
    }

    return alerts;
  }, [counts, stats, inspections]);

  const outstandingCustomers = useMemo(() => {
    const map = {};
    inspections.forEach(s => {
      const st = (s.status || '').toLowerCase();
      if (st !== 'completed') {
        const name = s.customer_name || s.customerName || 'Unknown';
        map[name] = (map[name] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, cnt]) => ({ name, count: cnt })).sort((a, b) => b.count - a.count);
  }, [inspections]);

  const recent = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const av = a[sortKey] || a.report_date || a.inspectionDate || '';
      const bv = b[sortKey] || b.report_date || b.inspectionDate || '';
      const ad = new Date(av);
      const bd = new Date(bv);
      if (sortKey.toLowerCase().includes('date') || sortKey === 'report_date') {
        return sortDir === 'asc' ? ad - bd : bd - ad;
      }
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const quickActions = [
    {
      label: "Latest Inspections",
      action: () => setPeriod('week'),
      icon: "📋",
      description: "View recent inspection reports"
    },
    {
      label: "KPI Tracker",
      action: () => setDashboardView('analytics'),
      icon: "📊",
      description: "Monitor key performance metrics"
    },
    {
      label: "Predictive Alerts",
      action: () => {/* Scroll to alerts section */},
      icon: "🔮",
      description: "View maintenance predictions"
    },
    {
      label: "Schedule Service",
      action: () => {/* Navigate to scheduling */},
      icon: "📅",
      description: "Book maintenance appointments"
    }
  ];

  const renderKPICard = (kpi) => (
    <div key={kpi.title} className={`p-6 rounded-xl shadow-lg border-l-4 ${
      kpi.color === 'green' ? 'bg-green-50 border-green-500 dark:bg-green-900/20' :
      kpi.color === 'blue' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' :
      kpi.color === 'yellow' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
      kpi.color === 'red' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
      'bg-purple-50 border-purple-500 dark:bg-purple-900/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{kpi.icon}</div>
        <div className={`text-sm font-medium ${
          kpi.trend.startsWith('+') ? 'text-green-600' :
          kpi.trend === '0%' ? 'text-gray-600' : 'text-red-600'
        }`}>
          {kpi.trend}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{kpi.value}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">{kpi.title}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{kpi.description}</div>
    </div>
  );

  const renderAlert = (alert, index) => (
    <div key={index} className={`p-4 rounded-lg border-l-4 mb-3 ${
      alert.type === 'critical' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
      'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{alert.icon}</span>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{alert.message}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Requires attention</div>
          </div>
        </div>
        <button className={`px-3 py-1 rounded text-sm font-medium ${
          alert.type === 'critical' ? 'bg-red-600 text-white hover:bg-red-700' :
          alert.type === 'warning' ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
          'bg-blue-600 text-white hover:bg-blue-700'
        }`}>
          {alert.action}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Mission Statement Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">🚛 ZURI Fleet Management</h1>
            <p className="text-xl text-blue-100 mb-4">Safety • Uptime • Savings</p>
            <p className="text-lg text-blue-200 max-w-3xl mx-auto">
              Protecting your fleet, maximizing uptime, and driving cost savings through proactive maintenance and intelligent insights.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Header with Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fleet Health Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400">Monitor your fleet's safety, uptime, and financial performance</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* View Switcher */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</label>
                <select
                  value={dashboardView}
                  onChange={(e) => setDashboardView(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {Object.entries(DASHBOARD_VIEWS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Time Period Controls */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
                <div className="flex gap-1">
                  {['day', 'week', 'month', 'year'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        period === p
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="date"
                value={referenceDate}
                onChange={e => setReferenceDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <button
                onClick={() => logout().then(onLogout)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Priority Alerts */}
        {priorityAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🚨 Priority Alerts
            </h3>
            <div className="space-y-2">
              {priorityAlerts.map((alert, index) => renderAlert(alert, index))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {kpis.map(kpi => renderKPICard(kpi))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Primary Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{action.icon}</span>
                      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {action.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Inspections Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Inspection Overview</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(rangeStart).toLocaleDateString()} - {new Date(rangeEnd).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Inspections</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{counts.inProgress}</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">In Progress</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">{counts.completed}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
                </div>
              </div>

              {/* Recent Inspections Table */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Recent Inspections</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded" onClick={() => toggleSort('created_at')}>Date</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded" onClick={() => toggleSort('vehicle_id')}>Vehicle</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded" onClick={() => toggleSort('customer_name')}>Customer</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading inspections...</td></tr>
                      ) : recent.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">No inspections in selected period</td></tr>
                      ) : recent.slice(0, dashboardView === 'clean' ? 5 : 10).map(r => (
                        <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-3 text-sm text-gray-900 dark:text-white">
                            {new Date(r.created_at || r.inspectionDate || r.report_date).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-sm text-gray-900 dark:text-white">{r.vehicle_id || r.vehicleId || 'N/A'}</td>
                          <td className="p-3 text-sm text-gray-900 dark:text-white">{r.customer_name || r.customerName || 'Unknown'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (r.status || '').toLowerCase() === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              (r.status || '').toLowerCase() === 'in progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {r.status || 'To Do'}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-900 dark:text-white">{(r.items && r.items.length) || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Outstanding Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Outstanding Customers</h3>
              <div className="space-y-2">
                {outstandingCustomers.slice(0, 8).map(c => (
                  <div key={c.name} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-sm font-medium">
                      {c.count} pending
                    </span>
                  </div>
                ))}
                {outstandingCustomers.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">✅</div>
                    <div>All customers up to date!</div>
                  </div>
                )}
              </div>
            </div>

            {/* Fleet Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fleet Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Vehicles</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.total_vehicles || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Tyres Inspected Today</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.tyres_today || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                  <span className="font-bold text-green-600">
                    {counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 100}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables Section - Only show in analytics/detailed view */}
        {(dashboardView === 'analytics' || dashboardView === 'detailed') && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Data Tables</h3>
              <div className="flex gap-2">
                {TABS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <TableViewer key={tab} table={tab} user={user} />
          </div>
        )}
      </div>
    </div>
  );
}
