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
import { useRef, useState } from 'react';
import { useStore, useStoreActions } from './StoreProvider';
import { useGridKeyboard } from '@/lib/useGridKeyboard';

interface SheetProps {
  sheetId: string;
  className?: string;
}

const colHelper = createColumnHelper<{ id: number; cells: string[] }>();

export function Sheet({ sheetId, className }: SheetProps) {
  const data = useStore((s) => s.rows);
  const selection = useStore((s) => s.selection);
  const { setSelection } = useStoreActions();
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

  // Row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 5,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  // Column virtualizer
  const colCount = table.getAllColumns().length;
  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: colCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 128,
    overscan: 3,
  });
  const virtualCols = colVirtualizer.getVirtualItems();
  const totalWidth = colVirtualizer.getTotalSize();

  // Keyboard navigation
  useGridKeyboard(data.length, numCols);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);

  const handleMouseDown = (row: number, col: number) => (e: React.MouseEvent) => {
    if (e.shiftKey && selection.start) {
      // Extend selection with Shift+Click
      setSelection({ start: selection.start, end: { row, col } });
    } else {
      // Start new selection
      setSelection({ start: { row, col }, end: { row, col } });
      setIsSelecting(true);
    }
  };

  const handleMouseOver = (row: number, col: number) => (e: React.MouseEvent) => {
    if (isSelecting) {
      setSelection({ start: selection.start!, end: { row, col } });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // Helper to determine if a cell is in the selected range
  const isSelected = (row: number, col: number) => {
    if (!selection.start || !selection.end) return false;
    const minRow = Math.min(selection.start.row, selection.end.row);
    const maxRow = Math.max(selection.start.row, selection.end.row);
    const minCol = Math.min(selection.start.col, selection.end.col);
    const maxCol = Math.max(selection.start.col, selection.end.col);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  return (
    <div className={clsx('rounded-md border border-slate-200 bg-white', className)}>
      {/* Scroll container */}
      <div ref={parentRef} className="h-[500px] w-[95vw] overflow-auto">
        <table
          role="grid"
          className="text-sm select-none border-collapse"
          style={{ height: totalHeight, width: totalWidth }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} role="row" style={{ position: 'relative', height: 32 }}>
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
                  role="row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    transform: `translateY(${vr.start}px)`,
                    height: vr.size,
                  }}
                >
                  {virtualCols.map((vc) => {
                    const cell = row.getVisibleCells()[vc.index];
                    const selected = isSelected(row.index, cell.column.getIndex());
                    return (
                      <td
                        key={cell.id}
                        role="gridcell"
                        aria-selected={selected}
                        className={clsx(
                          'border border-slate-100 text-center absolute',
                          selected && 'bg-indigo-100 ring-2 ring-indigo-500 ring-inset'
                        )}
                        style={{ left: vc.start, width: vc.size, height: vr.size }}
                        onMouseDown={handleMouseDown(row.index, cell.column.getIndex())}
                        onMouseOver={handleMouseOver(row.index, cell.column.getIndex())}
                        onMouseUp={handleMouseUp}
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