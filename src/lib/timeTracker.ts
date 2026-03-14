import { supabase } from './supabase';

export class TimeTracker {
  private static currentSession: {
    domain: string;
    url: string;
    title: string;
    startTime: Date;
    sessionId?: string;
  } | null = null;

  private static categories: Map<string, string> = new Map();

  static async initialize() {
    await this.loadCategories();

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url) {
        await this.handleTabChange(tab.url, tab.title || '');
      }
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active && tab.url) {
        await this.handleTabChange(tab.url, tab.title || '');
      }
    });

    chrome.windows.onFocusChanged.addListener(async (windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        await this.endCurrentSession();
      } else {
        const [activeTab] = await chrome.tabs.query({ active: true, windowId });
        if (activeTab?.url) {
          await this.handleTabChange(activeTab.url, activeTab.title || '');
        }
      }
    });

    chrome.alarms.create('saveSession', { periodInMinutes: 1 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'saveSession') {
        this.saveCurrentSession();
      }
    });
  }

  private static async loadCategories() {
    const { data, error } = await supabase
      .from('website_categories')
      .select('domain, category');

    if (!error && data) {
      this.categories.clear();
      data.forEach((cat) => {
        this.categories.set(cat.domain, cat.category);
      });
    }
  }

  private static getDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  private static getCategoryForDomain(domain: string): string {
    return this.categories.get(domain) || 'neutral';
  }

  private static async handleTabChange(url: string, title: string) {
    const domain = this.getDomainFromUrl(url);

    if (!domain || domain === 'newtab' || url.startsWith('chrome://')) {
      await this.endCurrentSession();
      return;
    }

    if (this.currentSession?.domain === domain && this.currentSession?.url === url) {
      return;
    }

    await this.endCurrentSession();
    await this.startNewSession(domain, url, title);
  }

  private static async startNewSession(domain: string, url: string, title: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const category = this.getCategoryForDomain(domain);
    const startTime = new Date();

    const { data, error } = await supabase
      .from('time_sessions')
      .insert({
        user_id: user.id,
        domain,
        url,
        title,
        start_time: startTime.toISOString(),
        category,
        duration_seconds: 0,
      })
      .select()
      .single();

    if (!error && data) {
      this.currentSession = {
        domain,
        url,
        title,
        startTime,
        sessionId: data.id,
      };
    }
  }

  private static async endCurrentSession() {
    if (!this.currentSession) return;

    await this.saveCurrentSession();
    this.currentSession = null;
  }

  private static async saveCurrentSession() {
    if (!this.currentSession?.sessionId) return;

    const endTime = new Date();
    const durationSeconds = Math.floor(
      (endTime.getTime() - this.currentSession.startTime.getTime()) / 1000
    );

    if (durationSeconds < 1) return;

    await supabase
      .from('time_sessions')
      .update({
        end_time: endTime.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', this.currentSession.sessionId);

    await this.updateDailySummary(
      this.currentSession.domain,
      durationSeconds,
      this.getCategoryForDomain(this.currentSession.domain)
    );
  }

  private static async updateDailySummary(
    domain: string,
    durationSeconds: number,
    category: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (category === 'productive') {
        updates.total_productive_seconds = existing.total_productive_seconds + durationSeconds;
      } else if (category === 'unproductive') {
        updates.total_unproductive_seconds = existing.total_unproductive_seconds + durationSeconds;
      } else {
        updates.total_neutral_seconds = existing.total_neutral_seconds + durationSeconds;
      }

      const topDomains = existing.top_domains as Array<{ domain: string; seconds: number }>;
      const domainIndex = topDomains.findIndex((d) => d.domain === domain);
      if (domainIndex >= 0) {
        topDomains[domainIndex].seconds += durationSeconds;
      } else {
        topDomains.push({ domain, seconds: durationSeconds });
      }
      topDomains.sort((a, b) => b.seconds - a.seconds);
      updates.top_domains = topDomains.slice(0, 10);

      await supabase
        .from('daily_summaries')
        .update(updates)
        .eq('id', existing.id);
    } else {
      const newSummary: Record<string, unknown> = {
        user_id: user.id,
        date: today,
        total_productive_seconds: 0,
        total_unproductive_seconds: 0,
        total_neutral_seconds: 0,
        top_domains: [{ domain, seconds: durationSeconds }],
      };

      if (category === 'productive') {
        newSummary.total_productive_seconds = durationSeconds;
      } else if (category === 'unproductive') {
        newSummary.total_unproductive_seconds = durationSeconds;
      } else {
        newSummary.total_neutral_seconds = durationSeconds;
      }

      await supabase.from('daily_summaries').insert(newSummary);
    }
  }

  static async getTodayStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    return data;
  }

  static async getWeeklyStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true });

    return data || [];
  }
}
