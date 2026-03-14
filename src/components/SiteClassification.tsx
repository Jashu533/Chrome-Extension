import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { WebsiteCategory } from '../lib/supabase';

export function SiteClassification() {
  const [categories, setCategories] = useState<WebsiteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState<'productive' | 'unproductive' | 'neutral'>(
    'productive'
  );
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('website_categories')
      .select('*')
      .order('domain');

    setCategories(data || []);
    setLoading(false);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const domain = newDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    const { error } = await supabase.from('website_categories').insert({
      domain,
      category: newCategory,
      custom_name: customName || null,
      user_id: user.id,
    });

    if (!error) {
      setNewDomain('');
      setCustomName('');
      loadCategories();
    }
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('website_categories').delete().eq('id', id);
    loadCategories();
  };

  const userCategories = categories.filter((c) => c.user_id !== null);
  const defaultCategories = categories.filter((c) => c.user_id === null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productive':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'unproductive':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <MinusCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'productive':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'unproductive':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Custom Website</h2>
        <form onSubmit={addCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website Domain
              </label>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as 'productive' | 'unproductive' | 'neutral')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="productive">Productive</option>
                <option value="unproductive">Unproductive</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Name (Optional)
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Display name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Website
          </button>
        </form>
      </div>

      {userCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Custom Categories</h2>
          <div className="space-y-2">
            {userCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  {getCategoryIcon(cat.category)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {cat.custom_name || cat.domain}
                    </p>
                    {cat.custom_name && (
                      <p className="text-sm text-gray-500">{cat.domain}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryBadge(cat.category)}`}
                  >
                    {cat.category}
                  </span>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-red-600 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Default Categories</h2>
        <p className="text-sm text-gray-600 mb-4">
          These are pre-configured website categories. You can add your own custom categories above.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {defaultCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getCategoryIcon(cat.category)}
                <span className="font-medium text-gray-900">{cat.domain}</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryBadge(cat.category)}`}
              >
                {cat.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
