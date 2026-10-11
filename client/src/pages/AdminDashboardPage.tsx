/**
 * Administrator Dashboard for GhatRakshak.
 *
 * Provides access to:
 * - User management
 * - Ghat metadata editing
 * - Audit log viewing
 * - Data quality overview
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  MapPin,
  Shield,
  Plus,
  Trash2,
  Save,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  History,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AdminTab = 'users' | 'ghats' | 'audit';

interface User {
  id: string;
  username: string;
  role: string;
  display_name: string;
  created_at: string;
  last_login: string | null;
}

interface AuditEntry {
  id: string;
  username: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: string;
  timestamp: string;
}

interface AdminDashboardProps {
  language: 'en' | 'hi';
}

const API_BASE = '/api/v1';

export const AdminDashboardPage: React.FC<AdminDashboardProps> = ({ language }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New user form
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'municipal_officer' | 'administrator'>('municipal_officer');
  const [newDisplayName, setNewDisplayName] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/audit?limit=50`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch audit log');
      const data = await res.json();
      setAuditLog(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audit') fetchAuditLog();
  }, [activeTab, fetchUsers, fetchAuditLog]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUsername || !newPassword) {
      setError('Username and password are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          displayName: newDisplayName || newUsername,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to create user');
      }

      setSuccess('User created successfully');
      setShowNewUserForm(false);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const tabs = [
    { id: 'users' as const, label: language === 'hi' ? 'उपयोगकर्ता' : 'Users', icon: Users },
    { id: 'ghats' as const, label: language === 'hi' ? 'घाट प्रबंधन' : 'Ghat Management', icon: MapPin },
    { id: 'audit' as const, label: language === 'hi' ? 'ऑडिट लॉग' : 'Audit Log', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/mp-mpsedc-logo.jpg"
              alt="Government of Madhya Pradesh"
              className="h-10 w-auto"
            />
            <div>
              <div className="text-lg font-bold text-slate-900">GhatRakshak</div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span>{language === 'hi' ? 'प्रशासक डैशबोर्ड' : 'Administrator Dashboard'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900">{user?.displayName}</div>
              <div className="text-xs text-slate-500">{language === 'hi' ? 'प्रशासक' : 'Administrator'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {language === 'hi' ? 'उपयोगकर्ता प्रबंधन' : 'User Management'}
              </h2>
              <button
                onClick={() => setShowNewUserForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'hi' ? 'नया उपयोगकर्ता' : 'New User'}</span>
              </button>
            </div>

            {/* New User Form */}
            {showNewUserForm && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {language === 'hi' ? 'नया उपयोगकर्ता बनाएं' : 'Create New User'}
                </h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username'}
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'hi' ? 'पासवर्ड' : 'Password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'hi' ? 'प्रदर्शन नाम' : 'Display Name'}
                    </label>
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'hi' ? 'भूमिका' : 'Role'}
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as typeof newRole)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="municipal_officer">Municipal Officer</option>
                      <option value="administrator">Administrator</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowNewUserForm(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{language === 'hi' ? 'बनाएं' : 'Create'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                        {language === 'hi' ? 'उपयोगकर्ता' : 'User'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                        {language === 'hi' ? 'भूमिका' : 'Role'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                        {language === 'hi' ? 'अंतिम लॉगिन' : 'Last Login'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                        {language === 'hi' ? 'क्रियाएं' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{u.display_name}</div>
                          <div className="text-sm text-slate-500">@{u.username}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'administrator'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {u.role === 'administrator' ? (
                              <><Shield className="w-3 h-3" /> Admin</>
                            ) : (
                              'Officer'
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {u.last_login
                            ? new Date(u.last_login).toLocaleString()
                            : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Ghats Tab */}
        {activeTab === 'ghats' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {language === 'hi' ? 'घाट मेटाडेटा प्रबंधन' : 'Ghat Metadata Management'}
            </h2>
            <p className="text-slate-600">
              {language === 'hi'
                ? 'यहां आप घाट विवरण और परिचालन स्थिति संपादित कर सकते हैं। ऐतिहासिक अवलोकन अपरिवर्तनीय हैं।'
                : 'Edit ghat descriptions and operational status here. Historical observations remain immutable.'}
            </p>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>{language === 'hi' ? 'नोट:' : 'Note:'}</strong>{' '}
              {language === 'hi'
                ? 'घाट मेटाडेटा संपादन सुविधा आगामी रिलीज में उपलब्ध होगी।'
                : 'Ghat metadata editing will be available in an upcoming release.'}
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'hi' ? 'ऑडिट लॉग' : 'Audit Log'}
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : auditLog.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  {language === 'hi' ? 'कोई ऑडिट रिकॉर्ड नहीं' : 'No audit records'}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLog.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          @{entry.username}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            entry.action === 'create' ? 'bg-emerald-100 text-emerald-700' :
                            entry.action === 'delete' ? 'bg-rose-100 text-rose-700' :
                            entry.action === 'login' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {entry.entity_type}
                          {entry.entity_id && <span className="text-slate-400"> #{entry.entity_id.slice(0, 8)}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
