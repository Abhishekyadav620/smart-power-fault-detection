import { useState, useEffect } from 'react';
import api from '../services/api';

const buildTree = (poles, parentId = null) => {
  return poles
    .filter(pole => pole.parentPoleId === parentId)
    .sort((a, b) => a.sequenceOnLine - b.sequenceOnLine) // Use sequenceOnLine for proper ordering
    .map(pole => ({
      ...pole,
      children: buildTree(poles, pole.poleId)
    }));
};

export const useNetworkTopology = (transformerId, faultResult = null) => {
  const [topology, setTopology] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopology = async () => {
      if (!transformerId) {
        setTopology(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [polesRes, transRes] = await Promise.all([
          api.getPoles(),
          api.getTransformers()
        ]);

        const allPoles = polesRes.data.data;
        const allTrans = transRes.data.data;

        let targetTransformers = [];
        if (transformerId === 'ALL') {
          targetTransformers = allTrans;
        } else {
          const transformer = allTrans.find(t => t.transformerId === transformerId);
          if (!transformer) throw new Error('Transformer not found');
          targetTransformers = [transformer];
        }

        const topologies = targetTransformers.map(transformer => {
          let transformerPoles = allPoles.filter(p => p.transformerId === transformer.transformerId);

          let affectedPolesSet = new Set();
          let fromPole = null;
          let toPole = null;

          if (faultResult && faultResult.faultLocation && (faultResult.faultLocation.transformerId === transformer.transformerId || transformerId === 'ALL')) {
            if (faultResult.affectedPoles) {
              faultResult.affectedPoles.forEach(p => affectedPolesSet.add(p));
            }
            fromPole = faultResult.faultLocation.fromPole;
            toPole = faultResult.faultLocation.toPole || faultResult.faultLocation.atPole;
          }

          transformerPoles = transformerPoles.map(p => {
            const isAffected = affectedPolesSet.has(p.poleId);
            const isFirstDead = toPole === p.poleId && isAffected;
            const isLastLive = fromPole === p.poleId;

            return {
              ...p,
              isFirstDeadPole: isFirstDead,
              isLastLivePole: isLastLive,
              faultDownstream: isAffected, // If it's in affected poles, it has a fault
              voltage: p.hasDevice ? (isAffected ? "0.0" : (230 + (Math.random() * 10 - 5)).toFixed(1)) : null,
              lastUpdate: p.hasDevice ? new Date(Date.now() - Math.floor(Math.random() * 300000)).toISOString() : null,
            };
          });

          const rootPoles = buildTree(transformerPoles, null);

          return {
            transformerId: transformer.transformerId,
            name: `Transformer ${transformer.transformerId}`,
            location: transformer.location,
            children: rootPoles,
            isAffected: affectedPolesSet.size > 0
          };
        });

        setTopology(transformerId === 'ALL' ? topologies : topologies[0]);

      } catch (err) {
        setError(err.message || 'Failed to load topology');
      } finally {
        setLoading(false);
      }
    };

    fetchTopology();
  }, [transformerId, faultResult]);

  return { topology, loading, error };
};

