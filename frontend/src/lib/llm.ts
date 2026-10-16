/**
 * LLM HANYA menjelaskan hasil triase; skor & level diputuskan aturan di triage-rules.ts.
 * Bila API key kosong / LLM gagal / lambat (>8 dtk) -> otomatis memakai penjelasan berbasis aturan.
 */
import type { TriageEvaluation } from "@/types";

export interface TriageExplanation {
  ringkasan: string;
  alasan: string[];
  saran_umum: string;
  disclaimer: string;
  source: "llm" | "fallback";
}

const SYSTEM = `Kamu asisten penjelas hasil pre-triase puskesmas.
Skor dan level SUDAH diputuskan oleh aturan baku. TUGASMU HANYA MENJELASKAN, bukan mengubah atau mempertanyakan skor.
Dilarang: memberi diagnosis, menyebut nama penyakit sebagai kesimpulan, menyarankan obat atau dosis.
Gunakan bahasa Indonesia sederhana dan menenangkan.
Balas HANYA JSON valid tanpa teks lain:
{"ringkasan": string (maks 2 kalimat), "alasan": string[] (maks 4 butir), "saran_umum": string (1 kalimat)}`;

export async function explainTriage(t: TriageEvaluation): Promise<TriageExplanation> {
  const fallback: TriageExplanation = {
    ringkasan: t.patientExplanation,
    alasan: t.triggeredRules.slice(0, 4),
    saran_umum: "",
    disclaimer: t.disclaimer,
    source: "fallback",
  };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 400,
        system: SYSTEM,
        messages: [{
          role: "user",
          content: JSON.stringify({ level: t.urgencyLevel, skor: t.urgencyScore, judul: t.title, aturan_terpicu: t.triggeredRules }),
        }],
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const text = (data.content ?? []).map((b: any) => (b.type === "text" ? b.text : "")).join("");
    const p = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (typeof p.ringkasan !== "string" || !Array.isArray(p.alasan) || typeof p.saran_umum !== "string") return fallback;
    // Disclaimer SELALU dari kode, bukan dari LLM
    return { ringkasan: p.ringkasan, alasan: p.alasan.slice(0, 4), saran_umum: p.saran_umum, disclaimer: t.disclaimer, source: "llm" };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
