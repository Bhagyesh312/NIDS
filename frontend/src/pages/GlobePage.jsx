import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import Badge from '../components/Badge'
import { getLabelColor } from '../lib/colors'
import { getGlobeStats } from '../lib/api'
import { useMockMode } from '../lib/mockModeContext'
import { useModel } from '../lib/modelContext'

// ── Mock data — KDD (DoS/Probe/R2L/U2R) ──────────────────────────────────────
const MOCK_KDD_POINTS = [
  { id: 1,  lat: 39.9,  lng: 116.4, country: 'China',          type: 'DoS',   count: 1842, ip: '114.80.x.x',  desc: 'neptune flood targeting port 80' },
  { id: 2,  lat: 55.7,  lng: 37.6,  country: 'Russia',         type: 'Probe', count: 934,  ip: '77.88.x.x',   desc: 'portsweep across /24 subnet' },
  { id: 3,  lat: 37.5,  lng: 127.0, country: 'South Korea',    type: 'DoS',   count: 621,  ip: '121.53.x.x',  desc: 'smurf ICMP amplification' },
  { id: 4,  lat: 28.6,  lng: 77.2,  country: 'India',          type: 'R2L',   count: 412,  ip: '103.21.x.x',  desc: 'guess_passwd brute force SSH' },
  { id: 5,  lat: 40.7,  lng: -74.0, country: 'United States',  type: 'Probe', count: 389,  ip: '54.172.x.x',  desc: 'nmap version scan' },
  { id: 6,  lat: 51.5,  lng: -0.1,  country: 'United Kingdom', type: 'R2L',   count: 201,  ip: '82.132.x.x',  desc: 'imap exploit attempt' },
  { id: 7,  lat: -23.5, lng: -46.6, country: 'Brazil',         type: 'DoS',   count: 178,  ip: '177.71.x.x',  desc: 'back overflow attack' },
  { id: 8,  lat: 35.6,  lng: 139.7, country: 'Japan',          type: 'U2R',   count: 44,   ip: '203.174.x.x', desc: 'buffer_overflow root exploit' },
  { id: 9,  lat: 48.8,  lng: 2.3,   country: 'France',         type: 'Probe', count: 167,  ip: '212.27.x.x',  desc: 'satan automated scan' },
  { id: 10, lat: 52.5,  lng: 13.4,  country: 'Germany',        type: 'R2L',   count: 93,   ip: '84.200.x.x',  desc: 'snmpguess community string' },
  { id: 11, lat: -33.8, lng: 151.2, country: 'Australia',      type: 'DoS',   count: 134,  ip: '203.0.x.x',   desc: 'teardrop fragmentation' },
  { id: 12, lat: 19.4,  lng: -99.1, country: 'Mexico',         type: 'Probe', count: 88,   ip: '189.240.x.x', desc: 'mscan mass scanner' },
  { id: 13, lat: 1.3,   lng: 103.8, country: 'Singapore',      type: 'U2R',   count: 21,   ip: '103.252.x.x', desc: 'rootkit installation attempt' },
  { id: 14, lat: 41.0,  lng: 28.9,  country: 'Turkey',         type: 'DoS',   count: 245,  ip: '88.255.x.x',  desc: 'udpstorm flood' },
  { id: 15, lat: 30.0,  lng: 31.2,  country: 'Egypt',          type: 'R2L',   count: 56,   ip: '41.32.x.x',   desc: 'ftp_write exploit' },
]

