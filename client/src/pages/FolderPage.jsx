import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';
import { computeTotals, formatMoney } from '../invoiceUtils.js';

export default function FolderPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [{ folder }, { invoices }] = await Promise.all([
        api.getFolder(folderId),
        api.listInvoices(folderId),
      ]);
      setFolder(folder);
      setInvoices(invoices);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice? This can\'t be undone.')) return;
    try {
      await api.deleteInvoice(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { invoice } = await api.duplicateInvoice(id);
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="empty-state">Loading...</div>;
  if (!folder) return <div className="empty-state">Folder not found.</div>;

  return (
    <div className="content-narrow">
      <div className="breadcrumb"><Link to="/">Folders</Link> / {folder.name}</div>
      <div className="page-header">
        <div>
          <h1>{folder.name}</h1>
          <p className="subtitle">{invoices.length} invoice{invoices.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/folders/${folderId}/invoices/new`)}>+ New invoice</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {invoices.length === 0 ? (
        <div className="empty-state card">
          <div className="big-icon">🧾</div>
          <p>No invoices in this folder yet.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/folders/${folderId}/invoices/new`)}>+ New invoice</button>
        </div>
      ) : (
        <div>
          {invoices.map((inv) => {
            const { total } = computeTotals(inv.data);
            return (
              <div key={inv.id} className="list-row">
                <div className="list-row-main" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <div className="list-row-title">
                    {inv.data.invoiceNumber ? `Invoice #${inv.data.invoiceNumber}` : 'Untitled invoice'}{' '}
                    <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                  </div>
                  <div className="list-row-sub">
                    {inv.data.billTo?.name || 'No recipient'} · {formatMoney(total, inv.data.currency)}
                  </div>
                </div>
                <div className="list-row-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/invoices/${inv.id}`)}>Edit</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDuplicate(inv.id)}>Duplicate</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inv.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
