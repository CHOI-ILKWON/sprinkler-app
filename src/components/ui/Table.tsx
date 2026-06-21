interface TableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  className?: string;
}

export default function Table({ headers, rows, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-700">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-gray-300 font-semibold border border-gray-600 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-gray-300 border border-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
