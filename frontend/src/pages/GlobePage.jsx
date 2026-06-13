import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import Badge from '../components/Badge'
import { CATEGORY_COLORS } from '../lib/colors'

// Attack origin data — country, coords, type, details
const attackPoints = [
  { id: 1,  lat: 39.9,  lng: 116.4, country: 'China',          type: 'DoS',   count: 1842, ip: '114.80.x.x',   desc: 'neptune flood targeting port 80' },
  { id: 2,  lat: 55.7,  lng: 37.6,  country: 'Russia',         type: 'Probe', count: 934,  ip: '77.88.x.x',    desc: 'portsweep across /24 subnet' },
  { id: 3,  lat: 37.5,  lng: 127.0, country: 'South Korea',    type: 'DoS',   count: 621,  ip: '121.53.x.x',   desc: 'smurf ICMP amplification' },
  { id: 4,  lat: 28.6,  lng: 77.2,  country: 'India',          type: 'R2L',   count: 412,  ip: '103.21.x.x',   desc: 'guess_passwd brute force SSH' },
  { id: 5,  lat: 40.7,  lng: -74.0, country: 'United States',  type: 'Probe', count: 389,  ip: '54.172.x.x',   desc: 'nmap version scan' },
  { id: 6,  lat: 51.5,  lng: -0.1,  country: 'United Kingdom', type: 'R2L',   count: 201,  ip: '82.132.x.x',   desc: 'imap exploit attempt' },
  { id: 7,  lat: -23.5, lng: -46.6, country: 'Brazil',         type: 'DoS',   count: 178,  ip: '177.71.x.x',   desc: 'back overflow attack' },
  { id: 8,  lat: 35.6,  lng: 139.7, country: 'Japan',          type: 'U2R',   count: 44,   ip: '203.174.x.x',  desc: 'buffer_overflow root exploit' },
  { id: 9,  lat: 48.8,  lng: 2.3,   country: 'France',         type: 'Probe', count: 167,  ip: '212.27.x.x',   desc: 'satan automated scan' },
  { id: 10, lat: 52.5,  lng: 13.4,  country: 'Germany',        type: 'R2L',   count: 93,   ip: '84.200.x.x',   desc: 'snmpguess community string' },
  { id: 11, lat: -33.8, lng: 151.2, country: 'Australia',      type: 'DoS',   count: 134,  ip: '203.0.x.x',    desc: 'teardrop fragmentation' },
  { id: 12, lat: 19.4,  lng: -99.1, country: 'Mexico',         type: 'Probe', count: 88,   ip: '189.240.x.x',  desc: 'mscan mass scanner' },
  { id: 13, lat: 1.3,   lng: 103.8, country: 'Singapore',      type: 'U2R',   count: 21,   ip: '103.252.x.x',  desc: 'rootkit installation attempt' },
  { id: 14, lat: 41.0,  lng: 28.9,  country: 'Turkey',         type: 'DoS',   count: 245,  ip: '88.255.x.x',   desc: 'udpstorm flood' },
  { id: 15, lat: 30.0,  lng: 31.2,  country: 'Egypt',          type: 'R2L',   count: 56,   ip: '41.32.x.x',    desc: 'ftp_write exploit' },
]

// Arc connections — attacking → target (always 10.0.0.x)
const arcs = attackPoints.slice(0, 8).map(p => ({
  startLat: p.lat, startLng: p.lng,
  endLat: 37.8, endLng: -97.0,   // US central (target)
  color: CATEGORY_COLORS[p.type],
}))

