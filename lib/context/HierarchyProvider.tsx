"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// ─── Types ──────────────────────────────────────────────────────────

export interface HierarchyNodeInfo {
  nodeId: string;        // 'GLOBAL' or the actual HierarchyEntity ID
  nodeName: string;       // 'الجمهورية كاملة' or the governorate name
  nodeType: 'GLOBAL' | 'GOVERNORATE' | 'DEPARTMENT' | 'SECTION' | 'UNIT';
}

interface HierarchyProviderState {
  /** The currently active hierarchy node. 'GLOBAL' means entire republic. */
  activeNode: HierarchyNodeInfo;
  /** Update the active node. This triggers re-fetch in all subscribed widgets. */
  setActiveNode: (node: HierarchyNodeInfo) => void;
  /** Convenience: reset to GLOBAL (entire republic). */
  resetToGlobal: () => void;
}

// ─── Default GLOBAL node ────────────────────────────────────────────

export const GLOBAL_NODE: HierarchyNodeInfo = {
  nodeId: 'GLOBAL',
  nodeName: 'الجمهورية كاملة',
  nodeType: 'GLOBAL',
};

// ─── Context ────────────────────────────────────────────────────────

const HierarchyContext = createContext<HierarchyProviderState | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────

export function HierarchyProvider({ children }: { children: ReactNode }) {
  const [activeNode, setActiveNodeState] = useState<HierarchyNodeInfo>(GLOBAL_NODE);

  const setActiveNode = useCallback((node: HierarchyNodeInfo) => {
    setActiveNodeState(node);
  }, []);

  const resetToGlobal = useCallback(() => {
    setActiveNodeState(GLOBAL_NODE);
  }, []);

  const value = useMemo<HierarchyProviderState>(
    () => ({ activeNode, setActiveNode, resetToGlobal }),
    [activeNode, setActiveNode, resetToGlobal],
  );

  return (
    <HierarchyContext.Provider value={value}>
      {children}
    </HierarchyContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useHierarchySelection(): HierarchyProviderState {
  const context = useContext(HierarchyContext);
  if (!context) {
    throw new Error(
      'useHierarchySelection must be used within a <HierarchyProvider>. ' +
      'Wrap your dashboard layout with HierarchyProvider.'
    );
  }
  return context;
}
