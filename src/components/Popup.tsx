import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { DailySummary } from '../lib/supabase';

export function Popup() {
  const [stats, setStats] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    setStats(data);
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

  const totalSeconds = stats
    ? stats.total_productive_seconds +
      stats.total_unproductive_seconds +
      stats.total_neutral_seconds
    : 0;

  const productivePercent = totalSeconds > 0
    ? Math.round((stats!.total_productive_seconds / totalSeconds) * 100)
    : 0;

  const openDashboard = () => {
    chrome.tabs.create({ url: 'options.html' });
  };

  if (loading) {
    return (
      <div className="w-80 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-80 p-6 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">No activity tracked today</p>
        <button
          onClick={openDashboard}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          Open Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Today's Activity</h1>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="text-lg">{formatTime(totalSeconds)}</span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">Productive</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {productivePercent}%
            </span>
          </div>
          <p className="text-green-700">
            {formatTime(stats.total_productive_seconds)}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-900">Unproductive</span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              {totalSeconds > 0
                ? Math.round((stats.total_unproductive_seconds / totalSeconds) * 100)
                : 0}
              %
            </span>
          </div>
          <p className="text-red-700">
            {formatTime(stats.total_unproductive_seconds)}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Top Sites</h3>
          <div className="space-y-2">
            {(stats.top_domains as Array<{ domain: string; seconds: number }>)
              .slice(0, 3)
              .map((site, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate">{site.domain}</span>
                  <span className="text-gray-500 font-medium">
                    {formatTime(site.seconds)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={openDashboard}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-5 h-5" />
          View Full Dashboard
        </button>
      </div>
    </div>
  );
}
