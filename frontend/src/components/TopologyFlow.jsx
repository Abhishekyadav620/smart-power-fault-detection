import React, { useMemo, useEffect, useCallback } from 'react';
import { ReactFlow, useNodesState, useEdgesState, Background, Controls, MiniMap, Panel, MarkerType, BaseEdge, EdgeLabelRenderer, getBezierPath, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Server, Activity, Signal, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Custom Node for rendering a Pole or Transformer
const ScadaNode = ({ data }) => {
  const isTransformer = data.isTransformer;
  const isHealthy = !data.faultDownstream && !data.isFirstDeadPole;
  const isAffected = data.faultDownstream || data.isFirstDeadPole;

  return (
    <div className={cn(
      "px-4 py-3 shadow-md rounded-xl border-2 bg-white w-64 transition-all duration-300 relative",
      isTransformer ? "border-blue-400 bg-blue-50" :
        isAffected ? "border-red-400 bg-red-50" :
          "border-green-400 bg-green-50"
    )}
      onClick={() => data.onNodeClick && data.onNodeClick(data.originalNode)}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-400 border-none" />

      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          {isTransformer ? <Server size={18} className="text-blue-600" /> :
            <div className={cn(
              "w-4 h-4 rounded-full shadow-sm",
              isAffected ? "bg-red-500 shadow-red-200" : "bg-green-500 shadow-green-200"
            )} />}
          <span className={cn(
            "font-bold text-sm",
            isTransformer ? "text-blue-800" :
              isAffected ? "text-red-800" : "text-green-800"
          )}>
            {isTransformer ? data.id : data.id}
          </span>
        </div>
        {isTransformer && (
          <span className="text-[10px] font-bold tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">ACTIVE</span>
        )}
        {!isTransformer && (
          <span className={cn(
            "text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase",
            isAffected ? (data.isFirstDeadPole ? "bg-red-200 text-red-800" : "bg-red-100 text-red-700") : "bg-green-100 text-green-700"
          )}>
            {isAffected ? (data.isFirstDeadPole ? 'DEAD' : 'AFFECTED') : 'HEALTHY'}
          </span>
        )}
      </div>

      {!isTransformer && (
        <div className="flex justify-between items-center mt-3 border-t pt-2 border-opacity-20 border-black">
          <div className="flex items-center space-x-1">
            <Activity size={14} className={isAffected ? "text-red-500" : "text-green-500"} />
            <span className={cn(
              "font-mono text-sm font-bold",
              isAffected ? "text-red-600" : "text-green-600"
            )}>
              {data.voltage ? `${data.voltage}V` : '0.0V'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <Signal size={14} className={data.hasDevice ? "text-green-500" : "text-gray-400"} />
            <span className={cn(
              "text-xs font-semibold",
              data.hasDevice ? "text-green-600" : "text-gray-400"
            )}>
              {data.hasDevice ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-400 border-none" />
    </div>
  );
};

// Custom Edge for showing a broken span
const FaultEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '5,5', animation: 'dash 1s linear infinite' }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-white rounded-full p-1 shadow-lg border-2 border-red-500 flex items-center justify-center animate-pulse"
        >
          <AlertTriangle size={20} className="text-red-600" />
        </div>
      </EdgeLabelRenderer>
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -10;
            }
          }
        `}
      </style>
    </>
  );
};

const nodeTypes = {
  scada: ScadaNode,
};

const edgeTypes = {
  fault: FaultEdge,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const nodeWidth = 260;
  const nodeHeight = 120;

  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: 'top',
      sourcePosition: 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function TopologyFlow({ topology, onNodeClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!topology) return;

    // Flatten tree structure to nodes and edges
    const initialNodes = [];
    const initialEdges = [];

    const traverse = (node, parentId = null) => {
      const isRoot = !parentId;
      const id = isRoot ? node.transformerId : node.poleId;

      initialNodes.push({
        id: id,
        type: 'scada',
        data: {
          id: id,
          isTransformer: isRoot,
          voltage: node.voltage,
          hasDevice: node.hasDevice,
          faultDownstream: node.faultDownstream || node.isAffected,
          isFirstDeadPole: node.isFirstDeadPole,
          originalNode: node,
          onNodeClick: onNodeClick
        }
      });

      if (parentId) {
        // If this node is the first dead pole, the edge leading TO it is broken
        const isBrokenSpan = node.isFirstDeadPole;

        initialEdges.push({
          id: `e-${parentId}-${id}`,
          source: parentId,
          target: id,
          type: isBrokenSpan ? 'fault' : 'default',
          animated: isBrokenSpan,
          style: isBrokenSpan ? undefined : { stroke: node.faultDownstream ? '#ef4444' : '#9ca3af', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isBrokenSpan ? '#ef4444' : (node.faultDownstream ? '#ef4444' : '#9ca3af')
          }
        });
      }

      if (node.children) {
        node.children.forEach(child => traverse(child, id));
      }
    };

    // topology can be an array or a single root object
    const roots = Array.isArray(topology) ? topology : [topology];
    roots.forEach(root => traverse(root));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [topology, onNodeClick]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.4, maxZoom: 1.2 }}
        attributionPosition="bottom-right"
        minZoom={0.1}
        panOnScroll={true}
        zoomOnScroll={false}
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap zoomable pannable nodeColor={(n) => {
          if (n.data.isTransformer) return '#3b82f6';
          if (n.data.isFirstDeadPole) return '#ef4444';
          if (n.data.faultDownstream) return '#fca5a5';
          return '#22c55e';
        }} />
      </ReactFlow>
    </div>
  );
}
