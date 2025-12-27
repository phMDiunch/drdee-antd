"use client";

import { useMemo, useState, useCallback } from "react";
import { KanbanColumnDef, ColumnMetadata } from "../types";

interface UseKanbanDataOptions<T> {
  initialData: T[];
  columns: KanbanColumnDef[];
  groupByField: keyof T;
  filterFn?: (item: T, searchTerm: string) => boolean;
}

export function useKanbanData<T extends { id: string }>({
  initialData,
  columns,
  groupByField,
  filterFn,
}: UseKanbanDataOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnMetadata, setColumnMetadata] = useState<Record<string, ColumnMetadata>>({});

  // Group data by column keys
  const groupedData = useMemo(() => {
    const filtered = searchTerm && filterFn 
      ? data.filter(item => filterFn(item, searchTerm)) 
      : data;

    const groups: Record<string, T[]> = {};
    columns.forEach((col) => {
      groups[col.key] = filtered.filter((item) => String(item[groupByField]) === col.key);
    });
    return groups;
  }, [data, columns, groupByField, searchTerm, filterFn]);

  // Update a single item's status (used after drag end)
  const updateItemStatus = useCallback((itemId: string, newStatus: string) => {
    setData(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, [groupByField]: newStatus } 
        : item
    ));
  }, [groupByField]);

  // Refresh or set full data
  const refreshData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  // Append data (used for Load More)
  const appendData = useCallback((newData: T[]) => {
    setData(prev => {
      // Avoid duplicates
      const existingIds = new Set(prev.map(i => i.id));
      const filteredNew = newData.filter(i => !existingIds.has(i.id));
      return [...prev, ...filteredNew];
    });
  }, []);

  return {
    data,
    groupedData,
    searchTerm,
    setSearchTerm,
    columnMetadata,
    setColumnMetadata,
    updateItemStatus,
    refreshData,
    appendData,
  };
}
