export default function StatusMessage({ title, children, action, tone = 'neutral' }) {
  return (
    <div className={`status status--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <h2 className="status__title">{title}</h2>
      {children && <div className="status__body">{children}</div>}
      {action && <div className="status__action">{action}</div>}
    </div>
  );
}
