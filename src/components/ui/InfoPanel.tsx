interface InfoPanelProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'info';
}

const VARIANT_MAP = {
  default: 'bg-gray-800 border-gray-700',
  warning: 'bg-yellow-900/30 border-yellow-700',
  info:    'bg-blue-900/30 border-blue-700',
};

export default function InfoPanel({ title, children, variant = 'default' }: InfoPanelProps) {
  return (
    <div className={`rounded-lg border p-4 ${VARIANT_MAP[variant]}`}>
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
      <div className="text-sm text-gray-400">{children}</div>
    </div>
  );
}
