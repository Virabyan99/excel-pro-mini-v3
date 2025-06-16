"use client";
import clsx from 'clsx';
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
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
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // Matches h-8 (32px) row height
    overscan: 5, // Renders 5 extra rows above/below viewport
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div className={clsx('rounded-md border border-slate-200 bg-white', className)}>
      {/* Scroll container */}
      <div ref={parentRef} className="h-[500px] w-[95vw] overflow-auto">
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
          <tbody style={{ position: 'relative', height: totalHeight }}>
            {virtualRows.map((vr) => {
              const row = table.getRowModel().rows[vr.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    transform: `translateY(${vr.start}px)`,
                    height: vr.size,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="h-8 border border-slate-100 text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="p-2 text-xs text-slate-400">sheetId: {sheetId}</p>
    </div>
  );
}