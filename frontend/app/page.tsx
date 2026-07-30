"use client";

import { useState, useEffect } from "react";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

type MatchResult = {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
};

function getSignalTier(score: number) {
  if (score >= 75) return { label: "STRONG SIGNAL", color: "#4FB8A6" };
  if (score >= 50) return { label: "PARTIAL SIGNAL", color: "#C99A4B" };
  return { label: "WEAK SIGNAL", color: "#E2665A" };
}

function Gauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setAnimated(Math.round(progress * score));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const tier = getSignalTier(score);
  const dashOffset = 100 - animated;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-64">
        {/* background track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(237,231,218,0.12)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* progress arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={tier.color}
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
        {/* ticks: 0, 50, 100 */}
        <line x1="20" y1="100" x2="8" y2="100" stroke="rgba(237,231,218,0.3)" strokeWidth="2" />
        <line x1="100" y1="20" x2="100" y2="8" stroke="rgba(237,231,218,0.3)" strokeWidth="2" />
        <line x1="180" y1="100" x2="192" y2="100" stroke="rgba(237,231,218,0.3)" strokeWidth="2" />
        <text x="4" y="107" fontSize="8" fill="rgba(237,231,218,0.5)" className={mono.className}>0</text>
        <text x="94" y="6" fontSize="8" fill="rgba(237,231,218,0.5)" className={mono.className}>50</text>
        <text x="182" y="107" fontSize="8" fill="rgba(237,231,218,0.5)" className={mono.className}>100</text>
      </svg>

      <div className={`${mono.className} -mt-8 text-5xl text-[#EDE7DA]`}>
        {animated}
        <span className="text-xl text-[#EDE7DA]/50">%</span>
      </div>
      <div
        className={`${mono.className} mt-1 text-xs tracking-[0.2em]`}
        style={{ color: tier.color }}
      >
        {tier.label}
      </div>
    </div>
  );
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!resumeFile || !jobDescription.trim()) {
      setError("Load a resume and paste a job description first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_description", jobDescription);

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/match", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't reach the analyzer. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F1420] text-[#EDE7DA] px-6 py-16">
      <div className="max-w-xl mx-auto">
        <div className={`${mono.className} text-xs tracking-[0.25em] text-[#C99A4B] mb-3`}>
          RESUME SIGNAL ANALYZER
        </div>
        <h1 className={`${display.className} text-3xl font-bold mb-3`}>
          Does your resume tune to the role?
        </h1>
        <p className="text-[#EDE7DA]/60 mb-10 leading-relaxed">
          Load a resume and a job post. We&apos;ll show you where the signal is strong,
          and exactly where it drops out.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-[#171D2B] border border-white/10 rounded-2xl p-6 space-y-5"
        >
          <div>
            <label className={`${mono.className} block text-xs tracking-widest text-[#EDE7DA]/50 mb-2`}>
              RESUME (PDF)
            </label>
            <label className="flex items-center justify-between border border-dashed border-white/20 rounded-lg px-4 py-3 cursor-pointer hover:border-[#C99A4B]/60 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-[#C99A4B]">
              <span className={`${mono.className} text-sm text-[#EDE7DA]/70`}>
                {resumeFile ? resumeFile.name : "Choose a file…"}
              </span>
              <span className={`${mono.className} text-xs text-[#C99A4B]`}>BROWSE</span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div>
            <label className={`${mono.className} block text-xs tracking-widest text-[#EDE7DA]/50 mb-2`}>
              JOB DESCRIPTION
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={7}
              placeholder="Paste the job posting here…"
              className="w-full bg-[#0F1420] border border-white/10 rounded-lg px-4 py-3 text-sm text-[#EDE7DA] placeholder:text-[#EDE7DA]/30 focus:outline-none focus:ring-2 focus:ring-[#C99A4B] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${mono.className} w-full bg-[#C99A4B] text-[#0F1420] text-sm tracking-[0.2em] font-semibold py-3 rounded-lg disabled:opacity-40 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#EDE7DA]`}
          >
            {loading ? "ANALYZING…" : "RUN ANALYSIS"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-[#E2665A]">{error}</p>
        )}

        {result && (
          <div className="mt-10 bg-[#171D2B] border border-white/10 rounded-2xl p-8">
            <div className="flex justify-center mb-8">
              <Gauge score={result.match_score} />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className={`${mono.className} text-xs tracking-widest text-[#4FB8A6] mb-3`}>
                  SIGNAL PRESENT
                </div>
                <ul className="space-y-2">
                  {result.matched_skills.map((skill) => (
                    <li key={skill} className={`${mono.className} text-sm flex items-center gap-2`}>
                      <span className="text-[#4FB8A6]">▮</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className={`${mono.className} text-xs tracking-widest text-[#E2665A] mb-3`}>
                  SIGNAL ABSENT
                </div>
                <ul className="space-y-2">
                  {result.missing_skills.map((skill) => (
                    <li key={skill} className={`${mono.className} text-sm flex items-center gap-2 text-[#EDE7DA]/70`}>
                      <span className="text-[#E2665A]">▯</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className={`${mono.className} text-xs tracking-widest text-[#C99A4B] mb-3`}>
                TUNING SUGGESTIONS
              </div>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-[#EDE7DA]/85">
                    <span className="text-[#C99A4B]">›</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}