// ── Mock data — CICIDS2017 (DDoS/DoS/PortScan/BruteForce/Bot/Infiltration) ────
const MOCK_CICIDS_POINTS = [
  { id: 1,  lat: 39.9,  lng: 116.4, country: 'China',          type: 'DDoS',        count: 19187, ip: '114.80.x.x',  desc: 'LOIC UDP volumetric flood' },
  { id: 2,  lat: 55.7,  lng: 37.6,  country: 'Russia',         type: 'Bot',         count: 293,   ip: '77.88.x.x',   desc: 'ARES C&C beacon traffic' },
  { id: 3,  lat: 37.5,  lng: 127.0, country: 'South Korea',    type: 'DoS',         count: 8700,  ip: '121.53.x.x',  desc: 'Slowloris web server attack' },
  { id: 4,  lat: 28.6,  lng: 77.2,  country: 'India',          type: 'BruteForce',  count: 412,   ip: '103.21.x.x',  desc: 'SSH-Hydra credential brute force' },
  { id: 5,  lat: 40.7,  lng: -74.0, country: 'United States',  type: 'PortScan',    count: 2381,  ip: '54.172.x.x',  desc: 'nmap aggressive scan' },
  { id: 6,  lat: 51.5,  lng: -0.1,  country: 'United Kingdom', type: 'DDoS',        count: 6420,  ip: '82.132.x.x',  desc: 'LOIC TCP flood from botnet' },
  { id: 7,  lat: -23.5, lng: -46.6, country: 'Brazil',         type: 'DoS',         count: 4100,  ip: '177.71.x.x',  desc: 'HULK HTTP flood attack' },
  { id: 8,  lat: 35.6,  lng: 139.7, country: 'Japan',          type: 'Infiltration',count: 5,     ip: '203.174.x.x', desc: 'Meterpreter reverse shell' },
  { id: 9,  lat: 48.8,  lng: 2.3,   country: 'France',         type: 'PortScan',    count: 1670,  ip: '212.27.x.x',  desc: 'nmap SYN stealth scan' },
  { id: 10, lat: 52.5,  lng: 13.4,  country: 'Germany',        type: 'BruteForce',  count: 206,   ip: '84.200.x.x',  desc: 'FTP-Patator credential attack' },
  { id: 11, lat: -33.8, lng: 151.2, country: 'Australia',      type: 'DoS',         count: 3340,  ip: '203.0.x.x',   desc: 'GoldenEye keep-alive flood' },
  { id: 12, lat: 19.4,  lng: -99.1, country: 'Mexico',         type: 'Bot',         count: 88,    ip: '189.240.x.x', desc: 'bot propagation traffic' },
  { id: 13, lat: 1.3,   lng: 103.8, country: 'Singapore',      type: 'DDoS',        count: 2100,  ip: '103.252.x.x', desc: 'UDP amplification attack' },
  { id: 14, lat: 41.0,  lng: 28.9,  country: 'Turkey',         type: 'DoS',         count: 2450,  ip: '88.255.x.x',  desc: 'SlowHTTPTest POST flood' },
  { id: 15, lat: 30.0,  lng: 31.2,  country: 'Egypt',          type: 'BruteForce',  count: 156,   ip: '41.32.x.x',   desc: 'HTTP form brute force' },
]

