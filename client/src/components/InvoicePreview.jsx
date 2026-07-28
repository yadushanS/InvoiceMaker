import React, { forwardRef } from 'react';
import { computeTotals, formatMoney, formatDateDisplay, lineTotal } from '../invoiceUtils.js';
import './InvoicePreview.css';

const iconProps = {
  width: 13,
  height: 13,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5.5 4h3l1.5 4.5-2 1.6a11 11 0 0 0 5.9 5.9l1.6-2 4.5 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 4 6.6 1.5 1.5 0 0 1 5.5 4Z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" />
      <path d="M4.5 6.5 12 12.5l7.5-6" />
    </svg>
  );
}

const InvoicePreview = forwardRef(function InvoicePreview({ data, logoUrl, theme }, ref) {
  const { subtotal, taxAmount, total } = computeTotals(data);
  const items = data.items || [];
  const t = theme || { primary: '#c0392b', dark: '#2b2b2b', light: '#f5f5f5', accentText: '#ffffff' };

  const style = {
    '--inv-primary': t.primary,
    '--inv-dark': t.dark,
    '--inv-light': t.light,
    '--inv-accent-text': t.accentText || '#ffffff',
  };

  return (
    <div className="invoice-page" ref={ref} style={style}>
      <div className="invoice-header">
        <div>
          <h1 className="invoice-title">{data.title || 'Invoice'}</h1>
          <div className="invoice-subtitle">{data.subtitle || 'Tax invoice'}</div>
        </div>
        {logoUrl && (
          <div className="invoice-logo">
            <img src={logoUrl} alt="logo" />
          </div>
        )}
      </div>

      <div className="invoice-from-line">
        <strong>{data.from?.name}</strong>{data.from?.address ? `, ${data.from.address}` : ''}
      </div>

      <div className="invoice-meta-row">
        <div className="bill-to">
          <div className="label">Bill To</div>
          <div className="bold">{data.billTo?.name}</div>
          <div className="multiline">{data.billTo?.address}</div>
        </div>
        <div className="invoice-fields">
          <div className="field-row"><span className="label">Invoice No.:</span><span className="bold">{data.invoiceNumber}</span></div>
          <div className="field-row"><span className="label">Issue date:</span><span className="bold">{formatDateDisplay(data.issueDate)}</span></div>
          <div className="field-row"><span className="label">Due date:</span><span className="bold">{formatDateDisplay(data.dueDate)}</span></div>
          <div className="field-row"><span className="label">Payment method:</span><span className="bold">{data.paymentMethod}</span></div>
        </div>
      </div>

      <div className="invoice-bar">
        <div className="bar-box primary">
          <div className="bar-label">Account No.</div>
          <div className="bar-value">{data.bank?.accountNo || '—'}</div>
        </div>
        <div className="bar-box primary">
          <div className="bar-label">BSB</div>
          <div className="bar-value">{data.bank?.bsb || '—'}</div>
        </div>
        <div className="bar-box primary">
          <div className="bar-label">Due date</div>
          <div className="bar-value">{formatDateDisplay(data.dueDate) || '—'}</div>
        </div>
        <div className="bar-box dark">
          <div className="bar-label">Total due ({data.currency})</div>
          <div className="bar-value">{formatMoney(total, data.currency)}</div>
        </div>
      </div>

      <table className="invoice-table">
        <thead>
          <tr>
            <th className="col-desc">Description</th>
            <th className="col-num">Quantity</th>
            <th className="col-num">Unit price ($)</th>
            <th className="col-num">Discount %</th>
            <th className="col-num">Amount ($)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <React.Fragment key={i}>
              <tr>
                <td className="col-desc">{item.description}</td>
                <td className="col-num">{item.quantity}</td>
                <td className="col-num">{Number(item.unitPrice || 0).toFixed(2)}</td>
                <td className="col-num">{Number(item.discountPercent || 0).toFixed(2)}</td>
                <td className="col-num">{lineTotal(item).toFixed(2)}</td>
              </tr>
              {item.subDescription && (
                <tr className="sub-row">
                  <td className="col-desc sub-desc" colSpan={5}>{item.subDescription}</td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="invoice-totals">
        <div className="totals-row"><span>Subtotal:</span><span>{formatMoney(subtotal, data.currency)}</span></div>
        <div className="totals-row"><span>{data.taxLabel || 'Tax'} {data.taxRate || 0}% <em>from {formatMoney(subtotal, data.currency)}</em></span><span>{formatMoney(taxAmount, data.currency)}</span></div>
        <div className="totals-row totals-final"><span>Total ({data.currency}):</span><span>{formatMoney(total, data.currency)}</span></div>
      </div>

      {data.notes && (
        <div className="invoice-notes">{data.notes}</div>
      )}

      <div className="invoice-footer">
        <div className="footer-contact">
          {data.from?.contactPerson && <span><UserIcon /> {data.from.contactPerson}</span>}
          {data.from?.phone && <span><PhoneIcon /> {data.from.phone}</span>}
          {data.from?.email && <span><MailIcon /> {data.from.email}</span>}
        </div>
        <div className="footer-bottom">
          <div className="footer-business">
            <strong>{data.from?.name}</strong>
            {data.from?.abn && <div>ABN: {data.from.abn}</div>}
            <div className="multiline">{data.from?.address}</div>
          </div>
          <div className="footer-bank">
            {data.bank?.accountHolder && <div>Account holder: <strong>{data.bank.accountHolder}</strong></div>}
            {data.bank?.bankName && <div>Bank: <strong>{data.bank.bankName}</strong> BSB: <strong>{data.bank.bsb}</strong></div>}
            {data.bank?.accountNo && <div>Account No.: <strong>{data.bank.accountNo}</strong></div>}
          </div>
        </div>
      </div>
    </div>
  );
});

export default InvoicePreview;
