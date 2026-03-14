import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Settings,
  LogOut,
  Download,
} from 'lucide-react';
import type { DailySummary } from '../lib/supabase';
import { WeeklyReport } from './WeeklyReport';
import { SiteClassification } from './SiteClassification';

type View = 'overview' | 'weekly' | 'settings';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>('overview');
  const [dailyStats, setDailyStats] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user) return;

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: false });

    setDailyStats(data || []);
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const todayStats = dailyStats[0];
  const totalProductiveTime = dailyStats.reduce(
    (sum, day) => sum + day.total_productive_seconds,
    0
  );
  const totalUnproductiveTime = dailyStats.reduce(
    (sum, day) => sum + day.total_unproductive_seconds,
    0
  );
  const totalTime = dailyStats.reduce(
    (sum, day) =>
      sum +
      day.total_productive_seconds +
      day.total_unproductive_seconds +
      day.total_neutral_seconds,
    0
  );

  const productivityScore = totalTime > 0
    ? Math.round((totalProductiveTime / totalTime) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Productivity Tracker</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setView('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              view === 'overview'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              view === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Weekly Report
          </button>
          <button
            onClick={() => setView('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              view === 'settings'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Site Classification
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : view === 'overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Weekly Score</h3>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{productivityScore}%</p>
                <p className="text-sm text-gray-500 mt-2">Productivity</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Time</h3>
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{formatTime(totalTime)}</p>
                <p className="text-sm text-gray-500 mt-2">Last 7 days</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Today</h3>
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900">
                  {todayStats
                    ? formatTime(
                        todayStats.total_productive_seconds +
                          todayStats.total_unproductive_seconds +
                          todayStats.total_neutral_seconds
                      )
                    : '0m'}
                </p>
                <p className="text-sm text-gray-500 mt-2">Active time</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Productive vs Unproductive
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-green-600">Productive</span>
                      <span className="text-sm font-semibold text-green-700">
                        {formatTime(totalProductiveTime)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${totalTime > 0 ? (totalProductiveTime / totalTime) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-red-600">Unproductive</span>
                      <span className="text-sm font-semibold text-red-700">
                        {formatTime(totalUnproductiveTime)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-red-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${totalTime > 0 ? (totalUnproductiveTime / totalTime) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Sites This Week</h3>
                <div className="space-y-3">
                  {todayStats &&
                    (todayStats.top_domains as Array<{ domain: string; seconds: number }>)
                      .slice(0, 5)
                      .map((site, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                              {site.domain}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatTime(site.seconds)}
                          </span>
                        </div>
                      ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
              <div className="space-y-3">
                {dailyStats.map((day) => {
                  const dayTotal =
                    day.total_productive_seconds +
                    day.total_unproductive_seconds +
                    day.total_neutral_seconds;
                  const dayProductivePercent = dayTotal > 0
                    ? (day.total_productive_seconds / dayTotal) * 100
                    : 0;

                  return (
                    <div key={day.id} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-gray-600">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="bg-green-500 h-full absolute left-0 top-0"
                            style={{ width: `${dayProductivePercent}%` }}
                          ></div>
                          <div
                            className="bg-red-500 h-full absolute top-0"
                            style={{
                              left: `${dayProductivePercent}%`,
                              width: `${dayTotal > 0 ? (day.total_unproductive_seconds / dayTotal) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-20 text-right text-sm font-semibold text-gray-900">
                        {formatTime(dayTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : view === 'weekly' ? (
          <WeeklyReport dailyStats={dailyStats} />
        ) : (
          <SiteClassification />
        )}
      </div>
    </div>
  );
}
