import clsx from 'clsx';

interface SheetProps {
  sheetId: string;
  className?: string;
}

export function Sheet({ sheetId, className }: SheetProps) {
  const rows = 20;
  const cols = 10;

  return (
    <div className={clsx('rounded-md border border-slate-200 bg-white', className)}>
      <table className="w-full border-collapse text-sm select-none">
        <tbody>
          {[...Array(rows)].map((_, r) => (
            <tr key={r}>
              {[...Array(cols)].map((_, c) => (
                <td
                  key={c}
                  className="h-8 w-32 border border-slate-100 text-center text-slate-500"
                >
                  {String.fromCharCode(65 + c)}
                  {r + 1}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="p-2 text-xs text-slate-400">sheetId: {sheetId}</p>
    </div>
  );
}