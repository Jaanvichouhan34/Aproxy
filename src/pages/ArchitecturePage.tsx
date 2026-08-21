import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Lock,
  Database,
  ArrowRight,
  Zap,
  Fingerprint,
  Radio,
  Network,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ArchitectureNode {
  id: string;
  name: string;
  category: string;
  role: string;
  latency: string;
  tech: string;
  details: string;
  icon: React.ReactNode;
}

export const ArchitecturePage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('node-hmac');

  const nodes: ArchitectureNode[] = [
    {
      id: 'node-client',
      name: 'Edge Student Client',
      category: 'Client Tier',
      role: 'On-device camera capture, 3D facial depth parallax evaluation, hardware enclave signature generation.',
      latency: '< 15ms',
      tech: 'TensorFlow Lite Edge + Secure Enclave',
      details:
        'Converts video stream into 512D mathematical vectors. Immediately destroys RGB frame from volatile memory.',
      icon: <Fingerprint className="w-5 h-5 text-accent-cyan" />,
    },
    {
      id: 'node-ws',
      name: 'WebSocket Edge Gateway',
      category: 'Transport Tier',
      role: 'High-throughput full-duplex communication channel distributing 1.0s rotating tokens to projector & client apps.',
      latency: '< 8ms',
      tech: 'Distributed Socket Mesh (uWebSockets)',
      details:
        'Handles 100k+ concurrent connections across multi-region edge servers with zero serialization bottleneck.',
      icon: <Radio className="w-5 h-5 text-brand-400" />,
    },
    {
      id: 'node-hmac',
      name: 'HMAC-SHA256 Token Verifier',
      category: 'Cryptographic Core',
      role: 'Validates ephemeral payload integrity and time window synchronization against rolling session salts.',
      latency: '< 2ms',
      tech: 'Native C++ Crypto Engine / OpenSSL 3.0',
      details:
        'Evaluates epoch quantized slots (1000ms). Rejects any payload with timestamp drift > 1000ms or invalid hash.',
      icon: <Lock className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'node-redis',
      name: 'Atomic Nonce Ledger',
      category: 'In-Memory Cache',
      role: 'Guarantees single-use nonce consumption via Redis atomic SETNX with automatic 10-second TTL expiry.',
      latency: '< 1ms',
      tech: 'Redis Cluster (Atomic Pipeline)',
      details:
        'Prevents race conditions when 500 students scan within the same second in a shared auditorium.',
      icon: <Zap className="w-5 h-5 text-accent-emerald" />,
    },
    {
      id: 'node-db',
      name: 'Immutable Merkle Ledger',
      category: 'Persistence Tier',
      role: 'Stores finalized attendance events cryptographically chained into an append-only audit trail.',
      latency: '< 12ms',
      tech: 'PostgreSQL + Merkle Tree Hashes',
      details:
        'Provides non-repudiation export certificates for university compliance, accreditation, and dispute audits.',
      icon: <Database className="w-5 h-5 text-accent-violet" />,
    },
  ];

  const activeNode = nodes.find((n) => n.id === selectedNode) || nodes[0];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col justify-between">
      <Navbar />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="brand" dot pulse>
            SYSTEM ARCHITECTURE & PROTOCOL
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            The Cryptographic <span className="text-gradient">Engine</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            A deep look into how Aproxy orchestrates ephemeral rotating nonces, edge zero-knowledge biometric vectors, and sub-50ms atomic state synchronization.
          </p>
        </div>

        {/* Interactive Protocol Flow Pipeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-brand-500" />
              End-to-End Cryptographic Lifecycle
            </h2>
            <span className="text-xs text-slate-500 font-mono">Click a node to inspect payload</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {nodes.map((node, idx) => {
              const isSelected = node.id === selectedNode;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between h-36 ${
                    isSelected
                      ? 'bg-white dark:bg-surface-dark border-brand-500 shadow-lg shadow-brand-500/20'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {node.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-brand-500 font-semibold block">
                      {node.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {node.name}
                    </h3>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-500">
                    Latency: {node.latency}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Node Inspector Card */}
          <div className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700">
                  {activeNode.icon}
                </div>
                <div>
                  <span className="text-xs font-mono text-brand-400">{activeNode.category}</span>
                  <h3 className="text-xl font-bold text-white">{activeNode.name}</h3>
                </div>
              </div>
              <Badge variant="brand" className="font-mono text-xs">
                Tech: {activeNode.tech}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-400">Operational Role</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{activeNode.role}</p>
                <div className="pt-2">
                  <span className="text-xs font-mono uppercase text-slate-400 block mb-1">
                    Internal Mechanics
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">{activeNode.details}</p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400 text-[11px] pb-1 border-b border-slate-800 flex justify-between">
                  <span>TELEMETRY_SAMPLE.json</span>
                  <span className="text-emerald-400">STATUS: 200 OK</span>
                </div>
                <pre className="text-brand-300 text-[11px] overflow-x-auto leading-relaxed">
                  {`{
  "nodeId": "${activeNode.id}",
  "tier": "${activeNode.category}",
  "processingLatency": "${activeNode.latency}",
  "cryptographicProof": "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "verificationWindowMs": 1000,
  "replayDefenseStatus": "ENFORCED"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Mathematical Specifications Section */}
        <div className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-8 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Mathematical & Cryptographic Formulations
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Formal definition of Aproxy's anti-replay and biometric vector comparison functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Equation 1: Dynamic Rolling Nonce */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-mono text-brand-600 dark:text-brand-400 font-bold uppercase">
                1. Ephemeral HMAC-SHA256 Token Generation
              </span>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 overflow-x-auto">
                <p className="text-slate-500 text-[11px] mb-1">// Quantized 1000ms epoch slot</p>
                <p className="font-bold">T_epoch = floor(Timestamp / 1000)</p>
                <p className="font-bold text-brand-600 dark:text-brand-300 mt-2">
                  HMAC_token = HMAC_SHA256(SessionSalt, ClassID || T_epoch || Nonce)
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tokens older than T_epoch - 1 are strictly rejected by the server clock verification filter.
              </p>
            </div>

            {/* Equation 2: Biometric Vector Cosine Similarity */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-mono text-brand-600 dark:text-brand-400 font-bold uppercase">
                2. Zero-Knowledge Biometric Vector Similarity
              </span>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 overflow-x-auto">
                <p className="text-slate-500 text-[11px] mb-1">// Normalized 512D Cosine Match</p>
                <p className="font-bold">CosineSim(u, v) = (u · v) / (||u||₂ · ||v||₂)</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  Threshold: CosineSim(u, v) ≥ 0.92
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Evaluated against the student enrollment hash on-device without exposing raw facial biometrics.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Experience the Protocol Live in our Interactive Sandbox
          </h3>
          <Link to="/demo">
            <Button variant="glow" size="lg">
              Launch Live Sandbox <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
