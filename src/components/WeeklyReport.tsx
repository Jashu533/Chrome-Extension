import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import type { DailySummary } from '../lib/supabase';

interface WeeklyReportProps {
  dailyStats: DailySummary[];
}

export function WeeklyReport({ dailyStats }: WeeklyReportProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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

  const avgDailyProductiveTime = dailyStats.length > 0
    ? totalProductiveTime / dailyStats.length
    : 0;

  const topDomains = new Map<string, number>();
  dailyStats.forEach((day) => {
    (day.top_domains as Array<{ domain: string; seconds: number }>).forEach((site) => {
      const current = topDomains.get(site.domain) || 0;
      topDomains.set(site.domain, current + site.seconds);
    });
  });

  const sortedDomains = Array.from(topDomains.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const getMostProductiveDay = () => {
    if (dailyStats.length === 0) return null;
    return dailyStats.reduce((max, day) =>
      day.total_productive_seconds > max.total_productive_seconds ? day : max
    );
  };

  const mostProductiveDay = getMostProductiveDay();

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const grade = getGrade(productivityScore);

  const downloadReport = () => {
    const report = `
WEEKLY PRODUCTIVITY REPORT
Generated: ${new Date().toLocaleDateString()}

OVERALL SCORE: ${productivityScore}% (Grade: ${grade.grade})

SUMMARY:
- Total Time Tracked: ${formatTime(totalTime)}
- Productive Time: ${formatTime(totalProductiveTime)}
- Unproductive Time: ${formatTime(totalUnproductiveTime)}
- Average Daily Productive Time: ${formatTime(avgDailyProductiveTime)}

TOP 10 WEBSITES:
${sortedDomains.map((d, i) => `${i + 1}. ${d[0]}: ${formatTime(d[1])}`).join('\n')}

DAILY BREAKDOWN:
${dailyStats.map(day => {
  const dayTotal = day.total_productive_seconds + day.total_unproductive_seconds + day.total_neutral_seconds;
  const dayScore = dayTotal > 0 ? Math.round((day.total_productive_seconds / dayTotal) * 100) : 0;
  return `${new Date(day.date).toLocaleDateString()}: ${formatTime(dayTotal)} (${dayScore}% productive)`;
}).join('\n')}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Weekly Productivity Report</h2>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
          >
            Download Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`${grade.bg} rounded-xl p-6 border-2 border-current ${grade.color}`}>
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-8 h-8" />
              <h3 className="text-lg font-semibold">Overall Grade</h3>
            </div>
            <p className="text-5xl font-bold mb-2">{grade.grade}</p>
            <p className="text-lg font-medium">{productivityScore}% Productive</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-3 text-blue-600">
              <Target className="w-8 h-8" />
              <h3 className="text-lg font-semibold">Daily Average</h3>
            </div>
            <p className="text-5xl font-bold text-blue-600 mb-2">
              {formatTime(avgDailyProductiveTime)}
            </p>
            <p className="text-lg font-medium text-blue-700">Productive Time</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Time</p>
            <p className="text-2xl font-bold text-gray-900">{formatTime(totalTime)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Productive</p>
            <p className="text-2xl font-bold text-green-700">{formatTime(totalProductiveTime)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-1">Unproductive</p>
            <p className="text-2xl font-bold text-red-700">{formatTime(totalUnproductiveTime)}</p>
          </div>
        </div>

        {mostProductiveDay && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Most Productive Day</h3>
            </div>
            <p className="text-lg text-green-700">
              {new Date(mostProductiveDay.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              {' - '}
              {formatTime(mostProductiveDay.total_productive_seconds)} productive time
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Top 10 Websites</h3>
        <div className="space-y-3">
          {sortedDomains.map(([domain, seconds], index) => (
            <div key={domain} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{domain}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(seconds / sortedDomains[0][1]) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900 w-24 text-right">
                {formatTime(seconds)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>
        <div className="space-y-4">
          {productivityScore >= 70 ? (
            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Great work!</p>
                <p className="text-green-700 text-sm">
                  Your productivity score is excellent. Keep up the good habits!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg">
              <TrendingDown className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Room for improvement</p>
                <p className="text-yellow-700 text-sm">
                  Try to reduce time on unproductive sites and focus more on productive activities.
                </p>
              </div>
            </div>
          )}

          {totalUnproductiveTime > totalProductiveTime && (
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Action needed</p>
                <p className="text-red-700 text-sm">
                  You spent more time on unproductive sites than productive ones. Consider blocking
                  or limiting access to distracting websites.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
