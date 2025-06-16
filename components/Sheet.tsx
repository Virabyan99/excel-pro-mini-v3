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

export function Sheet({ sheetId, className }: SheetProps) {
  const data = useStore((s) => s.rows);
  const numCols = data.length > 0 ? data[0].cells.length : 0;

  // Dynamically generate columns based on data
  const columns: ColumnDef<{ id: number; cells: string[] }>[] = Array.from(
    { length: numCols },
    (_, c) =>
      colHelper.accessor((row) => row.cells[c], {
        id: `col-${c}`,
        header: () => `Col ${c + 1}`,
        cell: (ctx) => ctx.getValue(),
      })
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);

  // Row virtualizer (unchanged)
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // Matches h-8 (32px) row height
    overscan: 5,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  // Column virtualizer (new)
  const colCount = table.getAllColumns().length;
  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: colCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 128, // Fixed column width
    overscan: 3,
  });
  const virtualCols = colVirtualizer.getVirtualItems();
  const totalWidth = colVirtualizer.getTotalSize();

  return (
    <div className={clsx('rounded-md border border-slate-200 bg-white', className)}>
      {/* Scroll container */}
      <div ref={parentRef} className="h-[500px] w-[95vw] overflow-auto">
        <table
          className="text-sm select-none border-collapse"
          style={{ height: totalHeight, width: totalWidth }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ position: 'relative', height: 32 }}>
                {virtualCols.map((vc) => {
                  const header = headerGroup.headers[vc.index];
                  return (
                    <th
                      key={header.id}
                      className="border border-slate-200 bg-slate-50 font-medium absolute top-0"
                      style={{ left: vc.start, width: vc.size }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
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
                  {virtualCols.map((vc) => {
                    const cell = row.getVisibleCells()[vc.index];
                    return (
                      <td
                        key={cell.id}
                        className="border border-slate-100 text-center absolute"
                        style={{ left: vc.start, width: vc.size, height: vr.size }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
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