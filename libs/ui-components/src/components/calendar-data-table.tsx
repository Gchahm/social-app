'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import * as React from 'react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function CalendarDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  return (
    <div className="flex h-full flex-shrink overflow-hidden rounded-md border">
      <Table className="border-collapse h-full">
        <TableHeader className="sticky top-0 z-20">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="bg-muted text-muted-foreground border border-border sticky top-0 z-20"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="odd:bg-secondary"
              >
                {row.getVisibleCells().map((cell) => {
                  const meta: any = cell.column.columnDef.meta as any;
                  const ctx = cell.getContext();
                  const extraClass =
                    typeof meta?.cellClassName === 'function'
                      ? meta.cellClassName(ctx)
                      : meta?.cellClassName;
                  const extraStyle =
                    typeof meta?.cellStyle === 'function'
                      ? meta.cellStyle(ctx)
                      : meta?.cellStyle;
                  const extraTitle =
                    typeof meta?.cellTitle === 'function'
                      ? meta.cellTitle(ctx)
                      : meta?.cellTitle;

                  return (
                    <TableCell
                      key={cell.id}
                      className={`border border-border ${extraClass ?? ''}`}
                      style={extraStyle}
                      title={extraTitle}
                    >
                      {flexRender(cell.column.columnDef.cell, ctx)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