export default function GlobePage() {
  const globeEl   = useRef(null)
  const globeRef  = useRef(null)
  const [selected, setSelected] = useState(null)
  const [loaded, setLoaded]     = useState(false)

  useEffect(() => { document.title = 'NIDS · Globe' }, [])

  useEffect(() => {
    let Globe
    import('globe.gl').then(mod => {
      Globe = mod.default

      const world = Globe()(globeEl.current)
      globeRef.current = world

      world
        .width(globeEl.current.clientWidth)
        .height(globeEl.current.clientHeight)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')

        // Attack pins
        .pointsData(attackPoints)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor(d => CATEGORY_COLORS[d.type])
        .pointAltitude(0.02)
        .pointRadius(d => Math.sqrt(d.count) * 0.015)
        .pointsMerge(false)
        .onPointClick(d => setSelected(d))
        .onPointHover(d => {
          globeEl.current.style.cursor = d ? 'pointer' : 'grab'
        })

        // Rings (pulse effect)
        .ringsData(attackPoints)
        .ringLat('lat')
        .ringLng('lng')
        .ringColor(d => (t) => {
          const c = CATEGORY_COLORS[d.type]
          const hex = parseInt(c.slice(1), 16)
          const r = (hex >> 16) & 255
          const g = (hex >> 8) & 255
          const b = hex & 255
          return `rgba(${r},${g},${b},${1 - t})`
        })
        .ringMaxRadius(d => Math.min(Math.sqrt(d.count) * 0.08, 3.5))
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(800)

        // Arc connections
        .arcsData(arcs)
        .arcStartLat('startLat').arcStartLng('startLng')
        .arcEndLat('endLat').arcEndLng('endLng')
        .arcColor('color')
        .arcAltitudeAutoScale(0.3)
        .arcStroke(0.4)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2000)

        // Atmosphere glow
        .atmosphereColor('#1a3a6e')
        .atmosphereAltitude(0.18)

      // Dim globe lighting
      world.scene().background = null
      world.controls().autoRotate = true
      world.controls().autoRotateSpeed = 0.4
      world.controls().enableZoom = true

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
  }, [])

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
          background: '#0a0a0a',
          border: '1px solid #1f1f1f',
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
                  background: '#0a0a0a', flexDirection: 'column', gap: 12,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid #1f1f1f',
                    borderTop: '2px solid #3b82f6',
                  }}
                />
                <span style={{ fontSize: 12, color: '#444' }}>Loading globe...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glass controls hint */}
          {loaded && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '6px 16px',
              fontSize: 11, color: '#555',
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
                  background: 'rgba(10,10,10,0.85)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${CATEGORY_COLORS[selected.type]}30`,
                  borderRadius: 12, padding: '14px 16px',
                  minWidth: 220,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${CATEGORY_COLORS[selected.type]}15`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>{selected.country}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2, fontFamily: 'monospace' }}>{selected.ip}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <Badge label={selected.type} />
                    <button onClick={() => setSelected(null)}
                      style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{selected.desc}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#444' }}>Attacks</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: CATEGORY_COLORS[selected.type], fontVariantNumeric: 'tabular-nums' }}>{selected.count.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#444' }}>Coords</div>
                    <div style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>{selected.lat.toFixed(1)}, {selected.lng.toFixed(1)}</div>
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
            background: '#161616', border: '1px solid #1f1f1f',
            borderRadius: 10, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 14 }}>By Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const total = Object.values(typeCounts).reduce((s, v) => s + v, 0)
                const pct = ((count / total) * 100).toFixed(1)
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Badge label={type} />
                      <span style={{ fontSize: 11, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString()} · {pct}%</span>
                    </div>
                    <div style={{ height: 3, background: '#1f1f1f', borderRadius: 2 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        style={{ height: '100%', background: CATEGORY_COLORS[type], borderRadius: 2, opacity: 0.8 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top sources list */}
          <div style={{
            background: '#161616', border: '1px solid #1f1f1f',
            borderRadius: 10, padding: '16px 18px', flex: 1, overflowY: 'auto',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 14 }}>Top Sources</div>
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
                    background: selected?.id === p.id ? '#1a1a1a' : 'transparent',
                  }}
                  whileHover={{ background: '#1a1a1a' }}
                >
                  <span style={{ fontSize: 10, color: '#333', width: 16, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[p.type], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#888', flex: 1 }}>{p.country}</span>
                  <span style={{ fontSize: 11, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{p.count.toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
