
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CompareContextType {
  selectedIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  isMaxSelected: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleCompare = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const clearCompare = () => setSelectedIds([]);

  const isMaxSelected = selectedIds.length >= 3;

  return (
    <CompareContext.Provider value={{ selectedIds, toggleCompare, clearCompare, isMaxSelected }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
