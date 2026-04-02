import { useCRM } from '../context/CRMContext';
import { fmtINR } from '../data/store';

export default function Commerce({ view = 'overview' }) {
  const { store, deleteRecord, showToast } = useCRM();

  const sections = {
    overview: <CommerceOverview store={store} />,
    products: <Products store={store} deleteRecord={deleteRecord} showToast={showToast} />,
    quotes: <Quotes store={store} deleteRecord={deleteRecord} showToast={showToast} />,
    orders: <Orders store={store} />,
    invoices: <Invoices store={store} />,
    payments: <Payments store={store} />,
    subscriptions: <Subscriptions store={store} />,
  };

  return sections[view] || sections.overview;
}

function CommerceOverview({ store }) {
  const totalRevenue = (store.payments||[]).filter(p=>p.status==='Completed').reduce((s,p)=>s+p.amount,0);
  const pendingInvoices = (store.invoices||[]).filter(i=>i.status==='Pending').reduce((s,i)=>s+i.amount,0);
  const activeSubscriptions = (store.subscriptions||[]).filter(s=>s.status==='Active').length;

  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Commerce Overview</h1></div></div>
      <div className="stats-grid">
        {[
          { label:'Total Revenue', value:fmtINR(totalRevenue), icon:'fa-coins', color:'#2ecc71' },
          { label:'Pending Invoices', value:fmtINR(pendingInvoices), icon:'fa-file-invoice', color:'#f39c12' },
          { label:'Active Subscriptions', value:activeSubscriptions, icon:'fa-rotate', color:'#3498db' },
          { label:'Total Products', value:(store.products||[]).length, icon:'fa-box', color:'#9b59b6' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div className="stat-icon" style={{background:k.color+'22',color:k.color}}><i className={`fa-solid ${k.icon}`}></i></div>
            <div className="stat-body"><div className="stat-value">{k.value}</div><div className="stat-label">{k.label}</div></div>
          </div>
        ))}
      </div>
      <div className="dashboard-bottom">
        <div className="card">
          <div className="card-header"><h3>Recent Orders</h3></div>
          <div className="table-responsive">
            <div className="table-container">
<table className="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{(store.orders||[]).map(o=><tr key={o.id}><td>{o.number}</td><td>{o.customer}</td><td>{o.product}</td><td>{fmtINR(o.amount)}</td><td><span className={`badge badge-${o.status.toLowerCase().replace(' ','-')}`}>{o.status}</span></td></tr>)}</tbody>
            </table>
</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Recent Payments</h3></div>
          <div className="table-responsive">
            <div className="table-container">
<table className="data-table"><thead><tr><th>Ref</th><th>From</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>{(store.payments||[]).map(p=><tr key={p.id}><td>{p.ref}</td><td>{p.from}</td><td>{fmtINR(p.amount)}</td><td>{p.method}</td><td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td></tr>)}</tbody>
            </table>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Products({ store, deleteRecord, showToast }) {
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Products</h1></div></div>
      <div className="card">
        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{(store.products||[]).map(p => (
              <tr key={p.id}><td><strong>{p.name}</strong><br/><small>{p.description}</small></td><td style={{fontFamily:'monospace'}}>{p.sku}</td><td>{p.category}</td><td>{fmtINR(p.price)}</td><td>{p.stock}</td>
                <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                <td><button className="action-btn danger" onClick={()=>{if(window.confirm('Delete?')){deleteRecord('products',p.id);showToast('Product deleted');}}}><i className="fa-solid fa-trash"></i></button></td>
              </tr>
            ))}</tbody>
          </table>
</div>
        </div>
      </div>
    </div>
  );
}

function Quotes({ store, deleteRecord, showToast }) {
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Quotes</h1></div></div>
      <div className="card">
        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead><tr><th>Quote #</th><th>Contact</th><th>Company</th><th>Amount</th><th>Status</th><th>Created</th><th>Expiry</th><th>Owner</th><th>Actions</th></tr></thead>
            <tbody>{(store.quotes||[]).map(q => (
              <tr key={q.id}><td style={{fontFamily:'monospace'}}>{q.title}</td><td>{q.contact}</td><td>{q.company}</td><td>{fmtINR(q.amount)}</td>
                <td><span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span></td>
                <td>{q.created}</td><td>{q.expiry}</td><td>{q.owner}</td>
                <td><button className="action-btn danger" onClick={()=>{if(window.confirm('Delete?')){deleteRecord('quotes',q.id);showToast('Quote deleted');}}}><i className="fa-solid fa-trash"></i></button></td>
              </tr>
            ))}</tbody>
          </table>
</div>
        </div>
      </div>
    </div>
  );
}

function Orders({ store }) {
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Orders</h1></div></div>
      <div className="card">
        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead><tr><th>Order #</th><th>Customer</th><th>Contact</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{(store.orders||[]).map(o => (
              <tr key={o.id}><td style={{fontFamily:'monospace'}}>{o.number}</td><td>{o.customer}</td><td>{o.contact}</td><td>{o.product}</td><td>{fmtINR(o.amount)}</td>
                <td><span className={`badge badge-${o.status.toLowerCase().replace(' ','-')}`}>{o.status}</span></td><td>{o.date}</td>
              </tr>
            ))}</tbody>
          </table>
</div>
        </div>
      </div>
    </div>
  );
}

function Invoices({ store }) {
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Invoices</h1></div></div>
      <div className="card">
        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead><tr><th>Invoice #</th><th>Contact</th><th>Company</th><th>Amount</th><th>Status</th><th>Due Date</th><th>Issued</th></tr></thead>
            <tbody>{(store.invoices||[]).map(i => (
              <tr key={i.id}><td style={{fontFamily:'monospace'}}>{i.number}</td><td>{i.contact}</td><td>{i.company}</td><td>{fmtINR(i.amount)}</td>
                <td><span className={`badge badge-${i.status.toLowerCase()}`}>{i.status}</span></td><td>{i.due}</td><td>{i.issued}</td>
              </tr>
            ))}</tbody>
          </table>
</div>
        </div>
      </div>
    </div>
  );
}

function Payments({ store }) {
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Payments</h1></div></div>
      <div className="card">
        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead><tr><th>Ref</th><th>From</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{(store.payments||[]).map(p => (
              <tr key={p.id}><td style={{fontFamily:'monospace'}}>{p.ref}</td><td>{p.from}</td><td>{fmtINR(p.amount)}</td><td>{p.method}</td>
                <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td><td>{p.date}</td>
              </tr>
            ))}</tbody>
          </table>
</div>
        </div>
      </div>
    </div>
  );
}

function Subscriptions({ store }) {
  return (
    <div className="page">
      <div className="page-header"><div><h1 className="page-title">Subscriptions</h1></div></div>
      <div className="card">
        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead><tr><th>Customer</th><th>Plan</th><th>Amount</th><th>Billing</th><th>Status</th><th>Next Renewal</th></tr></thead>
            <tbody>{(store.subscriptions||[]).map(s => (
              <tr key={s.id}><td><strong>{s.customer}</strong></td><td>{s.plan}</td><td>{fmtINR(s.amount)}/mo</td><td>{s.billing}</td>
                <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td><td>{s.renewal}</td>
              </tr>
            ))}</tbody>
          </table>
</div>
        </div>
      </div>
    </div>
  );
}