export default function GlobePage() {
  const globeEl   = useRef(null)
  const globeRef  = useRef(null)
  const { mockMode }                    = useMockMode()
  const { activeModel }                 = useModel()
  const [selected, setSelected]         = useState(null)
  const [loaded, setLoaded]             = useState(false)
  const [attackPoints, setAttackPoints] = useState(
    () => activeModel === 'cicids' ? MOCK_CICIDS_POINTS : MOCK_KDD_POINTS
  )

  useEffect(() => { document.title = 'NIDS · Globe' }, [])

  // ── Load data whenever model or mock mode changes ─────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(null)
    const mockPoints = activeModel === 'cicids' ? MOCK_CICIDS_POINTS : MOCK_KDD_POINTS

    if (mockMode) {
      setAttackPoints(mockPoints)
      return
    }
    getGlobeStats(activeModel)
      .then(res => {
        if (res.data?.length) {
          const normalised = res.data.map((r, i) => ({
            id:      i + 1,
            lat:     mockPoints[i % mockPoints.length]?.lat ?? 0,
            lng:     mockPoints[i % mockPoints.length]?.lng ?? 0,
            country: r.src_ip || '—',
            ip:      r.src_ip || '—',
            type:    r.type,
            count:   r.count,
            desc:    `${r.type.toLowerCase()} attack`,
          }))
          setAttackPoints(normalised)
        } else {
          setAttackPoints(mockPoints)
        }
      })
      .catch(() => setAttackPoints(mockPoints))
  }, [mockMode, activeModel])

  // ── Update globe visuals whenever attackPoints changes ────────────────────
  useEffect(() => {
    if (!globeRef.current) return
    const arcs = attackPoints.slice(0, 8).map(p => ({
      startLat: p.lat, startLng: p.lng,
      endLat: 37.8, endLng: -97.0,
      color: getLabelColor(p.type),
    }))
    globeRef.current
      .pointsData(attackPoints)
      .ringsData(attackPoints)
      .arcsData(arcs)
  }, [attackPoints])

  // ── Initialize globe.gl once ──────────────────────────────────────────────
  useEffect(() => {
    const initialMock = activeModel === 'cicids' ? MOCK_CICIDS_POINTS : MOCK_KDD_POINTS
    const initialArcs = initialMock.slice(0, 8).map(p => ({
      startLat: p.lat, startLng: p.lng,
      endLat: 37.8, endLng: -97.0,
      color: getLabelColor(p.type),
    }))

    import('globe.gl').then(mod => {
      const Globe = mod.default
      const world = Globe()(globeEl.current)
      globeRef.current = world

      world
        .width(globeEl.current.clientWidth)
        .height(globeEl.current.clientHeight)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        // Points
        .pointsData(initialMock)
        .pointLat('lat').pointLng('lng')
        .pointColor(d => getLabelColor(d.type))
        .pointAltitude(0.02)
        .pointRadius(d => Math.sqrt(d.count) * 0.015)
        .pointsMerge(false)
        .onPointClick(d => setSelected(d))
        .onPointHover(d => { globeEl.current.style.cursor = d ? 'pointer' : 'grab' })
        // Rings
        .ringsData(initialMock)
        .ringLat('lat').ringLng('lng')
        .ringColor(d => (t) => {
          const c   = getLabelColor(d.type)
          const hex = parseInt(c.replace('#', ''), 16)
          return `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${1 - t})`
        })
        .ringMaxRadius(d => Math.min(Math.sqrt(d.count) * 0.08, 3.5))
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(800)
        // Arcs
        .arcsData(initialArcs)
        .arcStartLat('startLat').arcStartLng('startLng')
        .arcEndLat('endLat').arcEndLng('endLng')
        .arcColor('color')
        .arcAltitudeAutoScale(0.3)
        .arcStroke(0.4)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2000)
        // Atmosphere
        .atmosphereColor('#1a3a6e')
        .atmosphereAltitude(0.18)

      world.scene().background = null
      world.controls().autoRotate      = true
      world.controls().autoRotateSpeed = 0.4
      world.controls().enableZoom      = true

      setLoaded(true)
    })

    const handleResize = () => {
      if (globeRef.current && globeEl.current) {
        globeRef.current
          .width(globeEl.current.clientWidth)
          .height(globeEl.current.clientHeight)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // runs once — data updates pushed via the effect above

  const typeCounts = attackPoints.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + p.count
    return acc
  }, {})

  return (
    <div>
      <Header title="Globe" subtitle="Attack origin visualization — interactive 3D threat map" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, height: 'calc(100vh - 120px)' }}>

        {/* Globe container */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Globe canvas */}
          <div ref={globeEl} style={{ width: '100%', height: '100%' }} />

          {/* Loading overlay */}
          <AnimatePresence>
            {!loaded && (
              <motion.div
                initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--surface)', flexDirection: 'column', gap: 12,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid var(--border)',
                    borderTop: '2px solid #3b82f6',
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading globe...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glass controls hint */}
          {loaded && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--surface3)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 16px',
              fontSize: 11, color: 'var(--text-soft)',
              whiteSpace: 'nowrap',
            }}>
              Drag to rotate · Scroll to zoom · Click a pin for details
            </div>
          )}

          {/* Selected point popup */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute', top: 16, left: 16,
                    background: 'var(--surface)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${getLabelColor(selected.type)}30`,
                  borderRadius: 12, padding: '14px 16px',
                  minWidth: 220,
                    boxShadow: `var(--panel-shadow), 0 0 0 1px ${getLabelColor(selected.type)}15`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{selected.country}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 2, fontFamily: 'monospace' }}>{selected.ip}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <Badge label={selected.type} />
                    <button onClick={() => setSelected(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{selected.desc}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                      <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Attacks</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: getLabelColor(selected.type), fontVariantNumeric: 'tabular-nums' }}>{selected.count.toLocaleString()}</div>
                  </div>
                  <div>
                      <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Coords</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selected.lat.toFixed(1)}, {selected.lng.toFixed(1)}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Attack type summary */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)', marginBottom: 14 }}>By Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const total = Object.values(typeCounts).reduce((s, v) => s + v, 0)
                const pct = ((count / total) * 100).toFixed(1)
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Badge label={type} />
                      <span style={{ fontSize: 11, color: 'var(--text-soft)', fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString()} · {pct}%</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--surface3)', borderRadius: 2 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        style={{ height: '100%', background: getLabelColor(type), borderRadius: 2, opacity: 0.8 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top sources list */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '16px 18px', flex: 1, overflowY: 'auto',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)', marginBottom: 14 }}>Top Sources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...attackPoints].sort((a, b) => b.count - a.count).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    setSelected(p)
                    if (globeRef.current) {
                      globeRef.current.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.5 }, 800)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                    transition: 'background 0.12s',
                    background: selected?.id === p.id ? 'var(--surface3)' : 'transparent',
                  }}
                  whileHover={{ background: 'var(--surface3)' }}
                >
                  <span style={{ fontSize: 10, color: 'var(--text-faint)', width: 16, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: getLabelColor(p.type), flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{p.country}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-soft)', fontVariantNumeric: 'tabular-nums' }}>{p.count.toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
