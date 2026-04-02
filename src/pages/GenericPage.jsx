import { useCRM } from '../context/CRMContext';

export default function GenericPage({ title, icon, description }) {
  const { showToast } = useCRM();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <i className={`fa-solid ${icon || 'fa-circle-info'}`}></i>
          <h3>{title}</h3>
          <p>{description || 'This feature is coming soon.'}</p>
          <button className="btn-primary" onClick={() => showToast(`${title} setup is coming soon.`, 'info')}>
            <i className="fa-solid fa-plus"></i> Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
