"use client";

import { useState, useRef, useCallback, useEffect, MouseEvent } from "react";

type Status = "idle" | "loading" | "processing" | "done" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FFmpegInstance = any;

/* ─── Particle background ───────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; color: string;
    }[] = [];

    const COLORS = ["#7c3aed", "#c026d3", "#f43f5e", "#f97316", "#fbbf24", "#06b6d4"];

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function spawn() {
      particles.push({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        r: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.5 + 0.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    for (let i = 0; i < 120; i++) spawn();

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.alpha;
        ctx!.fill();
        ctx!.globalAlpha = 1;

        /* soft glow */
        const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, p.color + "44");
        g.addColorStop(1, "transparent");
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.globalAlpha = p.alpha * 0.4;
        ctx!.fill();
        ctx!.globalAlpha = 1;

        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10 || p.x < -10 || p.x > canvas!.width + 10) {
          particles.splice(i, 1);
          spawn();
        }
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="particle-canvas" />;
}

/* ─── Sound wave ────────────────────────────────────────── */
function SoundWave() {
  return (
    <div className="sound-wave">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="sound-bar" />
      ))}
    </div>
  );
}

/* ─── Hero icon (CSS 3-D speaker) ──────────────────────── */
function HeroIcon() {
  return (
    <div className="hero-icon-wrap">
      <div className="hero-icon-ring hero-icon-ring-1" />
      <div className="hero-icon-ring hero-icon-ring-2" />
      <div className="hero-icon-ring hero-icon-ring-3" />
      <div className="hero-icon-core">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Circular progress ─────────────────────────────────── */
function CircularProgress({ value }: { value: number }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="circular-progress">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#7c3aed" />
            <stop offset="40%"  stopColor="#c026d3" />
            <stop offset="70%"  stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle className="circular-track" cx="100" cy="100" r={r} />
        <circle
          className="circular-fill"
          cx="100" cy="100" r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="circular-center">
        <span className="text-4xl font-extrabold text-aurora font-display">
          {value}
        </span>
        <span className="text-sm text-text-secondary font-semibold tracking-widest">%</span>
      </div>
    </div>
  );
}

/* ─── Confetti burst ────────────────────────────────────── */
function spawnConfetti() {
  const COLORS = ["#c026d3","#f43f5e","#f97316","#fbbf24","#7c3aed","#06b6d4","#10b981"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.cssText = [
      `left:${Math.random() * 100}vw`,
      `top:-10px`,
      `width:${Math.random() * 8 + 4}px`,
      `height:${Math.random() * 14 + 6}px`,
      `background:${color}`,
      `animation-duration:${Math.random() * 2 + 1.5}s`,
      `animation-delay:${Math.random() * 0.8}s`,
      `transform:rotate(${Math.random() * 360}deg)`,
    ].join(";");
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

/* ─── Tilt card wrapper ─────────────────────────────────── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    el.style.transform = `perspective(1200px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg) scale(1.01)`;
    el.style.boxShadow = `
      ${-dx * 12}px ${dy * 12}px 40px -10px rgba(124,58,237,0.25),
      0 20px 60px -20px rgba(0,0,0,0.5)
    `;
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.boxShadow = "";
  }

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [fileName, setFileName] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpegInstance>(null);
  const [ffmpegReady, setFfmpegReady] = useState(false);

  /* ── FFmpeg logic (unchanged) ── */
  const loadFFmpeg = useCallback(async (): Promise<FFmpegInstance> => {
    if (ffmpegRef.current && ffmpegReady) return ffmpegRef.current;

    setProgressText("오디오 엔진을 준비하고 있습니다... (처음 한 번만)");
    setProgress(0);

    // @ts-expect-error local ESM import
    const { FFmpeg } = await import(/* webpackIgnore: true */ "/ffmpeg/index.js");

    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress: p }: { progress: number }) => {
      const pct = Math.min(Math.max(Math.round(p * 100), 0), 100);
      setProgress(pct);
    });

    await ffmpeg.load({
      coreURL: "/ffmpeg/ffmpeg-core.js",
      wasmURL: "/ffmpeg/ffmpeg-core.wasm",
    });

    ffmpegRef.current = ffmpeg;
    setFfmpegReady(true);
    return ffmpeg;
  }, [ffmpegReady]);

  const processFile = useCallback(
    async (file: File) => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const isVideo = ["mp4", "mov", "mkv", "avi", "webm"].includes(ext);
      const inputName = `input.${ext}`;
      const outExt = isVideo ? ext : "mp3";
      const tempName = `temp.${outExt}`;
      const outputName = `output.${outExt}`;

      setFileName(file.name);
      setStatus("loading");
      setErrorMsg("");
      setProgress(0);

      try {
        const ffmpeg = await loadFFmpeg();

        setStatus("processing");
        setProgressText("파일을 읽고 있습니다...");
        setProgress(5);

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        await ffmpeg.writeFile(inputName, uint8Array);

        const audioCodec = isVideo
          ? ["-c:a", "aac", "-b:a", "192k"]
          : ["-c:a", "libmp3lame", "-q:a", "2"];
        const videoCodec = isVideo ? ["-c:v", "copy"] : [];

        setProgressText("1단계: 소리 크기를 균일하게 맞추고 있습니다...");
        setProgress(10);
        await ffmpeg.exec([
          "-i", inputName,
          ...videoCodec,
          "-af", "acompressor=threshold=-20dB:ratio=4:attack=10:release=200:makeup=2,alimiter=limit=-1.5dB:level=false",
          ...audioCodec,
          tempName,
        ]);

        setProgressText("2단계: 유튜브 표준 볼륨에 맞추고 있습니다...");
        setProgress(55);
        await ffmpeg.exec([
          "-i", tempName,
          ...videoCodec,
          "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
          ...audioCodec,
          outputName,
        ]);

        setProgressText("완료 파일을 준비하고 있습니다...");
        setProgress(90);
        const data = await ffmpeg.readFile(outputName);
        const mimeType = isVideo ? `video/${ext}` : "audio/mpeg";
        const blob = new Blob([new Uint8Array(data)], { type: mimeType });
        const url = URL.createObjectURL(blob);

        setDownloadUrl(url);
        setDownloadName(`${baseName}_normalized.${outExt}`);
        setProgress(100);
        setStatus("done");
        setProgressText("");
        spawnConfetti();

        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(tempName);
          await ffmpeg.deleteFile(outputName);
        } catch {
          // ignore
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMsg(
          "처리 중 오류가 발생했습니다. 파일이 올바른 오디오/비디오 파일인지 확인해주세요."
        );
      }
    },
    [downloadUrl, loadFFmpeg]
  );

  const handleFile = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      const validExts = [
        "mp3", "wav", "m4a", "aac", "flac", "ogg",
        "mp4", "mov", "mkv", "avi", "webm",
      ];

      if (!validExts.includes(ext || "")) {
        setStatus("error");
        setErrorMsg(
          "지원하지 않는 파일 형식입니다. MP3, WAV, M4A, MP4, MOV 등의 파일을 사용해주세요."
        );
        return;
      }
      processFile(file);
    },
    [processFile]
  );

  const reset = useCallback(() => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setStatus("idle");
    setProgress(0);
    setProgressText("");
    setFileName("");
    setDownloadUrl(null);
    setDownloadName("");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [downloadUrl]);

  /* ─────────────────────────────────────────────────────── */
  return (
    <main className="flex-1 flex flex-col">
      <ParticleCanvas />

      {/* ── Hero header ────────────────────────────────── */}
      <header className="px-6 pt-16 pb-12 text-center fade-up">
        {/* 3D icon */}
        <div className="mb-10">
          <HeroIcon />
        </div>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-5 text-aurora text-glow">
          오디오 노멀라이저
        </h1>

        <p className="text-xl sm:text-2xl text-text-secondary max-w-lg mx-auto leading-relaxed">
          오디오 &amp; 비디오 파일의 소리 크기를
          <br />
          <span className="text-aurora-cool font-semibold">유튜브 표준</span>에 맞게 자동으로 보정합니다
        </p>

        {/* pill tags */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 fade-up delay-200">
          {["MP3", "WAV", "M4A", "FLAC", "MP4", "MOV"].map((fmt) => (
            <span key={fmt}
              className="px-4 py-1.5 rounded-full text-sm font-semibold
                         bg-white/5 border border-white/10 text-text-secondary
                         hover:border-aurora-violet/50 hover:text-text-primary transition-all duration-300">
              {fmt}
            </span>
          ))}
        </div>
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center px-4 pb-20">
        <div className="w-full max-w-2xl space-y-8">

          {/* ── Main card ── */}
          <TiltCard>
            <div className="glass-card p-8 sm:p-12 fade-up delay-100">

              {/* IDLE: circular orbit upload zone */}
              {status === "idle" && (
                <div className="flex flex-col items-center">
                  <div
                    className={`upload-orbit-wrap ${dragOver ? "drag-over" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFile(e.dataTransfer.files);
                    }}
                  >
                    <div className="upload-orbit-ring upload-orbit-ring-1" />
                    <div className="upload-orbit-ring upload-orbit-ring-2" />
                    <div className="upload-orbit-ring upload-orbit-ring-3" />
                    <div className="upload-orbit-dot upload-orbit-dot-1" />
                    <div className="upload-orbit-dot upload-orbit-dot-2" />

                    <div className="upload-orbit-core">
                      <div className="upload-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                          stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-text-primary text-center px-4 leading-snug">
                        파일을 여기에<br />놓으세요
                      </p>
                      <p className="text-sm text-text-muted">또는 클릭해서 선택</p>
                    </div>
                  </div>

                  <p className="mt-10 text-base text-text-muted text-center">
                    클릭하거나 파일을 끌어다 놓으세요
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.mp4,.mov,.mkv,.avi,.webm"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files)}
                  />
                </div>
              )}

              {/* LOADING / PROCESSING: circular progress */}
              {(status === "loading" || status === "processing") && (
                <div className="flex flex-col items-center py-4 fade-up">
                  <div className="mb-8">
                    <SoundWave />
                  </div>

                  <CircularProgress value={progress} />

                  <div className="mt-8 text-center space-y-2">
                    <p className="text-lg font-bold text-text-primary truncate max-w-xs">
                      {fileName}
                    </p>
                    <p className="text-base font-medium"
                      style={{ color: "#c026d3" }}>
                      {progressText}
                    </p>
                  </div>
                </div>
              )}

              {/* DONE */}
              {status === "done" && (
                <div className="flex flex-col items-center py-4 fade-up">
                  {/* sparkle burst */}
                  <div className="success-burst mb-6">
                    <div className="success-burst-core" />
                    <div className="success-icon-wrap">
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>

                  <p className="text-3xl sm:text-4xl font-extrabold font-display mb-2"
                    style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    처리 완료!
                  </p>
                  <p className="text-base text-text-secondary mb-10 max-w-xs text-center truncate">
                    {fileName}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <a
                      href={downloadUrl!}
                      download={downloadName}
                      className="btn-aurora flex-1 inline-flex items-center justify-center gap-3
                                 text-white text-lg font-bold px-8 py-5 rounded-2xl"
                    >
                      <span className="flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        파일 다운로드
                      </span>
                    </a>
                    <button
                      onClick={reset}
                      className="btn-secondary flex-1 inline-flex items-center justify-center gap-2
                                 text-text-primary text-lg font-semibold px-8 py-5 rounded-2xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                      </svg>
                      다른 파일
                    </button>
                  </div>
                </div>
              )}

              {/* ERROR */}
              {status === "error" && (
                <div className="flex flex-col items-center py-4 text-center fade-up">
                  <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30
                                  flex items-center justify-center mb-6
                                  shadow-[0_0_32px_rgba(244,63,94,0.2)]">
                    <svg className="w-12 h-12 text-danger-glow" fill="none" stroke="currentColor"
                      strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-extrabold font-display text-danger-glow mb-3">
                    오류가 발생했습니다
                  </p>
                  <p className="text-base text-text-secondary mb-8 max-w-sm leading-relaxed">
                    {errorMsg}
                  </p>
                  <button
                    onClick={reset}
                    className="btn-aurora inline-flex items-center gap-2
                               text-white text-lg font-bold px-10 py-5 rounded-2xl"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                      </svg>
                      다시 시도하기
                    </span>
                  </button>
                </div>
              )}
            </div>
          </TiltCard>

          {/* ── How to use ── */}
          <TiltCard>
            <section className="glass-card glass-card-hover p-8 sm:p-10 fade-up delay-200">
              <h2 className="font-display text-2xl font-extrabold text-text-primary mb-8">
                사용 방법
              </h2>
              <div className="space-y-6">
                {[
                  {
                    num: 1,
                    title: "파일 선택",
                    desc: "원형 영역을 클릭하거나, 파일을 끌어다 놓으세요",
                  },
                  {
                    num: 2,
                    title: "자동 처리",
                    desc: "소리 크기 보정과 유튜브 표준 맞춤이 자동으로 진행됩니다",
                  },
                  {
                    num: 3,
                    title: "다운로드",
                    desc: '"파일 다운로드" 버튼을 눌러 완성된 파일을 저장하세요',
                  },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-5">
                    <div className="step-badge text-white text-xl font-extrabold font-display">
                      {step.num}
                    </div>
                    <div className="pt-1">
                      <p className="text-lg font-bold text-text-primary">{step.title}</p>
                      <p className="text-base text-text-secondary mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </TiltCard>

          {/* ── What it does ── */}
          <TiltCard>
            <section className="glass-card glass-card-hover p-8 sm:p-10 fade-up delay-300">
              <h2 className="font-display text-2xl font-extrabold text-text-primary mb-8">
                이 도구가 하는 일
              </h2>
              <div className="space-y-4">
                {[
                  {
                    iconClass: "icon-glow-violet",
                    color: "#7c3aed",
                    bgFrom: "rgba(124,58,237,0.2)",
                    bgTo: "rgba(192,38,211,0.2)",
                    icon: (
                      <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                    ),
                    title: "소리 크기 균일화",
                    desc: "너무 큰 소리는 줄이고, 너무 작은 소리는 키워서 TV 방송처럼 편안하게 들을 수 있습니다.",
                  },
                  {
                    iconClass: "icon-glow-rose",
                    color: "#f43f5e",
                    bgFrom: "rgba(244,63,94,0.2)",
                    bgTo: "rgba(249,115,22,0.2)",
                    icon: (
                      <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    ),
                    title: "유튜브 표준 볼륨",
                    desc: "유튜브 권장 기준(-16 LUFS)에 맞춰 음질 손실 없이 최적의 소리로 재생됩니다.",
                  },
                  {
                    iconClass: "icon-glow-green",
                    color: "#10b981",
                    bgFrom: "rgba(16,185,129,0.2)",
                    bgTo: "rgba(6,182,212,0.2)",
                    icon: (
                      <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    ),
                    title: "안전한 처리",
                    desc: "모든 처리가 브라우저 안에서 이루어집니다. 파일이 서버로 전송되지 않습니다.",
                  },
                ].map((feature, i) => (
                  <div key={i} className="feature-item flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${feature.bgFrom}, ${feature.bgTo})` }}>
                      <div className={feature.iconClass}>{feature.icon}</div>
                    </div>
                    <div className="pt-1">
                      <p className="text-lg font-bold text-text-primary">{feature.title}</p>
                      <p className="text-base text-text-secondary mt-1 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </TiltCard>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center border-t border-white/5 space-y-2">
        <p className="text-sm text-text-muted">
          브라우저에서 처리되므로 파일이 외부로 전송되지 않습니다
        </p>
        <p className="text-xs text-text-muted/60">
          Powered by <a href="https://github.com/nickvdyck/ffmpeg-wasm-demo" className="underline hover:text-text-muted transition-colors" target="_blank" rel="noopener noreferrer">FFmpeg.wasm</a> (LGPL-2.1) &middot; <a href="https://www.ffmpeg.org/legal.html" className="underline hover:text-text-muted transition-colors" target="_blank" rel="noopener noreferrer">FFmpeg License</a>
        </p>
      </footer>
    </main>
  );
}
