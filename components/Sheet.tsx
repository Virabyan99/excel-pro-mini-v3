import clsx from 'clsx';
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useStore } from './StoreProvider';

interface SheetProps {
  sheetId: string;
  className?: string;
}

const colHelper = createColumnHelper<{ id: number; cells: string[] }>();

// Define 10 columns (A-J)
const columns: ColumnDef<{ id: number; cells: string[] }>[] = Array.from(
  { length: 10 },
  (_, c) =>
    colHelper.accessor((row) => row.cells[c], {
      id: String.fromCharCode(65 + c),
      header: () => String.fromCharCode(65 + c),
      cell: (ctx) => ctx.getValue(),
    })
);

export function Sheet({ sheetId, className }: SheetProps) {
  const data = useStore((s) => s.rows);
  const estimatedRowHeight = 32; // Placeholder for virtualisation later

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={clsx('rounded-md border border-slate-200 bg-white', className)}>
      <table className="w-full border-collapse text-sm select-none">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="h-8 border border-slate-200 bg-slate-50 font-medium"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="h-8 border border-slate-100 text-center">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
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