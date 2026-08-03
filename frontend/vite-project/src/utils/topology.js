export function sortPolesLinear(poles) {
  if (!poles.length) return []

  const sorted = [...poles].sort((a, b) => {
    const seqA = a.sequenceOnLine ?? Number.MAX_SAFE_INTEGER
    const seqB = b.sequenceOnLine ?? Number.MAX_SAFE_INTEGER
    if (seqA !== seqB) return seqA - seqB
    return a.poleId.localeCompare(b.poleId)
  })

  const poleMap = new Map(sorted.map((p) => [p.poleId, p]))
  const visited = new Set()
  const chain = []

  const roots = sorted.filter(
    (p) => !p.parentPoleId || !poleMap.has(p.parentPoleId)
  )

  function walk(pole) {
    if (!pole || visited.has(pole.poleId)) return
    visited.add(pole.poleId)
    chain.push(pole)

    const children = sorted
      .filter((p) => p.parentPoleId === pole.poleId)
      .sort((a, b) => (a.sequenceOnLine ?? 0) - (b.sequenceOnLine ?? 0))

    children.forEach(walk)
  }

  roots.forEach(walk)
  sorted.forEach((p) => {
    if (!visited.has(p.poleId)) chain.push(p)
  })

  return chain
}

export function shortPoleId(poleId) {
  if (!poleId) return ''
  const match = poleId.match(/P(\d+)/i)
  return match ? `P${parseInt(match[1], 10)}` : poleId
}

export function getPoleState(poleId, affectedSet, faultSpan, telemetryMap) {
  if (faultSpan?.fromPole === poleId || faultSpan?.toPole === poleId) {
    if (faultSpan.toPole === poleId) return 'fault'
    if (affectedSet?.has(poleId)) return 'fault'
    return 'healthy'
  }
  if (affectedSet?.has(poleId)) return 'fault'

  const event = telemetryMap?.get(poleId)?.event
  if (event === 'power_lost' || event === 'voltage_drop') return 'fault'
  if (event === 'sensor_failure') return 'warning'
  return 'healthy'
}

export function buildTelemetryMap(telemetry) {
  const map = new Map()
  for (const t of telemetry) {
    const existing = map.get(t.poleId)
    if (!existing || new Date(t.timestamp) > new Date(existing.timestamp)) {
      map.set(t.poleId, t)
    }
  }
  return map
}
