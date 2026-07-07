"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { ListChecks, ChevronRight, ChevronDown, Building2, Shield, Loader2 } from 'lucide-react';

interface NodeItem {
    id: string;
    label: string;
    type: 'GOVERNORATE' | 'SECTOR' | 'DEPARTMENT' | 'SECTION' | 'UNIT';
    children?: NodeItem[];
    status: 'ACTIVE' | 'STANDBY' | 'ALERT' | 'OFFLINE';
}

interface HierarchyNavigatorProps {
    nodes?: NodeItem[];
    isLoading?: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
    GOVERNORATE: Shield,
    SECTOR: Building2,
    DEPARTMENT: Building2,
    SECTION: ListChecks,
    UNIT: ListChecks,
};

function TreeNode({ node, depth = 0 }: { node: NodeItem; depth?: number }) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const Icon = typeIcons[node.type] || ListChecks;

    return (
        <div className="select-none">
            <div
                onClick={() => setExpanded(!expanded)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-[#0f1922] text-xs ${depth > 0 ? 'mr-4' : ''}`}
                style={{ marginRight: `${depth * 12}px` }}
            >
                {hasChildren ? (
                    expanded ? <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />
                ) : (
                    <span className="w-3 shrink-0" />
                )}
                <Icon className={`w-3.5 h-3.5 shrink-0 ${node.status === 'ACTIVE' ? 'text-[#39ff14]' :
                        node.status === 'STANDBY' ? 'text-amber-500' :
                            node.status === 'ALERT' ? 'text-red-500' : 'text-gray-600'
                    }`} />
                <span className="text-gray-300 font-medium truncate flex-1">{node.label}</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${node.status === 'ACTIVE' ? 'bg-[#39ff14]/10 text-[#39ff14]' :
                        node.status === 'STANDBY' ? 'bg-amber-500/10 text-amber-500' :
                            node.status === 'ALERT' ? 'bg-red-500/10 text-red-500' : 'bg-gray-800 text-gray-600'
                    }`}>
                    {node.status}
                </span>
            </div>
            {expanded && hasChildren && (
                <div>
                    {node.children!.map((child) => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function HierarchyNavigator({ nodes = [], isLoading = false }: HierarchyNavigatorProps) {
    if (isLoading) {
        return (
            <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-6 h-6 text-[#39ff14] animate-spin mb-2" />
                <span className="text-xs text-gray-500 font-mono">تحميل الهيكل التنظيمي...</span>
            </div>
        );
    }

    return (
        <div className="bg-[#0a1214] border border-[#1a3a2a] rounded-sm tactical-card">
            <div className="p-4 border-b border-[#1a3a2a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#39ff14]" />
                    <h3 className="text-xs font-bold text-white font-mono tracking-wider">التدرج الهرمي / HIERARCHY</h3>
                </div>
                <span className="text-[9px] text-gray-500 font-mono">{nodes.length} عقدة جذرية</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-3">
                {nodes.length === 0 ? (
                    <div className="text-center py-8">
                        <ListChecks className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">الهيكل التنظيمي فارغ</p>
                        <p className="text-[10px] text-gray-700 font-mono">HIERARCHY DATA PENDING</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {nodes.map((node) => (
                            <TreeNode key={node.id} node={node} depth={0} />
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-[#1a3a2a] text-[9px] text-gray-600 font-mono text-center">
                <span>HIERARCHICAL COMMAND STRUCTURE // YEMEN SOVEREIGN</span>
            </div>
        </div>
    );
}