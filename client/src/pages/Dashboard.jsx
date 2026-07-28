import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { FolderIcon, PlusIcon, TrashIcon } from '../components/Icons.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { folders } = await api.listFolders();
      setFolders(folders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.createFolder(newName.trim());
      setNewName('');
      setShowNew(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete folder "${name}" and all invoices inside it? This can't be undone.`)) return;
    try {
      await api.deleteFolder(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="content-narrow">
      <div className="page-header">
        <div>
          <h1>Your folders</h1>
          <p className="subtitle">Organize invoices into categories, e.g. by client or project.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><PlusIcon width={16} height={16} /> New folder</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : folders.length === 0 ? (
        <div className="empty-state card">
          <div className="big-icon"><FolderIcon width={24} height={24} /></div>
          <p>No folders yet. Create your first one to start making invoices.</p>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}><PlusIcon width={16} height={16} /> New folder</button>
        </div>
      ) : (
        <div className="grid">
          {folders.map((f) => (
            <div key={f.id} className="tile" onClick={() => navigate(`/folders/${f.id}`)}>
              <div className="tile-icon"><FolderIcon /></div>
              <div className="tile-title">{f.name}</div>
              <div className="tile-meta">{f.invoiceCount} invoice{f.invoiceCount === 1 ? '' : 's'}</div>
              <div className="tile-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(f.id, f.name)}><TrashIcon width={15} height={15} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>New folder</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Folder name</label>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Client A" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
