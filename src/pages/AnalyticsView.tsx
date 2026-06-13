import { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { usersApi } from '../api/client';

// Recharts Line Chart Data
const weeklyData = [
  { name: 'Mon', value: 30 },
  { name: 'Tue', value: 38 },
  { name: 'Wed', value: 35 },
  { name: 'Thu', value: 48 },
  { name: 'Fri', value: 58 },
  { name: 'Sat', value: 72 },
  { name: 'Sun', value: 85 }
];

const monthlyData = [
  { name: 'Wk 1', value: 45 },
  { name: 'Wk 2', value: 55 },
  { name: 'Wk 3', value: 70 },
  { name: 'Wk 4', value: 85 }
];

// Recharts Pie Chart Data
const masteryData = [
  { name: 'Theory', value: 40, color: '#19c37d' },       // teal
  { name: 'Practical', value: 25, color: '#fca5a5' },    // pinkish red
  { name: 'Research', value: 20, color: '#86efac' },     // light green
  { name: 'Peer Reviews', value: 15, color: '#93c5fd' }  // blue
];

interface CourseRow {
  name: string;
  progress: number;
  status: 'In Progress' | 'Completed';
  lastActive: string;
}

const courses: CourseRow[] = [
  { name: 'Quantum Mechanics', progress: 85, status: 'In Progress', lastActive: '2 hours ago' },
  { name: 'Deep Learning Essentials', progress: 100, status: 'Completed', lastActive: 'Yesterday' },
  { name: 'Organic Chemistry', progress: 40, status: 'In Progress', lastActive: '3 days ago' }
];

export default function AnalyticsView() {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const [stats, setStats] = useState({
    quizScore: '92.4%',
    quizChange: '+4.2%',
    resourcesRead: 48,
    resourcesChange: '+12',
    studyHours: '124h',
    studyChange: '+8h',
    rank: 'Top 5%',
    rankChange: 'Stable'
  });

  useEffect(() => {
    // Call user analytics API if available
    const fetchAnalytics = async () => {
      try {
        const response = await usersApi.analytics();
        if (response.data) {
          // If backend returns data, merge or replace mock values
          const data = response.data;
          setStats(prev => ({
            ...prev,
            quizScore: data.average_quiz_score ? `${(data.average_quiz_score * 100).toFixed(1)}%` : prev.quizScore,
            resourcesRead: data.resources_accessed || prev.resourcesRead,
            studyHours: data.study_time_hours ? `${data.study_time_hours}h` : prev.studyHours
          }));
        }
      } catch (e) {
        console.log("Backend offline or failed fetching analytics, using mock data", e);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Learning Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Comprehensive tracking of your academic journey and resource engagement.</p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button className="bg-[#1a1d1b] hover:bg-[#202221] border border-gray-800 text-gray-300 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
            <Download size={14} />
            Export Report
          </button>
          <button className="bg-[#e1be94]/10 hover:bg-[#e1be94]/20 border border-[#e1be94]/30 text-[#e1be94] text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
            <Calendar size={14} />
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <div className="w-3.5 h-3.5 bg-emerald-400 rounded-xs" />
            </div>
            <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5 bg-emerald-950 px-2 py-0.5 rounded-full">
              {stats.quizChange}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Avg. Quiz Score</p>
            <h3 className="text-white text-2xl font-black mt-1">{stats.quizScore}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <div className="w-3.5 h-3.5 bg-teal-400 rounded-xs" />
            </div>
            <span className="text-teal-400 text-[10px] font-bold flex items-center gap-0.5 bg-teal-950 px-2 py-0.5 rounded-full">
              {stats.resourcesChange}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Resources Read</p>
            <h3 className="text-white text-2xl font-black mt-1">{stats.resourcesRead}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <div className="w-3.5 h-3.5 bg-rose-400 rounded-xs" />
            </div>
            <span className="text-rose-400 text-[10px] font-bold flex items-center gap-0.5 bg-rose-950 px-2 py-0.5 rounded-full">
              {stats.studyChange}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Study Hours</p>
            <h3 className="text-white text-2xl font-black mt-1">{stats.studyHours}</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <div className="w-3.5 h-3.5 bg-blue-400 rounded-xs" />
            </div>
            <span className="text-blue-400 text-[10px] font-bold flex items-center gap-0.5 bg-blue-950 px-2 py-0.5 rounded-full">
              {stats.rankChange}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Global Rank</p>
            <h3 className="text-white text-2xl font-black mt-1">{stats.rank}</h3>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Knowledge Acquisition Curve */}
        <div className="lg:col-span-2 bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 flex flex-col justify-between h-[340px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-white tracking-wide">Knowledge Acquisition Curve</h2>
            <div className="bg-[#121413] border border-gray-900 rounded-lg p-0.5 flex gap-1">
              <button
                onClick={() => setTimeRange('weekly')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  timeRange === 'weekly' ? 'bg-[#202221] text-white shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  timeRange === 'monthly' ? 'bg-[#202221] text-white shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeRange === 'weekly' ? weeklyData : monthlyData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2220" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid #202221', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3ddc97', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3ddc97"
                  strokeWidth={3}
                  activeDot={{ r: 6, stroke: '#121413', strokeWidth: 2 }}
                  dot={{ fill: '#3ddc97', stroke: '#121413', strokeWidth: 1.5, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Mastery Donut */}
        <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl p-5 flex flex-col justify-between h-[340px]">
          <h2 className="text-base font-bold text-white tracking-wide mb-2">Resource Mastery</h2>
          
          <div className="flex-1 relative flex items-center justify-center min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={masteryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {masteryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid #202221', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Overall</span>
              <span className="text-xl font-black text-white mt-0.5">Mastered</span>
            </div>
          </div>

          {/* Custom Legends Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-2 pt-2 border-t border-gray-900/50">
            {masteryData.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-gray-300 text-xs truncate">{d.name} <span className="text-gray-500 text-[10px] font-bold">{d.value}%</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Progress Table */}
      <div className="bg-[#1a1d1b] border border-gray-900 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-900/50">
          <h2 className="text-base font-bold text-white tracking-wide">Course Modules Progress</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-900/50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-5">Course / Module</th>
                <th className="py-3 px-5">Completion Progress</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/30">
              {courses.map((c, idx) => (
                <tr key={idx} className="text-sm hover:bg-white/[0.01] transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-white">{c.name}</td>
                  <td className="py-3.5 px-5 w-[250px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-950">
                        <div
                          className="bg-primary-400 h-full rounded-full transition-all"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-300 w-8 text-right">{c.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      c.status === 'Completed' ? 'bg-emerald-950 text-primary-400' : 'bg-[#e1be94]/10 text-accent-tan'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-gray-400">{c.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
