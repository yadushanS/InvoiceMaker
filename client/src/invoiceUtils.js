export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultInvoiceData(business) {
  return {
    title: 'Invoice',
    subtitle: 'Tax invoice',
    invoiceNumber: '',
    issueDate: todayISO(),
    dueDate: '',
    paymentMethod: 'Bank transfer',
    currency: 'AUD',
    billTo: { name: '', address: '' },
    from: {
      name: business?.name || '',
      address: business?.address || '',
      abn: business?.abn || '',
      phone: business?.phone || '',
      email: business?.contactEmail || '',
    },
    bank: {
      accountHolder: business?.bankAccountHolder || '',
      bankName: business?.bankName || '',
      bsb: business?.bankBsb || '',
      accountNo: business?.bankAccountNo || '',
    },
    items: [{ description: '', subDescription: '', quantity: 1, unitPrice: 0, discountPercent: 0 }],
    taxLabel: 'GST',
    taxRate: 10,
    notes: '',
  };
}

export function lineTotal(item) {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unitPrice) || 0;
  const discount = Number(item.discountPercent) || 0;
  return qty * price * (1 - discount / 100);
}

export function computeTotals(data) {
  const items = data.items || [];
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const taxRate = Number(data.taxRate) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export function formatMoney(amount, currency) {
  const value = Number(amount) || 0;
  const symbol = currency === 'AUD' || currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency || ''} `;
  return `${symbol}${value.toFixed(2)}`;
}

export function formatDateDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${Number(d)}/${Number(m)}/${y}`;
}
