import React, { useState } from 'react';
import { Server, Cpu, Activity, Signal, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const RecursivePoleNode = ({ node, isRoot = false, onNodeClick, isLastChild = true, selectedNodeId = null }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const isSelected = selectedNodeId === (isRoot ? node.transformerId : node.poleId);

  // Determine node status colors for SCADA look
  let nodeColorClass = 'text-green-600 bg-green-50 border-green-200';
  let iconColor = 'text-green-600';
  let statusIcon = '🟢';
  let statusText = 'Healthy';

  if (!isRoot) {
    if (node.faultDownstream) {
      nodeColorClass = 'text-red-600 bg-red-50 border-red-200';
      iconColor = 'text-red-600';
      statusIcon = '🔴';
      statusText = 'No Power';
      if (node.isFirstDeadPole) {
        nodeColorClass = 'text-red-700 bg-red-100 border-red-400 font-bold shadow-sm';
        statusText = 'First Dead Pole';
      }
    } else if (node.isLastLivePole) {
      nodeColorClass = 'text-green-700 bg-green-100 border-green-400 font-bold shadow-sm';
      iconColor = 'text-green-700';
      statusIcon = '🟢';
      statusText = 'Last Live Pole';
    } else if (!node.hasDevice) {
      nodeColorClass = 'text-gray-500 bg-gray-50 border-gray-200';
      iconColor = 'text-gray-400';
      statusIcon = '⚪';
      statusText = 'No Device';
    } else if (!node.voltage) {
      nodeColorClass = 'text-yellow-600 bg-yellow-50 border-yellow-200';
      iconColor = 'text-yellow-600';
      statusIcon = '🟡';
      statusText = 'Unknown';
    }
  } else {
    // Root Transformer styling
    if (node.isAffected) {
      nodeColorClass = 'text-red-700 bg-red-50 border-red-400 font-bold shadow-sm';
      iconColor = 'text-red-600';
      statusIcon = '🔴';
      statusText = 'Fault Active';
    } else {
      nodeColorClass = 'text-blue-700 bg-blue-50 border-blue-400 font-bold shadow-sm';
      iconColor = 'text-blue-600';
      statusIcon = '⚡';
      statusText = 'Active';
    }
  }

  if (isSelected) {
    nodeColorClass += ' ring-2 ring-blue-500 bg-blue-50 border-blue-300';
  }

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative font-mono text-sm">

      {/* Node Content */}
      <div className="flex items-center group">

        {/* Tree Branch Line for non-root */}
        {!isRoot && (
          <div className="flex items-center text-gray-400 select-none mr-2">
            {isLastChild ? '└──' : '├──'}
          </div>
        )}

        {/* Broken Span Animation before the node */}
        {node.isFirstDeadPole && (
          <motion.div
            className="flex items-center text-red-600 font-bold mr-2 select-none"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            <span className="flex items-center"><AlertTriangle size={14} className="mr-1" /> FAULT SPAN</span>
            <span className="text-gray-400 ml-1">──</span>
          </motion.div>
        )}

        {/* The Node Card */}
        <div
          onClick={() => onNodeClick ? onNodeClick(node) : null}
          className={`flex items-center space-x-3 px-3 py-2 border rounded cursor-pointer transition-colors hover:shadow-md ${nodeColorClass} ${isRoot ? 'mb-2 min-w-[320px]' : 'my-1 min-w-[280px]'}`}
        >
          <span className="select-none text-base cursor-pointer" onClick={hasChildren ? handleToggle : undefined}>
            {isRoot ? <Server className={iconColor} size={24} /> : statusIcon}
          </span>

          <div className="flex flex-col flex-1">
            <div className="flex justify-between items-center w-full">
              <span className="tracking-wide font-bold text-sm">
                {isRoot ? node.name : node.poleId}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 px-1.5 py-0.5 rounded bg-white/50 border border-black/5">
                {statusText}
              </span>
            </div>

            <div className="flex items-center justify-between mt-1 text-[11px] opacity-90">
              <span className="flex items-center font-semibold">
                <Activity size={12} className="mr-1" />
                {node.voltage ? `${node.voltage}V` : '---'}
              </span>
              <span className="flex items-center font-semibold">
                <Signal size={12} className="mr-1" />
                {node.hasDevice ? 'Telemetry Online' : 'No Telemetry'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Children Container */}
      {isOpen && hasChildren && (
        <div className="flex flex-col">
          {node.children.map((child, index) => {
            const isLast = index === node.children.length - 1;

            // Highlight downstream edges in red if the child is affected by fault
            // If the child is the first dead pole, the edge to it is RED (fault span).
            // If the child is affected downstream, its incoming edge is RED.
            const edgeColor = (child.faultDownstream) ? 'border-red-400' : 'border-gray-300';
            const showVerticalLine = !isRoot && !isLastChild;

            return (
              <div key={child.poleId} className="flex">
                {/* Continuing vertical line for siblings of the parent, if parent isn't the last child */}
                {showVerticalLine && (
                  <div className="w-8 border-l-[1.5px] border-gray-300 ml-[0.6rem] shrink-0"></div>
                )}

                {/* Indentation space for root's children, or normal children */}
                {isRoot && (
                  <div className="w-4 shrink-0"></div>
                )}
                {!isRoot && isLastChild && (
                  <div className="w-8 shrink-0"></div>
                )}

                {/* Vertical line connecting parent to this specific child (unless it's root) */}
                <div className={`relative flex-1 ${!isRoot ? 'border-l-[1.5px]' : 'border-l-[1.5px] ml-4'} ${edgeColor}`}>
                  <div className="absolute top-0 -left-[1.5px] h-4 border-l-[1.5px] border-inherit"></div>
                  <div className="pt-2">
                    <RecursivePoleNode
                      node={child}
                      isRoot={false}
                      onNodeClick={onNodeClick}
                      isLastChild={isLast}
                      selectedNodeId={selectedNodeId}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecursivePoleNode;
