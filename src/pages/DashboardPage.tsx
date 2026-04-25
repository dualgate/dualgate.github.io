import { useState, useEffect, useCallback } from 'react';
import { api, type PersonalDevice } from '@/lib/api';

interface Props {
  onLogout: () => void;
}

export default function DashboardPage({ onLogout }: Props) {
  const [devices, setDevices] = useState<PersonalDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

  const fetchDevices = useCallback(async () => {
    try {
      const { devices } = await api.getPersonalDevices();
      setDevices(devices);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleCreate = async () => {
    const name = newDeviceName.trim() || `Device ${devices.length + 1}`;
    setCreating(true);
    setError('');
    try {
      await api.createPersonalDevice(name);
      await fetchDevices();
      setNewDeviceName('');
      setShowAddForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create device');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (email: string, displayName: string) => {
    if (!confirm(`Delete device "${displayName}"?`)) return;
    setError('');
    try {
      await api.deletePersonalDevice(email);
      await fetchDevices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Personal VPN</h1>
            <p className="text-sm text-gray-400">Direct exit (DE) - German IP</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400
              transition hover:border-gray-500 hover:text-gray-200"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Add device */}
        {showAddForm ? (
          <div className="mb-6 rounded-lg border border-gray-700 bg-gray-900/50 p-4 space-y-3">
            <input
              type="text"
              placeholder="Device name (e.g. MacBook, Mom's Phone)"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              maxLength={40}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm
                outline-none transition focus:border-emerald-500 placeholder:text-gray-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium transition
                  hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewDeviceName(''); }}
                className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400
                  transition hover:border-gray-500 hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-6 w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium transition
              hover:bg-emerald-500"
          >
            + Add Personal Device
          </button>
        )}

        {/* Devices list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-lg border border-gray-800 py-12 text-center text-gray-500">
            No personal devices yet. Click the button above to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => {
              const displayName = d.name || d.email;
              return (
                <div
                  key={d.email}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-4"
                >
                  <div>
                    <div className="font-medium">{displayName}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {d.email} | UUID: {d.uuid.slice(0, 8)}...
                      {d.created_at && ` | ${d.created_at.slice(0, 10)}`}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          d.is_active
                            ? 'bg-emerald-900/50 text-emerald-400'
                            : 'bg-red-900/50 text-red-400'
                        }`}
                      >
                        {d.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(d.email, displayName)}
                    className="rounded-lg border border-red-800 px-3 py-2 text-sm text-red-400
                      transition hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-600">
          {devices.length} personal device{devices.length !== 1 ? 's' : ''} | Exit: Germany (DE)
        </div>
      </div>
    </div>
  );
}
