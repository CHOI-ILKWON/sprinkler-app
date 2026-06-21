interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

const COLOR_MAP = {
  blue:   'bg-blue-900/50 text-blue-300 border border-blue-700',
  green:  'bg-green-900/50 text-green-300 border border-green-700',
  yellow: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
  red:    'bg-red-900/50 text-red-300 border border-red-700',
  purple: 'bg-purple-900/50 text-purple-300 border border-purple-700',
  gray:   'bg-gray-700 text-gray-300 border border-gray-600',
};

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${COLOR_MAP[color]}`}>
      {children}
    </span>
  );
}
