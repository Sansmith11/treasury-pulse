import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export default function TransactionsTableModal({ isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      });
      if (search) params.append('search', search);
      if (selectedDirection) params.append('direction', selectedDirection);
      if (selectedProduct) params.append('product_type', selectedProduct);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(data.records || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, page, selectedDirection, selectedProduct]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  if (!isOpen) return null;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1100px', padding: '24px' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px', borderBottom: '1px solid #1e2f52', paddingBottom: '12px' }}>
          <div className="flex items-center gap-3">
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f1f5f9' }}>
                Synthetic Transaction Ledger Explorer
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Full Data Dictionary: 50,000 corporate records, 12-month horizon, 8 entities, 10+ currencies
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex items-center justify-between gap-3" style={{ marginBottom: '16px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input 
                type="text" 
                placeholder="Search counterparty (Siemens, Apple...), txn ID, account..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '8px 14px' }}>
              Filter
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select 
              value={selectedDirection} 
              onChange={(e) => { setSelectedDirection(e.target.value); setPage(1); }}
            >
              <option value="">All Flows</option>
              <option value="Inflow">Inflow Only</option>
              <option value="Outflow">Outflow Only</option>
            </select>

            <select 
              value={selectedProduct} 
              onChange={(e) => { setSelectedProduct(e.target.value); setPage(1); }}
            >
              <option value="">All Products</option>
              <option value="Customer Receipt">Customer Receipt</option>
              <option value="Supplier Payment">Supplier Payment</option>
              <option value="Payroll">Payroll</option>
              <option value="Tax">Tax</option>
              <option value="Capex">Capex</option>
              <option value="Treasury Loan">Treasury Loan</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #1e2f52', borderRadius: '10px', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0c1526', color: '#94a3b8', borderBottom: '1px solid #1e2f52' }}>
                <th style={{ padding: '10px 12px' }}>Txn ID</th>
                <th style={{ padding: '10px 12px' }}>Date</th>
                <th style={{ padding: '10px 12px' }}>Entity</th>
                <th style={{ padding: '10px 12px' }}>Product</th>
                <th style={{ padding: '10px 12px' }}>Counterparty</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Rating</th>
                <th style={{ padding: '10px 12px' }}>Direction</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No matching transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.transaction_id} style={{ borderBottom: '1px solid rgba(30, 47, 82, 0.3)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>
                      {t.transaction_id}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>
                      {t.transaction_date}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f1f5f9' }}>
                      {t.Entity}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>
                      {t.product_type}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#f1f5f9' }}>
                      {t.Counterparty}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span className={`badge ${t.counterparty_risk_rating === 'A' ? 'badge-green' : t.counterparty_risk_rating === 'B' ? 'badge-blue' : t.counterparty_risk_rating === 'C' ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {t.counterparty_risk_rating}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${t.Direction === 'Inflow' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {t.Direction}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'JetBrains Mono', color: t.Direction === 'Inflow' ? '#10b981' : '#f87171' }}>
                      {t.Direction === 'Inflow' ? '+' : '-'}{Number(t.original_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t.Currency}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: '11px', color: t.settlement_status === 'Settled' ? '#10b981' : '#f59e0b' }}>
                        {t.settlement_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between" style={{ fontSize: '12px', color: '#94a3b8' }}>
          <span>Showing page {page} of {totalPages || 1} ({total.toLocaleString()} total transactions)</span>
          <div className="flex items-center gap-2">
            <button 
              className="btn btn-secondary" 
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '4px 8px' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button 
              className="btn btn-secondary" 
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '4px 8px' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
