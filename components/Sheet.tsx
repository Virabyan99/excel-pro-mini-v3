'use client';
import clsx from 'clsx';
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useStore, useStoreActions } from './StoreProvider';
import { useGridKeyboard } from '@/lib/useGridKeyboard';
import { useCellEditor } from '@/lib/useCellEditor';
import { throttle } from '@/lib/throttle';
import { getCalcWorker } from '@/lib/calcWorkerClient';
import * as Comlink from 'comlink';
import { ERROR_MAP, ErrorCode } from '@/constants/errors'; // Import error map
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; 

interface SheetProps {
  sheetId: string;
  className?: string;
}

interface Row {
  id: number;
  cells: string[];
}

const colHelper = createColumnHelper<Row>();

export function Sheet({ sheetId, className }: SheetProps) {
  const data = useStore((s) => s.rows);
  const selection = useStore((s) => s.selection);
  const colWidths = useStore((s) => s.colWidths);
  const rowHeights = useStore((s) => s.rowHeights);
  const cycles = useStore((s) => s.cycles);
  const { setSelection, setColWidth, setRowHeight, setCycles } = useStoreActions();
  const { editingCell, startEdit, commitEdit, handleKey } = useCellEditor();
  const numCols = data.length > 0 ? data[0].cells.length : 0;
  const headerHeight = 32;

  // Memoized row number column
  const rowNumberCol = useMemo<ColumnDef<Row>>(
    () => ({
      id: '#',
      header: () => null,
      cell: (ctx) => ctx.row.index + 1,
      size: colWidths[0] || 48,
      meta: { isRowHeader: true },
    }),
    [colWidths]
  );

  // Memoized data columns
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      rowNumberCol,
      ...Array.from({ length: numCols }, (_, c) =>
        colHelper.accessor((row) => row.cells[c], {
          id: String.fromCharCode(65 + c),
          header: () => String.fromCharCode(65 + c),
          cell: (ctx) => ctx.getValue() || '',
          size: colWidths[c + 1] || 128,
        })
      ),
    ],
    [numCols, colWidths, rowNumberCol]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const estimateColSize = useCallback(
    (index: number) => colWidths[index] ?? (index === 0 ? 48 : 128),
    [colWidths]
  );

  const estimateRowSize = useCallback(
    (index: number) => rowHeights[index] ?? 32,
    [rowHeights]
  );

  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: numCols + 1,
    estimateSize: estimateColSize,
    overscan: 10,
    getScrollElement: () => parentRef.current,
  });

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateRowSize,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualCols = colVirtualizer.getVirtualItems();

  const totalWidth = colVirtualizer.getTotalSize();
  const totalHeight = rowVirtualizer.getTotalSize() + headerHeight;

  useEffect(() => {
    colVirtualizer.measure();
  }, [colWidths, colVirtualizer]);

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowHeights, rowVirtualizer]);

  useGridKeyboard(data.length, numCols);

  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const setupCycleListener = async () => {
      const worker = await getCalcWorker();
      const listener = (ids: string[]) => {
        setCycles(ids);
      };
      worker.onCycle(Comlink.proxy(listener));
      return () => {
        worker.offCycle(Comlink.proxy(listener));
      };
    };
    setupCycleListener();
  }, [setCycles]);

  const handleColResize = (colIndex: number, e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colIndex] ?? columns[colIndex].size;
    let currentWidth = startWidth;

    const throttledSetColWidth = throttle((newWidth: number) => {
      currentWidth = newWidth;
      setColWidth(colIndex, newWidth);
    }, 16);

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(48, startWidth + (e.clientX - startX));
      throttledSetColWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setColWidth(colIndex, currentWidth);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleRowResize = (rowIndex: number, e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = rowHeights[rowIndex] ?? 32;
    let currentHeight = startHeight;

    const throttledSetRowHeight = throttle((newHeight: number) => {
      currentHeight = newHeight;
      setRowHeight(rowIndex, newHeight);
    }, 16);

    const onMouseMove = (e: MouseEvent) => {
      const newHeight = Math.max(24, startHeight + (e.clientY - startY));
      throttledSetRowHeight(newHeight);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setRowHeight(rowIndex, currentHeight);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const autoSizeCol = (colIndex: number) => {
    if (typeof window === 'undefined') return;
    const cells = document.querySelectorAll(`td[data-col='${colIndex}']`);
    let max = 48;
    cells.forEach((c) => {
      const w = (c as HTMLElement).scrollWidth + 16;
      if (w > max) max = w;
    });
    setColWidth(colIndex, max);
  };

  const autoSizeRow = (rowIndex: number) => {
    if (typeof window === 'undefined') return;
    const cells = document.querySelectorAll(`td[data-row='${rowIndex}']`);
    let max = 24;
    cells.forEach((c) => {
      const h = (c as HTMLElement).scrollHeight + 8;
      if (h > max) max = h;
    });
    setRowHeight(rowIndex, max);
  };

  const isSelected = (row: number, col: number) => {
    if (!selection.start || !selection.end || col === 0) return false;
    const dataCol = col - 1;
    const minRow = Math.min(selection.start.row, selection.end.row);
    const maxRow = Math.max(selection.start.row, selection.end.row);
    const minCol = Math.min(selection.start.col, selection.end.col);
    const maxCol = Math.max(selection.start.col, selection.end.col);
    return (
      row >= minRow && row <= maxRow && dataCol >= minCol && dataCol <= maxCol
    );
  };

  const isEditing = (row: number, col: number) =>
    col > 0 &&
    editingCell &&
    editingCell.row === row &&
    editingCell.col === col - 1;

  const handleMouseDown =
    (row: number, col: number) => (e: React.MouseEvent) => {
      if (col === 0) return;
      const dataCol = col - 1;
      if (e.shiftKey && selection.start) {
        setSelection({ start: selection.start, end: { row, col: dataCol } });
      } else {
        setSelection({
          start: { row, col: dataCol },
          end: { row, col: dataCol },
        });
        setIsSelecting(true);
      }
    };

  const handleMouseOver =
    (row: number, col: number) => (e: React.MouseEvent) => {
      if (isSelecting && col !== 0) {
        const dataCol = col - 1;
        setSelection({ start: selection.start!, end: { row, col: dataCol } });
      }
    };

  const handleMouseUp = () => setIsSelecting(false);

  return (
    <div
      className={clsx(
        'rounded-md border border-slate-200 bg-white',
        className
      )}
    >
      <div
        ref={parentRef}
        className="h-[500px] w-[95vw] overflow-auto"
        style={{ position: 'relative' }}
      >
        <div
          style={{
            height: totalHeight,
            width: totalWidth,
            position: 'relative',
          }}
        >
          <table
            className="text-sm select-none border-collapse"
            style={{ position: 'relative' }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  style={{ position: 'sticky', top: 0, zIndex: 20 }}
                >
                  {virtualCols.map((vc) => {
                    const header = headerGroup.headers[vc.index];
                    const isRowHeader = header.column.id === '#';
                    return (
                      <th
                        key={header.id}
                        className={clsx(
                          'border bg-slate-50 font-medium relative',
                          isRowHeader && 'sticky left-0 z-30'
                        )}
                        style={{
                          width: vc.size,
                          height: headerHeight,
                          position: 'absolute',
                          left: vc.start,
                          top: 0,
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {!isRowHeader && (
                          <div
                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-indigo-200 z-40"
                            style={{ transform: 'translateX(50%)' }}
                            onMouseDown={(e) => handleColResize(vc.index, e)}
                            onDoubleClick={() => autoSizeCol(vc.index)}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {virtualRows.map((vr) => {
                const row = table.getRowModel().rows[vr.index];
                return (
                  <tr
                    key={row.id}
                    style={{
                      height: vr.size,
                      position: 'absolute',
                      top: vr.start + headerHeight,
                      left: 0,
                      width: totalWidth,
                    }}
                  >
                    {virtualCols.map((vc) => {
                      const cell = row.getVisibleCells()[vc.index];
                      const rowIdx = row.index;
                      const colIdx = vc.index;
                      const isRowHeader =
                        cell.column.columnDef.meta?.isRowHeader;
                      const selected = isSelected(rowIdx, colIdx);
                      const editing = isEditing(rowIdx, colIdx);
                      const cellId = `R${rowIdx}C${colIdx - 1}`;
                      const hasCycle = cycles.has(cellId);
                      const value = cell.getValue() as string;
                      const errorCode = Object.keys(ERROR_MAP).find(
                        (code) => value === code
                      ) as ErrorCode | undefined;
                      const isError = !!errorCode;

                      return (
                        <td
                          key={cell.id}
                          className={clsx(
                            'border text-center relative',
                            isRowHeader && 'sticky left-0 z-10 bg-slate-50',
                            selected && 'outline outline-2 outline-indigo-500',
                            hasCycle && 'bg-red-100',
                            isError && 'bg-error-50 text-error-600 font-semibold'
                          )}
                          style={{
                            width: vc.size,
                            height: vr.size,
                            position: 'absolute',
                            left: vc.start,
                          }}
                          onMouseDown={handleMouseDown(rowIdx, colIdx)}
                          onMouseOver={handleMouseOver(rowIdx, colIdx)}
                          onMouseUp={handleMouseUp}
                          onDoubleClick={() =>
                            !isRowHeader && startEdit(rowIdx, colIdx - 1)
                          }
                          data-row={rowIdx}
                          data-col={colIdx}
                          title={isError ? ERROR_MAP[errorCode!] : (hasCycle ? '#CYCLE!' : undefined)}
                          aria-label={isError ? `Error ${value}` : undefined}
                        >
                          {hasCycle && (
                            <span className="absolute right-0 top-0 w-0 h-0 border-t-4 border-r-4 border-red-600" />
                          )}
                          {editing ? (
                            <input
                              className="w-full h-full text-center outline-none"
                              defaultValue={String(cell.getValue())}
                              autoFocus
                              onBlur={(e) =>
                                commitEdit(
                                  rowIdx,
                                  colIdx - 1,
                                  e.currentTarget.value
                                )
                              }
                              onKeyDown={(e) =>
                                handleKey(e, rowIdx, colIdx - 1)
                              }
                            />
                          ) : (
                            <>
                              {isError ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>{value}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {ERROR_MAP[errorCode!]}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )
                              )}
                            </>
                          )}
                          {isRowHeader && (
                            <div
                              className="absolute bottom-[-2px] left-0 w-full h-4 cursor-row-resize bg-transparent hover:bg-indigo-200 z-40"
                              onMouseDown={(e) => handleRowResize(rowIdx, e)}
                              onDoubleClick={() => autoSizeRow(rowIdx)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="p-2 text-xs text-slate-400">sheetId: {sheetId}</p>
    </div>
  );
}