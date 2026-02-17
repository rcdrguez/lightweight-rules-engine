'use client';

import { useState } from 'react';

export type Connection = { source?: string; target?: string };

export function useNodesState<T>(initial: T[]) {
  const [nodes, setNodes] = useState(initial);
  return [nodes, setNodes, () => undefined] as const;
}

export function useEdgesState<T>(initial: T[]) {
  const [edges, setEdges] = useState(initial);
  return [edges, setEdges, () => undefined] as const;
}

export function addEdge<T>(edge: T, edges: T[]) {
  return [...edges, edge];
}

export function ReactFlow({ children }: { children?: React.ReactNode }) {
  return <div className="h-full w-full bg-slate-100">{children}</div>;
}

export function MiniMap() {
  return null;
}

export function Controls() {
  return null;
}

export function Background() {
  return null;
}
