import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Radar, Key, Crown, ShieldCheck,
  ChevronDown, AlertTriangle, Clock, Target, Wrench, Info
} from 'lucide-react'
import { CATEGORY_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'

const attacks = [
  {
    key: 'Normal',
    icon: ShieldCheck,
    color: CATEGORY_COLORS.Normal,
    label: 'Normal Traffic',
    severity: 'Safe',
    severityColor: CATEGORY_COLORS.Normal,
    short: 'Legitimate network communication with no malicious intent.',
    what: 'Normal traffic represents standard, expected network behaviour — HTTP requests, DNS queries, file transfers, email, and other everyday protocols operating within normal parameters.',
    how: 'Normal traffic is identified by consistent patterns: appropriate packet sizes, standard port usage, expected connection durations, and low error rates. The model learns these baselines from 67,343 normal samples in the NSL-KDD dataset.',
    impact: 'No impact. These are safe connections that should be allowed through without interruption.',
    examples: ['HTTP web browsing', 'DNS name resolution', 'HTTPS encrypted traffic', 'FTP file transfers', 'SMTP email delivery'],
    realWorld: 'Every connection you make when visiting a website, sending an email, or downloading a file.',
    features: ['Low serror_rate', 'Normal src_bytes / dst_bytes ratio', 'logged_in = 1 for authenticated sessions'],
  },
  {
    key: 'DoS',
    icon: Zap,
    color: CATEGORY_COLORS.DoS,
    label: 'DoS — Denial of Service',
    severity: 'Critical',
    severityColor: CATEGORY_COLORS.DoS,
    short: 'Overwhelms a target system with traffic to make it unavailable to legitimate users.',
    what: 'DoS attacks flood a target server or network with an overwhelming volume of requests, exhausting its resources (bandwidth, memory, CPU) so it can no longer serve legitimate users. The NSL-KDD dataset includes 10 DoS subtypes covering different flooding techniques.',
    how: 'Attackers exploit protocol weaknesses to generate massive traffic with minimal effort. For example, the "neptune" attack sends SYN packets without completing the TCP handshake, filling the target\'s connection table. "Smurf" attacks amplify traffic by broadcasting ICMP requests with a spoofed source IP.',
    impact: 'Service unavailability ranging from minutes to days. In critical infrastructure (hospitals, power grids, financial systems), this can cause serious real-world harm. Cost: $20,000–$50,000 per hour of downtime for enterprises.',
    examples: ['Neptune — SYN flood (TCP handshake exhaustion)', 'Smurf — ICMP broadcast amplification', 'Teardrop — malformed fragmented packets', 'Back — Apache server exploit', 'Pod — oversized ICMP ping packets'],
    realWorld: 'GitHub suffered a 1.35 Tbps DDoS in 2018. Cloudflare blocked a 71 million RPS attack in 2023.',
    features: ['Very high serror_rate', 'Large count / srv_count', 'dst_host_serror_rate near 1.0', 'src_bytes near 0'],
  },
  {
    key: 'Probe',
    icon: Radar,
    color: CATEGORY_COLORS.Probe,
    label: 'Probe — Surveillance & Scanning',
    severity: 'High',
    severityColor: CATEGORY_COLORS.Probe,
    short: 'Systematically scans a network to discover hosts, open ports, and vulnerabilities.',
    what: 'Probe attacks are reconnaissance activities where an attacker maps the target network before launching a full attack. They are often the first stage of a multi-step intrusion — the attacker needs to know what\'s available and vulnerable before they can exploit it.',
    how: 'Port scanners like nmap send packets to every port on a host to see which respond. IP sweepers (ipsweep) ping every IP in a subnet to find active hosts. Satan and saint are automated vulnerability scanners that go further, probing for known software weaknesses.',
    impact: 'Direct impact is low — scanning itself does not damage systems. However, it is a strong indicator of an imminent attack. Undetected probing gives attackers a detailed map of your infrastructure.',
    examples: ['nmap — port scanning with fingerprinting', 'ipsweep — ping sweep across IP ranges', 'portsweep — scan one port across many IPs', 'Satan — automated vulnerability scanner', 'Mscan — mass network scanner'],
    realWorld: 'Most major breaches (Target 2013, Equifax 2017) were preceded by weeks of undetected reconnaissance scanning.',
    features: ['Moderate serror_rate', 'High dst_host_count', 'Low same_srv_rate', 'Varying dst_host_diff_srv_rate'],
  },
  {
    key: 'R2L',
    icon: Key,
    color: CATEGORY_COLORS.R2L,
    label: 'R2L — Remote to Local',
    severity: 'High',
    severityColor: CATEGORY_COLORS.R2L,
    short: 'An external attacker gains unauthorized local access to a machine they have no account on.',
    what: 'R2L (Remote-to-Local) attacks exploit vulnerabilities to gain user-level access to a target machine from the network. Unlike DoS which just disrupts, R2L attacks give the attacker a foothold inside the network — a beachhead for further attacks.',
    how: 'Common techniques include brute-forcing weak passwords (guess_passwd), exploiting misconfigured FTP servers to write files (ftp_write), abusing email server vulnerabilities (sendmail, imap), and exploiting SNMP misconfigurations to extract sensitive information.',
    impact: 'Unauthorized access to sensitive data, ability to install malware, use the compromised machine as a pivot point for deeper network penetration, and potential data exfiltration.',
    examples: ['guess_passwd — brute force password attacks', 'ftp_write — unauthorized FTP file write', 'imap — IMAP exploit for email server access', 'snmpguess — SNMP community string brute force', 'warezmaster — FTP abuse for unauthorized access'],
    realWorld: 'The 2021 Colonial Pipeline attack started with a compromised VPN password — a classic R2L entry point.',
    features: ['logged_in = 1 after compromise', 'Elevated num_failed_logins before success', 'dst_bytes > src_bytes (data being sent back)', 'hot > 0'],
  },
  {
    key: 'U2R',
    icon: Crown,
    color: CATEGORY_COLORS.U2R,
    label: 'U2R — User to Root',
    severity: 'Critical',
    severityColor: CATEGORY_COLORS.U2R,
    short: 'A local user escalates privileges to gain root/administrator control of the system.',
    what: 'U2R (User-to-Root) is privilege escalation — the attacker already has a low-privilege local account (or has gained one via R2L) and exploits a vulnerability to gain superuser (root/admin) access. This is the most dangerous class: root access means complete control.',
    how: 'Buffer overflow attacks overwrite memory to inject and execute malicious code with elevated privileges. Perl and Python script exploits abuse interpreter vulnerabilities. Rootkits modify the kernel to hide the attacker\'s presence and maintain persistent access even after reboots.',
    impact: 'Total system compromise. The attacker can read any file, install keyloggers or backdoors, modify system logs to cover their tracks, disable security tools, create new accounts, and pivot to other systems. Recovery often requires full OS reinstallation.',
    examples: ['buffer_overflow — memory corruption exploit', 'rootkit — kernel-level persistent backdoor', 'perl — Perl interpreter privilege exploit', 'sqlattack — SQL injection for database admin access', 'xterm — X Window System exploit'],
    realWorld: 'The SolarWinds attack (2020) used U2R techniques to gain domain admin rights across 18,000 organizations including US government agencies.',
    features: ['root_shell = 1', 'su_attempted > 0', 'num_root > 0', 'num_file_creations > 0', 'num_shells > 0'],
  },
]

const SEVERITY_ORDER = { Critical: 0, High: 1, Safe: 2 }

function SeverityBadge({ label, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      color, background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: 4, padding: '2px 8px',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  )
}

function AttackCard({ attack, index }) {
  const [open, setOpen] = useState(false)
  const ready = useReady()
  const Icon = attack.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
      style={{
        background: '#161616',
        border: `1px solid ${open ? attack.color + '30' : '#1f1f1f'}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header row — always visible */}
      <motion.div
        onClick={() => setOpen(o => !o)}
        whileHover={{ background: '#1a1a1a' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 18px', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {/* Icon box */}
        <div style={{
          width: 38, height: 38, borderRadius: 8, flexShrink: 0,
          background: `${attack.color}12`,
          border: `1px solid ${attack.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={attack.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e2e2' }}>{attack.label}</span>
            <SeverityBadge label={attack.severity} color={attack.severityColor} />
          </div>
          <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.4 }}>{attack.short}</p>
        </div>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown size={16} color="#444" />
        </motion.div>
      </motion.div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 18px 20px',
              borderTop: `1px solid ${attack.color}18`,
            }}>
              {/* Left accent bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>

                {/* What is it */}
                <InfoBlock icon={Info} color="#3b82f6" title="What is it?">
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>{attack.what}</p>
                </InfoBlock>

                {/* How it works */}
                <InfoBlock icon={Wrench} color={attack.color} title="How it works">
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>{attack.how}</p>
                </InfoBlock>

                {/* Impact */}
                <InfoBlock icon={AlertTriangle} color={attack.severityColor} title="Impact">
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>{attack.impact}</p>
                </InfoBlock>

                {/* Real world */}
                <InfoBlock icon={Clock} color="#888" title="Real-world example">
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>{attack.realWorld}</p>
                </InfoBlock>

              </div>

              {/* Subtypes + key features row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>

                {/* Known subtypes */}
                <InfoBlock icon={Target} color={attack.color} title="Known subtypes / examples">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                    {attack.examples.map((ex, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: attack.color, marginTop: 5, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#666' }}>{ex}</span>
                      </div>
                    ))}
                  </div>
                </InfoBlock>

                {/* Key features */}
                <InfoBlock icon={Radar} color="#3b82f6" title="Key detection features (NSL-KDD)">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                    {attack.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', marginTop: 5, flexShrink: 0 }} />
                        <code style={{ fontSize: 11, color: '#3b82f6', background: 'rgba(59,130,246,0.08)', padding: '1px 6px', borderRadius: 3 }}>{f}</code>
                      </div>
                    ))}
                  </div>
                </InfoBlock>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function InfoBlock({ icon: Icon, color, title, children }) {
  return (
    <div style={{
      background: '#111',
      border: '1px solid #1a1a1a',
      borderRadius: 8,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function AttackInfo({ standalone = false }) {
  const [expanded, setExpanded] = useState(standalone ? true : false)
  const ready = useReady()

  if (standalone) {
    // Full page — just show the cards directly, no outer toggle
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {attacks.map((a, i) => (
          <AttackCard key={a.key} attack={a} index={i} />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      style={{ marginTop: 12 }}
    >
      {/* Section header */}
      <motion.div
        onClick={() => setExpanded(o => !o)}
        whileHover={{ background: '#161616' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: expanded ? '10px 10px 0 0' : 10,
          padding: '14px 18px',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <Info size={15} color="#3b82f6" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc', flex: 1 }}>Attack Type Encyclopedia</span>
        <span style={{ fontSize: 11, color: '#444', marginRight: 8 }}>
          {attacks.length} categories · click any card to expand
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} color="#444" />
        </motion.div>
      </motion.div>

      {/* Cards */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              background: '#111',
              border: '1px solid #1f1f1f',
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attacks.map((a, i) => (
                <AttackCard key={a.key} attack={a} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
