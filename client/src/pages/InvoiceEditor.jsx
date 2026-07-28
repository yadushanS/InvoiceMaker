import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, assetUrl } from '../api.js';
import { defaultInvoiceData } from '../invoiceUtils.js';
import InvoicePreview from '../components/InvoicePreview.jsx';

export default function InvoiceEditor() {
  const { invoiceId, folderId: folderIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { business } = useAuth();
  const isNew = location.pathname.endsWith('/new');

  const [folderId, setFolderId] = useState(folderIdParam || null);
  const [data, setData] = useState(() => defaultInvoiceData(business));
  const [status, setStatus] = useState('draft');
  const [dbId, setDbId] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const previewRef = useRef(null);

  useEffect(() => {
    if (isNew) {
      setData(defaultInvoiceData(business));
      setFolderId(folderIdParam);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const { invoice } = await api.getInvoice(invoiceId);
        setDbId(invoice.id);
        setFolderId(invoice.folderId);
        setStatus(invoice.status);
        setData({ ...defaultInvoiceData(business), ...invoice.data });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, isNew]);

  const set = (path, value) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateItem = (index, field, value) => {
    setData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setData((prev) => ({ ...prev, items: [...prev.items, { description: '', subDescription: '', quantity: 1, unitPrice: 0, discountPercent: 0 }] }));
  };

  const removeItem = (index) => {
    setData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (dbId) {
        await api.updateInvoice(dbId, { data, status });
      } else {
        const { invoice } = await api.createInvoice({ folderId, data, status });
        setDbId(invoice.id);
        navigate(`/invoices/${invoice.id}`, { replace: true });
      }
      setMessage('Saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setExporting(true);
    setError('');
    try {
      if (!dbId) await handleSave();
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const node = previewRef.current;
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`invoice-${data.invoiceNumber || 'draft'}.pdf`);
    } catch (err) {
      setError('Could not generate PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      {folderId && <div className="breadcrumb"><Link to="/">Folders</Link> / <Link to={`/folders/${folderId}`}>Back to invoices</Link></div>}

      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>{data.invoiceNumber ? `Invoice #${data.invoiceNumber}` : 'New invoice'}</h1>
        </div>
        <div className="toolbar-actions">
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 130 }}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
          <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={exporting}>{exporting ? 'Preparing PDF...' : 'Download PDF'}</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <div className="editor-layout">
        <div className="editor-form">
          <div className="card" style={{ marginBottom: 14 }}>
            <h2 className="section-title">Invoice details</h2>
            <div className="form-row">
              <div className="form-group"><label>Title</label><input value={data.title} onChange={(e) => set('title', e.target.value)} /></div>
              <div className="form-group"><label>Subtitle</label><input value={data.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Invoice No.</label><input value={data.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} /></div>
              <div className="form-group"><label>Currency</label>
                <select value={data.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option>AUD</option><option>USD</option><option>EUR</option><option>GBP</option><option>NZD</option><option>CAD</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Issue date</label><input type="date" value={data.issueDate} onChange={(e) => set('issueDate', e.target.value)} /></div>
              <div className="form-group"><label>Due date</label><input type="date" value={data.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Payment method</label><input value={data.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} /></div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <h2 className="section-title">Bill to</h2>
            <div className="form-group"><label>Client name</label><input value={data.billTo.name} onChange={(e) => set('billTo.name', e.target.value)} /></div>
            <div className="form-group"><label>Client address</label><textarea value={data.billTo.address} onChange={(e) => set('billTo.address', e.target.value)} placeholder={'Street\nSuburb, State, Postcode\nCountry'} /></div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <h2 className="section-title">From (your business)</h2>
            <div className="form-group"><label>Business name</label><input value={data.from.name} onChange={(e) => set('from.name', e.target.value)} /></div>
            <div className="form-group"><label>Address</label><textarea value={data.from.address} onChange={(e) => set('from.address', e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label>ABN / Business number</label><input value={data.from.abn} onChange={(e) => set('from.abn', e.target.value)} /></div>
              <div className="form-group"><label>Contact person</label><input value={data.from.contactPerson || ''} onChange={(e) => set('from.contactPerson', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input value={data.from.phone} onChange={(e) => set('from.phone', e.target.value)} /></div>
              <div className="form-group"><label>Email</label><input value={data.from.email} onChange={(e) => set('from.email', e.target.value)} /></div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <h2 className="section-title">Payment / bank details</h2>
            <div className="form-row">
              <div className="form-group"><label>Account holder</label><input value={data.bank.accountHolder} onChange={(e) => set('bank.accountHolder', e.target.value)} /></div>
              <div className="form-group"><label>Bank name</label><input value={data.bank.bankName} onChange={(e) => set('bank.bankName', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>BSB / Sort code</label><input value={data.bank.bsb} onChange={(e) => set('bank.bsb', e.target.value)} /></div>
              <div className="form-group"><label>Account number</label><input value={data.bank.accountNo} onChange={(e) => set('bank.accountNo', e.target.value)} /></div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <h2 className="section-title">Line items</h2>
            {data.items.map((item, i) => (
              <div key={i} className="line-item">
                <div className="form-group"><label>Description</label><input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} /></div>
                <div className="form-group"><label>Detail line (optional)</label><input value={item.subDescription} onChange={(e) => updateItem(i, 'subDescription', e.target.value)} placeholder="e.g. date range, notes" /></div>
                <div className="form-row">
                  <div className="form-group"><label>Quantity</label><input type="number" step="any" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} /></div>
                  <div className="form-group"><label>Unit price</label><input type="number" step="any" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} /></div>
                  <div className="form-group"><label>Discount %</label><input type="number" step="any" value={item.discountPercent} onChange={(e) => updateItem(i, 'discountPercent', e.target.value)} /></div>
                </div>
                {data.items.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItem(i)}>Remove item</button>}
                <hr className="item-sep" />
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add line item</button>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <h2 className="section-title">Tax &amp; notes</h2>
            <div className="form-row">
              <div className="form-group"><label>Tax label</label><input value={data.taxLabel} onChange={(e) => set('taxLabel', e.target.value)} placeholder="GST / VAT / Tax" /></div>
              <div className="form-group"><label>Tax rate %</label><input type="number" step="any" value={data.taxRate} onChange={(e) => set('taxRate', e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Notes</label><textarea value={data.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Terms, thank-you note, etc." /></div>
          </div>
        </div>

        <div className="editor-preview">
          <div className="preview-scroll">
            <InvoicePreview ref={previewRef} data={data} logoUrl={assetUrl(business?.logoUrl)} theme={business?.themeColors} />
          </div>
        </div>
      </div>
    </div>
  );
}
