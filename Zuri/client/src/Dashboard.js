import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import TableViewer from './TableViewer';
import { logout } from './api';

const TABS = ['tyres', 'vehicles', 'companies', 'depots', 'users'];
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

  useEffect(() => {
    fetchInspections();
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

  const outstandingCustomers = useMemo(() => {
    const map = {};
    inspections.forEach(s => {
      const st = (s.status || '').toLowerCase();
      if (st !== 'completed') {
        const name = s.customer_name || s.customerName || 'Unknown';
        map[name] = (map[name] || 0) + 1;
      }
    });
    // convert to sorted list
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

  return (
    <div className="flex flex-col p-6 bg-gray-50 min-h-screen dark:bg-gray-900 gap-4">
      <div className="border-l-4 border-blue-500 pl-6 py-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900 dark:to-transparent rounded-r-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Snapshot of inspections — focus where attention is needed</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => logout().then(onLogout)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Sign out</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">Period</div>
              <div className="flex gap-2">
                {['day', 'week', 'month', 'year'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'}`}>{p}</button>
                ))}
              </div>
              <input type="date" value={referenceDate} onChange={e => setReferenceDate(e.target.value)} className="ml-4 px-3 py-1 border rounded" />
            </div>
            <div className="text-sm text-gray-500">Showing {period} starting {new Date(rangeStart).toLocaleDateString()} → {new Date(rangeEnd).toLocaleDateString()}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Total Inspections</div>
              <div className="text-2xl font-bold">{counts.total}</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-xs text-yellow-700">In Progress</div>
              <div className="text-2xl font-bold text-yellow-800">{counts.inProgress}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-xs text-green-700">Completed</div>
              <div className="text-2xl font-bold text-green-800">{counts.completed}</div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Outstanding Customers</h3>
            <div className="flex gap-2 flex-wrap">
              {outstandingCustomers.slice(0, 8).map(c => (
                <div key={c.name} className="px-3 py-2 bg-red-50 rounded text-sm font-medium">{c.name} <span className="text-xs text-gray-500">({c.count})</span></div>
              ))}
              {outstandingCustomers.length === 0 && <div className="text-sm text-gray-500">No outstanding customers</div>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Recent Inspections</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800">
                <thead>
                  <tr className="text-left">
                    <th className="p-2 cursor-pointer" onClick={() => toggleSort('report_date')}>Date</th>
                    <th className="p-2 cursor-pointer" onClick={() => toggleSort('vehicle_id')}>Vehicle</th>
                    <th className="p-2 cursor-pointer" onClick={() => toggleSort('customer_name')}>Customer</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                  ) : recent.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No inspections in range</td></tr>
                  ) : recent.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{new Date(r.report_date || r.inspectionDate || r.created_at || r.createdAt).toLocaleString()}</td>
                      <td className="p-2">{r.vehicle_id || r.vehicleId}</td>
                      <td className="p-2">{r.customer_name || r.customerName}</td>
                      <td className="p-2">{r.status || 'To Do'}</td>
                      <td className="p-2">{(r.items && r.items.length) || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => setPeriod('week')} className="px-3 py-2 bg-blue-600 text-white rounded">This Week</button>
            <button onClick={() => setPeriod('month')} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded">This Month</button>
            <button onClick={() => setPeriod('year')} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded">This Year</button>
            <button onClick={fetchInspections} className="px-3 py-2 bg-green-600 text-white rounded">Refresh</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <TableViewer key={tab} table={tab} user={user} />
      </div>
    </div>
  );
}
