'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Brain, ChevronRight, ArrowRight, Shield, TrendingUp, Eye,
  Zap, Radio, Leaf, MapPin, BarChart3, AlertTriangle,
  Camera, Cpu, Activity, Globe, DollarSign,
  Users, Play, Check, Sparkles, Layers,
  Server, Code2, GitBranch,
  ChevronDown, Menu, X, ExternalLink,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   HOOKS
   ──────────────────────────────────────────────────────────────── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el); } },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const offset = (window.innerHeight - rect.top) * speed;
      ref.current.style.transform = `translateY(${offset}px)`;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [speed]);
  return ref;
}

/* ────────────────────────────────────────────────────────────────
   3D ROAD COMPONENT
   ──────────────────────────────────────────────────────────────── */
function Road3D() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '800px' }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[140%]"
        style={{
          transformOrigin: 'center bottom',
          transform: 'rotateX(55deg) translateZ(-100px)',
          height: '70vh',
        }}
      >
        {/* Road surface */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/[0.015] via-white/[0.005] to-transparent" />

        {/* Grid lines - horizontal */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0"
            style={{
              top: `${i * 5}%`,
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, rgba(99,102,241,${0.03 + i * 0.003}) 20%, rgba(99,102,241,${0.06 + i * 0.004}) 50%, rgba(99,102,241,${0.03 + i * 0.003}) 80%, transparent 100%)`,
            }}
          />
        ))}

        {/* Grid lines - vertical */}
        {Array.from({ length: 25 }, (_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0"
            style={{
              left: `${i * 4}%`,
              width: '1px',
              background: `linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.04) 40%, rgba(139,92,246,0.08) 100%)`,
            }}
          />
        ))}

        {/* Center lane */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-400/10 to-blue-400/20" />

        {/* Moving dashes on center lane */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 overflow-hidden">
          <div className="road-dashes absolute inset-0">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                className="absolute w-full bg-blue-400/30"
                style={{ top: `${i * 7}%`, height: '3%', borderRadius: '1px' }}
              />
            ))}
          </div>
        </div>

        {/* Glow at horizon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-indigo-500/[0.08] blur-[60px] rounded-full" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   3D FLOATING CARD
   ──────────────────────────────────────────────────────────────── */
function FloatingCard3D({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale3d(1.02, 1.02, 1.02)`;
    // Move inner glow
    const glow = card.querySelector('.card-glow') as HTMLElement;
    if (glow) {
      glow.style.left = `${e.clientX - rect.left}px`;
      glow.style.top = `${e.clientY - rect.top}px`;
      glow.style.opacity = '1';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
    const glow = card.querySelector('.card-glow') as HTMLElement;
    if (glow) glow.style.opacity = '0';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-transform duration-300 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="card-glow absolute w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-0 transition-opacity duration-300"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }}
      />
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PARTICLE FIELD
   ──────────────────────────────────────────────────────────────── */
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 40 }, (_, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full bg-white/[0.15]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particle-drift ${15 + Math.random() * 20}s linear infinite`,
            animationDelay: `${-Math.random() * 20}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   ANIMATED COUNTER
   ──────────────────────────────────────────────────────────────── */
function Counter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const inc = end / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += inc;
            if (current >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

/* ────────────────────────────────────────────────────────────────
   NAVBAR
   ──────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Problem', href: '#problem' },
    { label: 'Solution', href: '#solution' },
    { label: 'How It Works', href: '#how' },
    { label: 'Features', href: '#features' },
    { label: 'Impact', href: '#impact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? 'nav-blur bg-black/70 border-b border-white/[0.03]' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-500 group-hover:scale-110">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">
            Neuro<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400">Pave</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a key={l.label} href={l.href}
              className="px-4 py-2 text-[13px] text-white/30 hover:text-white font-medium rounded-xl hover:bg-white/[0.03] transition-all duration-300"
            >{l.label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/">
            <button className="px-5 py-2.5 text-[13px] font-semibold text-white/50 hover:text-white border border-white/[0.06] hover:border-white/15 rounded-xl transition-all duration-300 hover:bg-white/[0.03]">
              Dashboard
            </button>
          </Link>
          <Link href="/">
            <button className="group relative px-5 py-2.5 text-[13px] font-bold text-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:from-indigo-500 group-hover:to-purple-500" />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
              <span className="relative flex items-center gap-1.5">
                Live Demo
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
              </span>
            </button>
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl text-white/40 hover:text-white">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden nav-blur bg-black/95 border-t border-white/[0.03] px-6 py-4 space-y-1">
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm text-white/50 hover:text-white rounded-xl hover:bg-white/[0.03] transition-all"
            >{l.label}</a>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  /* Cursor light for hero */
  const heroRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal();
  const r5 = useReveal(), r6 = useReveal(), r7 = useReveal(), r8 = useReveal();
  const r9 = useReveal(), r10 = useReveal();
  const p1 = useParallax(0.05);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      <Navbar />

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* 3D Road */}
        <Road3D />

        {/* Particle field */}
        <ParticleField />

        {/* Cursor light */}
        <div
          className="absolute pointer-events-none w-[700px] h-[700px] rounded-full opacity-60"
          style={{
            left: mouse.x - 350, top: mouse.y - 350,
            background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, rgba(79,70,229,0.03) 40%, transparent 70%)',
            transition: 'left 0.15s ease-out, top 0.15s ease-out',
          }}
        />

        {/* Ambient orbs */}
        <div className="absolute top-[20%] left-[15%] w-[400px] h-[400px] rounded-full bg-indigo-600/[0.05] blur-[120px] orb-1" />
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-purple-600/[0.04] blur-[100px] orb-2" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/[0.03] blur-[130px] orb-3" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto pt-20">
          {/* Badge */}
          <div className="hero-text-in inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/[0.06] bg-white/[0.02] mb-10 backdrop-blur-sm">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
            </div>
            <span className="text-[11px] font-semibold text-white/40 tracking-widest uppercase">AI-Powered Infrastructure Intelligence</span>
          </div>

          {/* Headline */}
          <h1 className="hero-text-in-delay-1 text-[clamp(2.5rem,8vw,7rem)] font-extrabold tracking-[-0.03em] leading-[0.9] mb-8">
            <span className="block text-white/90">Reinventing Roads</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
              with AI
            </span>
          </h1>

          {/* Subheading */}
          <div className="hero-text-in-delay-2 flex items-center justify-center gap-4 text-white/20 text-sm sm:text-base font-medium tracking-widest uppercase mb-6">
            <span>Predict</span>
            <div className="w-1 h-1 rounded-full bg-indigo-400/50" />
            <span>Prevent</span>
            <div className="w-1 h-1 rounded-full bg-purple-400/50" />
            <span>Optimize</span>
          </div>

          {/* Description */}
          <p className="hero-text-in-delay-3 text-base sm:text-lg text-white/25 max-w-xl mx-auto leading-relaxed mb-12 font-light">
            NeuroPave uses AI to predict road damage and build smarter, safer cities.
            Real-time monitoring meets predictive analytics.
          </p>

          {/* CTAs */}
          <div className="hero-text-in-delay-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <button className="group relative flex items-center gap-3 px-8 py-4 text-sm font-bold rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.04] active:scale-[0.97] shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-shift" />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                <span className="relative flex items-center gap-2.5">
                  <Play className="w-4 h-4" />
                  Live Demo
                </span>
              </button>
            </Link>
            <a href="#solution">
              <button className="group flex items-center gap-3 px-8 py-4 text-sm font-semibold rounded-2xl border border-white/[0.06] hover:border-white/[0.15] text-white/40 hover:text-white/80 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 backdrop-blur-sm">
                <Eye className="w-4 h-4" />
                View Architecture
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 hero-text-in-delay-4">
            <span className="text-[9px] text-white/15 uppercase tracking-[0.3em] font-bold">Explore</span>
            <div className="w-5 h-8 rounded-full border border-white/[0.08] flex items-start justify-center p-1.5">
              <div className="w-1 h-2 rounded-full bg-white/20 animate-float" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ METRICS TICKER ═══════════════ */}
      <div className="relative border-y border-white/[0.03] bg-white/[0.01] py-5 overflow-hidden">
        <div className="ticker whitespace-nowrap flex items-center gap-16">
          {[...Array(2)].map((_, rep) => (
            <div key={rep} className="flex items-center gap-16 shrink-0">
              {[
                { label: 'Roads Monitored', value: '847+' },
                { label: 'Accuracy', value: '96%' },
                { label: 'Prediction Window', value: '30 Days' },
                { label: 'Cost Savings', value: '40%' },
                { label: 'CO₂ Reduced', value: '142t' },
                { label: 'Sensors Online', value: '2,400+' },
              ].map((item) => (
                <span key={item.label + rep} className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-white/20">{item.value}</span>
                  <span className="text-white/10 font-medium">{item.label}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ PROBLEM ═══════════════ */}
      <section id="problem" className="relative py-36 px-6">
        <div className="max-w-7xl mx-auto">
          <div ref={r1} className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/15 bg-orange-500/[0.03] mb-8">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400/70" />
              <span className="text-[11px] font-bold text-orange-300/50 uppercase tracking-widest">The Problem</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              Roads Are{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">Failing</span>
            </h2>
            <p className="text-base text-white/20 max-w-lg mx-auto font-light leading-relaxed">
              Outdated infrastructure management costs billions and risks lives every year.
            </p>
          </div>

          <div ref={r2} className="reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <AlertTriangle className="w-5 h-5" />, title: 'Poor Road Conditions', desc: '33% of highways are in poor or mediocre condition, impacting millions.', stat: '33%', color: '#f97316' },
              { icon: <Shield className="w-5 h-5" />, title: 'Fatal Accidents', desc: 'Over 150,000 road deaths per year — many preventable.', stat: '150K+', color: '#ef4444' },
              { icon: <DollarSign className="w-5 h-5" />, title: 'Massive Costs', desc: '₹3+ lakh crore spent annually on reactive repairs.', stat: '₹3L Cr', color: '#f59e0b' },
              { icon: <Activity className="w-5 h-5" />, title: 'Reactive Systems', desc: 'Fixing after failure instead of predicting and preventing.', stat: '0%', color: '#ec4899' },
            ].map((p, i) => (
              <FloatingCard3D
                key={p.title}
                className={`reveal-delay-${i + 1} rounded-2xl border border-white/[0.04] bg-white/[0.015] p-6 group cursor-default`}
              >
                <div className="relative z-10">
                  <div className="mb-5 p-2.5 w-fit rounded-xl" style={{ backgroundColor: p.color + '08', border: `1px solid ${p.color}15`, color: p.color }}>
                    {p.icon}
                  </div>
                  <p className="text-3xl font-extrabold mb-2 tabular-nums" style={{ color: p.color }}>{p.stat}</p>
                  <h3 className="text-sm font-bold text-white/70 mb-2">{p.title}</h3>
                  <p className="text-xs text-white/25 leading-relaxed">{p.desc}</p>
                </div>
              </FloatingCard3D>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SOLUTION ═══════════════ */}
      <section id="solution" className="relative py-36 px-6">
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div ref={p1} className="absolute top-0 left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600/[0.02] blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div ref={r3} className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/15 bg-indigo-500/[0.03] mb-8">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400/70" />
              <span className="text-[11px] font-bold text-indigo-300/50 uppercase tracking-widest">The Solution</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              Meet{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">NeuroPave</span>
            </h2>
            <p className="text-base text-white/20 max-w-lg mx-auto font-light leading-relaxed">
              AI-powered intelligence that detects, predicts, and optimizes — before damage becomes disaster.
            </p>
          </div>

          <div ref={r4} className="reveal grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01', title: 'Detect', subtitle: 'AI Vision Analysis',
                desc: 'Computer vision analyzes road imagery and sensor data to detect potholes, cracks, and rutting in real-time with 96% accuracy.',
                icon: <Eye className="w-6 h-6" />, color: '#6366f1',
              },
              {
                step: '02', title: 'Predict', subtitle: 'XGBoost ML Engine',
                desc: 'Gradient-boosted trees analyze 500+ features to predict failures up to 30 days in advance with 92% confidence.',
                icon: <Brain className="w-6 h-6" />, color: '#a855f7',
              },
              {
                step: '03', title: 'Optimize', subtitle: 'Smart Scheduling',
                desc: 'AI-generated maintenance schedules reduce costs by 40%, prioritize critical repairs, and minimize traffic disruption.',
                icon: <TrendingUp className="w-6 h-6" />, color: '#10b981',
              },
            ].map((sol, i) => (
              <FloatingCard3D
                key={sol.step}
                className={`reveal-delay-${i + 1} rounded-2xl border border-white/[0.04] bg-white/[0.015] p-8 group cursor-default relative overflow-hidden`}
              >
                {/* Large step number */}
                <div className="absolute -top-4 -right-2 text-[7rem] font-extrabold text-white/[0.015] leading-none select-none">{sol.step}</div>

                <div className="relative z-10">
                  <div className="mb-6 p-3 w-fit rounded-xl" style={{ backgroundColor: sol.color + '10', border: `1px solid ${sol.color}18`, color: sol.color }}>
                    {sol.icon}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: sol.color }}>{sol.subtitle}</p>
                  <h3 className="text-2xl font-extrabold text-white/85 mb-3 tracking-tight">{sol.title}</h3>
                  <p className="text-sm text-white/25 leading-relaxed">{sol.desc}</p>
                </div>

                {/* Bottom glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${sol.color}20, transparent)` }} />
              </FloatingCard3D>
            ))}
          </div>

          {/* Connector line */}
          <div className="hidden md:flex items-center justify-center mt-8 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ['#6366f1', '#a855f7', '#10b981'][i] + '40' }} />
                </div>
                {i < 2 && <div className="w-24 h-px bg-gradient-to-r from-white/[0.04] to-white/[0.04]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how" className="relative py-36 px-6">
        <div className="max-w-5xl mx-auto">
          <div ref={r5} className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/15 bg-purple-500/[0.03] mb-8">
              <Cpu className="w-3.5 h-3.5 text-purple-400/70" />
              <span className="text-[11px] font-bold text-purple-300/50 uppercase tracking-widest">Architecture</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              From Data to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Decision</span>
            </h2>
          </div>

          <div ref={r6} className="reveal relative space-y-6">
            {/* Timeline line */}
            <div className="absolute left-8 lg:left-12 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-emerald-500/20" />

            {[
              { step: 1, title: 'Data Collection', desc: 'IoT sensors, cameras, and GPR deployed across road networks capture vibration, strain, temperature, and visual data.', icon: <Camera className="w-5 h-5" />, color: '#6366f1', details: ['MEMS vibration sensors', 'Thermal cameras', 'Ground-penetrating radar', 'Traffic counters'] },
              { step: 2, title: 'AI Processing', desc: 'Raw data is preprocessed, normalized, and fed into our ML pipeline. Computer vision detects visual damage.', icon: <Cpu className="w-5 h-5" />, color: '#a855f7', details: ['OpenCV processing', '500+ feature engineering', 'Anomaly detection', 'Batch normalization'] },
              { step: 3, title: 'Prediction Engine', desc: 'XGBoost generates failure probability, remaining useful life, and SHAP-based feature importance.', icon: <Brain className="w-5 h-5" />, color: '#ec4899', details: ['500 tree estimators', 'SHAP explainability', 'Confidence scoring', '30-day risk window'] },
              { step: 4, title: 'Dashboard Output', desc: 'Results visualized in an interactive dashboard with live maps, risk rankings, and environmental metrics.', icon: <BarChart3 className="w-5 h-5" />, color: '#10b981', details: ['Interactive maps', 'Risk heatmaps', 'Maintenance scheduler', 'Report generation'] },
            ].map((step, i) => (
              <div key={step.step} className={`reveal-delay-${i + 1} relative flex gap-6 lg:gap-10 items-start`}>
                {/* Step indicator */}
                <div className="relative z-10 shrink-0 w-16 lg:w-24 flex justify-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: step.color + '08', borderColor: step.color + '15', color: step.color }}>
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <FloatingCard3D className="flex-1 rounded-2xl border border-white/[0.04] bg-white/[0.015] p-6 lg:p-8 cursor-default">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: step.color }}>Step {step.step}</span>
                      <div className="h-px flex-1 bg-white/[0.03]" />
                    </div>
                    <h3 className="text-xl font-bold text-white/80 mb-2 tracking-tight">{step.title}</h3>
                    <p className="text-sm text-white/25 leading-relaxed mb-4">{step.desc}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {step.details.map((d) => (
                        <div key={d} className="flex items-center gap-2 text-xs text-white/20">
                          <Check className="w-3 h-3 shrink-0" style={{ color: step.color + '80' }} />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </FloatingCard3D>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="relative py-36 px-6">
        <div className="max-w-7xl mx-auto">
          <div ref={r7} className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/15 bg-blue-500/[0.03] mb-8">
              <Zap className="w-3.5 h-3.5 text-blue-400/70" />
              <span className="text-[11px] font-bold text-blue-300/50 uppercase tracking-widest">Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              Built for the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Future</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Radio className="w-5 h-5" />, title: 'Real-time Monitoring', desc: 'Live feeds from thousands of sensor nodes, updating every 15 seconds.', color: '#3b82f6' },
              { icon: <Brain className="w-5 h-5" />, title: 'Predictive Maintenance', desc: '30-day failure forecasts with SHAP explainability.', color: '#8b5cf6' },
              { icon: <Globe className="w-5 h-5" />, title: 'Smart City Ready', desc: 'RESTful APIs for seamless municipal system integration.', color: '#06b6d4' },
              { icon: <DollarSign className="w-5 h-5" />, title: 'Cost Optimization', desc: 'AI-optimized scheduling cuts maintenance spending by 40%.', color: '#10b981' },
              { icon: <Shield className="w-5 h-5" />, title: 'Safety Intelligence', desc: 'Proactive hazard detection reduces incidents by 60%.', color: '#f59e0b' },
              { icon: <Leaf className="w-5 h-5" />, title: 'Carbon Tracking', desc: 'Optimized repairs reduce CO₂ by 142+ tonnes per quarter.', color: '#22c55e' },
            ].map((f) => (
              <FloatingCard3D key={f.title} className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-7 cursor-default group">
                <div className="relative z-10">
                  <div className="mb-5 p-2.5 w-fit rounded-xl" style={{ backgroundColor: f.color + '08', border: `1px solid ${f.color}12`, color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-white/75 mb-2">{f.title}</h3>
                  <p className="text-sm text-white/20 leading-relaxed">{f.desc}</p>
                </div>
              </FloatingCard3D>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TECH STACK ═══════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div ref={r8} className="reveal text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/15 bg-cyan-500/[0.03] mb-8">
              <Code2 className="w-3.5 h-3.5 text-cyan-400/70" />
              <span className="text-[11px] font-bold text-cyan-300/50 uppercase tracking-widest">Tech Stack</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Modern Tech</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { name: 'React / Next.js', icon: <Globe className="w-6 h-6" />, color: '#61dafb' },
              { name: 'Node.js', icon: <Server className="w-6 h-6" />, color: '#68a063' },
              { name: 'XGBoost', icon: <Brain className="w-6 h-6" />, color: '#f59e0b' },
              { name: 'OpenCV', icon: <Eye className="w-6 h-6" />, color: '#5c3ee8' },
              { name: 'REST APIs', icon: <GitBranch className="w-6 h-6" />, color: '#ec4899' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="tech-glow relative p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] text-center group cursor-default"
                style={{ color: tech.color }}
              >
                <div className="mb-2.5 flex justify-center opacity-40 group-hover:opacity-90 transition-all duration-500">
                  {tech.icon}
                </div>
                <p className="text-[11px] font-bold text-white/30 group-hover:text-white/70 transition-all duration-500">{tech.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ IMPACT ═══════════════ */}
      <section id="impact" className="relative py-36 px-6">
        <div className="max-w-7xl mx-auto">
          <div ref={r9} className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.03] mb-8">
              <Globe className="w-3.5 h-3.5 text-emerald-400/70" />
              <span className="text-[11px] font-bold text-emerald-300/50 uppercase tracking-widest">Impact</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              Measurable{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Impact</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {[
              { value: 60, suffix: '%', label: 'Fewer Accidents', color: '#22c55e', icon: <Shield className="w-5 h-5" /> },
              { value: 40, suffix: '%', label: 'Cost Reduction', color: '#3b82f6', icon: <DollarSign className="w-5 h-5" /> },
              { value: 142, suffix: 't', label: 'CO₂ Saved / Quarter', color: '#10b981', icon: <Leaf className="w-5 h-5" /> },
              { value: 847, suffix: '+', label: 'Roads Monitored', color: '#8b5cf6', icon: <MapPin className="w-5 h-5" /> },
            ].map((s) => (
              <FloatingCard3D key={s.label} className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-8 text-center cursor-default">
                <div className="relative z-10">
                  <div className="mb-3 flex justify-center" style={{ color: s.color }}>{s.icon}</div>
                  <p className="text-4xl lg:text-5xl font-extrabold mb-1 tabular-nums" style={{ color: s.color }}>
                    <Counter end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs font-bold text-white/40">{s.label}</p>
                </div>
              </FloatingCard3D>
            ))}
          </div>

          {/* Emotional quote */}
          <div className="relative p-12 lg:p-16 rounded-3xl border border-white/[0.04] bg-white/[0.01] text-center overflow-hidden">
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-emerald-500/[0.015] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-indigo-500/[0.015] rounded-full blur-[100px]" />
            <p className="relative text-xl sm:text-2xl lg:text-3xl font-extrabold text-white/50 leading-relaxed max-w-3xl mx-auto tracking-tight">
              &ldquo;Every pothole detected is an accident prevented.
              <br />
              Every prediction made is a life{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">protected</span>.&rdquo;
            </p>
            <p className="relative text-xs text-white/15 mt-8 font-semibold uppercase tracking-widest">— The NeuroPave Mission</p>
          </div>
        </div>
      </section>

      {/* ═══════════════ DEMO PREVIEW ═══════════════ */}
      <section id="demo" className="relative py-36 px-6">
        <div className="max-w-6xl mx-auto">
          <div ref={r10} className="reveal text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/15 bg-violet-500/[0.03] mb-8">
              <BarChart3 className="w-3.5 h-3.5 text-violet-400/70" />
              <span className="text-[11px] font-bold text-violet-300/50 uppercase tracking-widest">Preview</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              See It in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Action</span>
            </h2>
          </div>

          {/* Dashboard mockup with 3D tilt */}
          <FloatingCard3D className="rounded-3xl border border-white/[0.04] bg-white/[0.01] overflow-hidden cursor-default">
            <div className="relative z-10">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.03]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/[0.06]" />
                  <div className="w-3 h-3 rounded-full bg-white/[0.06]" />
                  <div className="w-3 h-3 rounded-full bg-white/[0.06]" />
                </div>
                <div className="flex-1 max-w-md mx-auto h-7 bg-white/[0.02] rounded-lg border border-white/[0.04] flex items-center justify-center">
                  <span className="text-[10px] text-white/15 font-mono">neuropave.ai/dashboard</span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-6 space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'AI Risk Score', value: '23.4%', color: '#22c55e' },
                    { label: 'Roads Monitored', value: '847', color: '#6366f1' },
                    { label: 'Predicted Failures', value: '12', color: '#f59e0b' },
                    { label: 'CO₂ Saved', value: '142t', color: '#22c55e' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                      <p className="text-[9px] text-white/15 uppercase tracking-wider mb-1">{kpi.label}</p>
                      <p className="text-xl font-extrabold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[1fr_300px] gap-4">
                  {/* Chart */}
                  <div className="rounded-xl bg-white/[0.015] border border-white/[0.03] p-4 relative overflow-hidden">
                    <p className="text-[9px] text-white/15 uppercase tracking-wider mb-3">AI Prediction — 30 Day Forecast</p>
                    <svg className="w-full h-40" viewBox="0 0 500 150" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="mockGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#6366f1" stopOpacity="0.15" />
                          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid */}
                      {[0, 30, 60, 90, 120, 150].map((y) => (
                        <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                      ))}
                      {/* Area */}
                      <path d="M0,120 Q60,110 120,90 T240,60 T360,75 T480,40 L500,40 V150 H0 Z" fill="url(#mockGrad)" />
                      {/* Lines */}
                      <path d="M0,120 Q60,110 120,90 T240,60 T360,75 T480,40" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.7" />
                      <path d="M0,125 Q60,115 120,100 T240,75 T300,80" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.5" />
                    </svg>
                  </div>

                  {/* Prediction card */}
                  <div className="rounded-xl bg-white/[0.015] border border-white/[0.03] p-4">
                    <p className="text-[9px] text-white/15 uppercase tracking-wider mb-3">Prediction Output</p>
                    <div className="text-center py-3">
                      <p className="text-3xl font-extrabold text-rose-400 tabular-nums">67.2%</p>
                      <p className="text-[9px] text-white/15 uppercase tracking-wider mt-1">Failure Risk</p>
                    </div>
                    <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden mb-3">
                      <div className="h-full w-[67%] bg-gradient-to-r from-orange-500 to-rose-500 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                        <p className="text-sm font-bold text-indigo-300">12</p>
                        <p className="text-[8px] text-white/15">Months RUL</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                        <p className="text-sm font-bold text-emerald-300">91%</p>
                        <p className="text-[8px] text-white/15">Confidence</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="rounded-xl bg-gradient-to-br from-blue-950/10 via-black to-emerald-950/10 border border-white/[0.03] h-32 flex items-center justify-center relative overflow-hidden">
                  {/* Fake map dots */}
                  {[
                    { x: '20%', y: '30%', c: '#22c55e' }, { x: '35%', y: '60%', c: '#f59e0b' },
                    { x: '55%', y: '25%', c: '#22c55e' }, { x: '70%', y: '55%', c: '#ef4444' },
                    { x: '45%', y: '70%', c: '#22c55e' }, { x: '80%', y: '35%', c: '#f59e0b' },
                  ].map((dot, i) => (
                    <div key={i} className="absolute" style={{ left: dot.x, top: dot.y }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot.c, boxShadow: `0 0 8px ${dot.c}40` }} />
                    </div>
                  ))}
                  <MapPin className="w-5 h-5 text-white/[0.04]" />
                </div>
              </div>
            </div>
          </FloatingCard3D>
        </div>
      </section>

      {/* ═══════════════ VISION ═══════════════ */}
      <section className="relative py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/15 bg-amber-500/[0.03] mb-8">
            <Users className="w-3.5 h-3.5 text-amber-400/70" />
            <span className="text-[11px] font-bold text-amber-300/50 uppercase tracking-widest">Vision</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
            Building the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Nervous System</span>{' '}
            of Smart Cities
          </h2>
          <p className="text-sm text-white/20 leading-relaxed max-w-xl mx-auto font-light">
            We envision a world where every road is intelligent — where infrastructure doesn&apos;t just carry traffic,
            it communicates, adapts, and heals. NeuroPave is the foundation of that future.
          </p>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative py-36 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-600/[0.03] blur-[200px]" />
        </div>
        <ParticleField />

        <div className="max-w-3xl mx-auto relative text-center">
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                <Brain className="w-9 h-9 text-white" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/15 pulse-ring" />
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Join the Future of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Smart Infrastructure</span>
          </h2>
          <p className="text-base text-white/20 max-w-md mx-auto mb-12 font-light leading-relaxed">
            Experience the power of AI-driven infrastructure intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <button className="group relative flex items-center gap-3 px-10 py-5 text-base font-bold rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.04] active:scale-[0.97] shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-shift" />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                <span className="relative flex items-center gap-2.5">
                  <Play className="w-5 h-5" />
                  Try Live Demo
                </span>
              </button>
            </Link>
            <a href="mailto:contact@neuropave.ai">
              <button className="group flex items-center gap-3 px-10 py-5 text-base font-semibold rounded-2xl border border-white/[0.06] hover:border-white/[0.15] text-white/30 hover:text-white/70 transition-all duration-500">
                Contact Us
                <ExternalLink className="w-4 h-4" />
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-white/30">NeuroPave</span>
              <span className="text-white/[0.04]">|</span>
              <span className="text-[11px] text-white/10">AI Road Health Intelligence</span>
            </div>
            <div className="flex items-center gap-8">
              {['Privacy', 'Terms', 'Docs'].map((l) => (
                <a key={l} href="#" className="text-[11px] text-white/15 hover:text-white/40 transition-all duration-300 font-medium">{l}</a>
              ))}
            </div>
            <p className="text-[11px] text-white/10">© 2024 NeuroPave. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
