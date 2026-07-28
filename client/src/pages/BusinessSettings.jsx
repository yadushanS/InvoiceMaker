import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api, assetUrl } from '../api.js';

export default function BusinessSettings() {
  const { business, setBusiness } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: business.name || '',
    address: business.address || '',
    abn: business.abn || '',
    phone: business.phone || '',
    contactEmail: business.contactEmail || '',
    bankAccountHolder: business.bankAccountHolder || '',
    bankName: business.bankName || '',
    bankBsb: business.bankBsb || '',
    bankAccountNo: business.bankAccountNo || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { business: updated } = await api.updateBusiness(form);
      setBusiness(updated);
      setMessage('Saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const { business: updated } = await api.uploadLogo(fd);
      setBusiness(updated);
      setMessage('Logo updated and invoice colors extracted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const theme = business.themeColors;

  return (
    <div className="content-narrow">
      <div className="page-header">
        <div>
          <h1>Business settings</h1>
          <p className="subtitle">This information appears on every invoice you create.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Logo &amp; brand colors</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--surface-2)' }}>
            {business.logoUrl ? <img src={assetUrl(business.logoUrl)} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No logo</span>}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoChange} style={{ display: 'none' }} id="logo-upload" />
            <label htmlFor="logo-upload" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : business.logoUrl ? 'Change logo' : 'Upload logo'}
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
              PNG, JPEG, WEBP or SVG, up to 5MB. Your invoice colors are automatically picked from the logo.
            </p>
          </div>
          {theme && (
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              {['primary', 'dark', 'light'].map((key) => (
                <div key={key} style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: theme[key], border: '1px solid var(--border)' }} />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{key}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Business details</h2>
          <div className="form-group">
            <label>Business name</label>
            <input value={form.name} onChange={update('name')} required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea value={form.address} onChange={update('address')} placeholder="Street, suburb, state, postcode, country" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ABN / Business number</label>
              <input value={form.abn} onChange={update('abn')} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={update('phone')} />
            </div>
          </div>
          <div className="form-group">
            <label>Contact email (shown on invoice)</label>
            <input type="email" value={form.contactEmail} onChange={update('contactEmail')} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Default payment details</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -8 }}>Used as the default on new invoices; you can still edit them per invoice.</p>
          <div className="form-row">
            <div className="form-group">
              <label>Account holder</label>
              <input value={form.bankAccountHolder} onChange={update('bankAccountHolder')} />
            </div>
            <div className="form-group">
              <label>Bank name</label>
              <input value={form.bankName} onChange={update('bankName')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>BSB / Sort code</label>
              <input value={form.bankBsb} onChange={update('bankBsb')} />
            </div>
            <div className="form-group">
              <label>Account number</label>
              <input value={form.bankAccountNo} onChange={update('bankAccountNo')} />
            </div>
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </div>
  );
}
