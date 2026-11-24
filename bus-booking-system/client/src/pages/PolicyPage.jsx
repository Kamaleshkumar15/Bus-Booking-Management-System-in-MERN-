export default function PolicyPage({ title, sections = [] }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="premium-card p-8 space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">{title}</h1>
        <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-bold text-base text-slate-900 mb-1">{s.heading}</h2>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
