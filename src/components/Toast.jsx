import { useCRM } from '../context/CRMContext';
export default function Toast() {
  const { toast } = useCRM();
  if (!toast) return null;
  return (
    <div className={`toast show ${toast.type || 'success'}`}>
      {toast.type === 'success' && <i className="fa fa-check-circle" style={{marginRight:8}}/>}
      {toast.type === 'error'   && <i className="fa fa-times-circle" style={{marginRight:8}}/>}
      {toast.type === 'warning' && <i className="fa fa-exclamation-triangle" style={{marginRight:8}}/>}
      {toast.type === 'info'    && <i className="fa fa-info-circle" style={{marginRight:8}}/>}
      {toast.msg}
    </div>
  );
}
