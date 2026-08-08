"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SCORE_CRITERIA } from "@/lib/scoring";

interface VerifyData {
  credential_id: string;
  issued_at: string;
  student_name: string;
  project_name: string | null;
  tech_stack: string | null;
  score: {
    total: number;
    technical_depth: number;
    communication: number;
    reproducibility: number;
    problem_solving: number;
    passed: boolean;
  } | null;
  verified: boolean;
}

const DIM_LABELS: Record<string, string> = {
  technical_depth: "Technical Depth",
  communication: "Communication",
  reproducibility: "Reproducibility",
  problem_solving: "Problem solving",
};

export default function VerifyCredentialPage() {
  const params = useParams();
  const credentialId = params.credential_id as string;
  const [data, setData] = useState<VerifyData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const verifyUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    (async () => {
      try {
        const res = await api.verify(credentialId) as { success?: boolean; data?: VerifyData; error?: string };
        if (!res?.success || !res.data) {
          setError(res?.error ?? "Credential not found");
          return;
        }
        setData(res.data);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Credential not found or could not be verified");
      } finally {
        setLoading(false);
      }
    })();
  }, [credentialId]);

  const embedCode = verifyUrl
    ? `<iframe src="${verifyUrl}" width="420" height="560" frameborder="0" title="Orcred credential ${credentialId}"></iframe>`
    : "";

  const copyLink = async () => {
    if (!verifyUrl) return;
    await navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyEmbed = async () => {
    if (!embedCode) return;
    await navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const shareLinkedIn = () => {
    if (!verifyUrl) return;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  const techTags = data?.tech_stack?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const issuedLabel = data
    ? new Date(data.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="verify-page" style={{ minHeight: "100vh", background: "linear-gradient(165deg, #faf7f2 0%, #f0ebe0 45%, #faf7f2 100%)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .verify-page { background: #fff !important; }
          .cred-card { box-shadow: none !important; }
        }
      `}</style>

      <header className="no-print" style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#0f0d0c" }}>
          <svg width="24" height="24" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="21" r="20" fill="#eb4511" /></svg>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Orcred</span>
        </Link>
        <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(15,13,12,0.4)", fontWeight: 600 }}>
          Verified credential
        </span>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px" }}>
        {loading && <p style={{ color: "rgba(15,13,12,0.5)", textAlign: "center" }}>Verifying credential…</p>}

        {error && (
          <div style={{ background: "#fff", border: "1px solid rgba(15,13,12,0.1)", padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ba1a1a", marginBottom: 12 }}>Not verified</p>
            <h1 style={{ fontSize: 28, fontWeight: 500, marginBottom: 12 }}>Invalid credential</h1>
            <p style={{ color: "rgba(15,13,12,0.55)", lineHeight: 1.7 }}>{error}</p>
          </div>
        )}

        {data && (
          <>
            <div
              className="cred-card"
              style={{
                background: "#fff",
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 4px 40px rgba(15,13,12,0.08), 0 0 0 1px rgba(15,13,12,0.06)",
              }}
            >
              {/* Hero band */}
              <div style={{
                padding: "36px 32px 28px",
                background: "linear-gradient(135deg, #1a1512 0%, #2d241f 55%, #1a1512 100%)",
                color: "#fff",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 20, right: 24,
                  width: 72, height: 72, borderRadius: "50%",
                  border: "2px solid rgba(235,69,17,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(235,69,17,0.12)",
                }}>
                  <svg width="36" height="36" viewBox="0 0 42 42" fill="none">
                    <circle cx="21" cy="21" r="18" stroke="#eb4511" strokeWidth="2" fill="none" />
                    <path d="M13 21l5 5 11-11" stroke="#eb4511" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>

                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#eb4511", marginBottom: 14 }}>
                  Orcred Verified Engineer
                </p>
                <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 500, letterSpacing: "-0.03em", marginBottom: 8, maxWidth: "calc(100% - 90px)" }}>
                  {data.student_name}
                </h1>
                {data.project_name && (
                  <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 16, maxWidth: 420 }}>
                    {data.project_name}
                  </p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, padding: "4px 10px", background: "rgba(255,255,255,0.1)", borderRadius: 20, color: "rgba(255,255,255,0.8)" }}>
                    {data.credential_id}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Issued {issuedLabel}</span>
                </div>
              </div>

              <div style={{ padding: "28px 32px 32px" }}>
                {techTags.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(15,13,12,0.4)", marginBottom: 10 }}>Tech stack</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {techTags.map((tag) => (
                        <span key={tag} style={{ fontSize: 12, padding: "6px 14px", background: "rgba(235,69,17,0.08)", color: "#eb4511", borderRadius: 20, fontWeight: 500 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {data.score && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(15,13,12,0.4)", marginBottom: 6 }}>Orcred Score</p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <span style={{ fontSize: 72, fontWeight: 200, lineHeight: 1, letterSpacing: "-0.04em", color: "#0f0d0c" }}>{data.score.total}</span>
                          <span style={{ fontSize: 22, color: "#eb4511", fontWeight: 500 }}>/100</span>
                        </div>
                      </div>
                      <div style={{
                        padding: "10px 18px",
                        background: data.score.passed ? "rgba(0,122,74,0.1)" : "rgba(186,26,26,0.08)",
                        color: data.score.passed ? "#007a4a" : "#ba1a1a",
                        fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        borderRadius: 4,
                      }}>
                        {data.score.passed ? "Passed verification" : "Did not pass"}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                      {SCORE_CRITERIA.map((c) => {
                        const val = data.score![c.key as keyof typeof data.score] as number;
                        if (typeof val !== "number") return null;
                        return (
                          <div key={c.key} style={{ padding: 14, background: "#faf7f2", borderRadius: 4 }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(15,13,12,0.45)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {DIM_LABELS[c.key] ?? c.label}
                            </p>
                            <p style={{ fontSize: 28, fontWeight: 300, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{val}</p>
                            <div style={{ height: 3, background: "rgba(15,13,12,0.08)", borderRadius: 2 }}>
                              <div style={{ height: "100%", width: `${val}%`, background: "#eb4511", borderRadius: 2 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 12, color: "rgba(15,13,12,0.4)", lineHeight: 1.7, borderTop: "1px solid rgba(15,13,12,0.08)", paddingTop: 20 }}>
                  Cryptographically signed and registered with Orcred. This credential cannot be edited or forged.
                </p>
              </div>
            </div>

            {/* Share actions */}
            <div className="no-print" style={{ marginTop: 24, padding: 24, background: "#fff", borderRadius: 4, border: "1px solid rgba(15,13,12,0.08)" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(15,13,12,0.4)", marginBottom: 14 }}>Share your credential</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <button onClick={shareLinkedIn} style={{ padding: "10px 18px", background: "#0a66c2", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 4 }}>
                  Share on LinkedIn
                </button>
                <button onClick={copyLink} style={{ padding: "10px 18px", background: "#eb4511", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 4 }}>
                  {copiedLink ? "Link copied ✓" : "Copy link"}
                </button>
                <button onClick={() => window.print()} style={{ padding: "10px 18px", background: "#fff", color: "#0f0d0c", border: "1px solid rgba(15,13,12,0.2)", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 4 }}>
                  Download PDF
                </button>
                <button onClick={copyEmbed} style={{ padding: "10px 18px", background: "#fff", color: "#0f0d0c", border: "1px solid rgba(15,13,12,0.2)", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 4 }}>
                  {copiedEmbed ? "Embed copied ✓" : "Copy embed"}
                </button>
              </div>
              <pre style={{ fontSize: 11, background: "#faf7f2", padding: 12, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", borderRadius: 4, margin: 0 }}>{embedCode}</pre>
            </div>
          </>
        )}

        <p className="no-print" style={{ marginTop: 32, fontSize: 12, color: "rgba(15,13,12,0.35)", textAlign: "center", lineHeight: 1.7 }}>
          Every Orcred credential is earned through a live technical review — not a form, not a payment.
          <br />
          <Link href="/how-it-works" style={{ color: "#eb4511" }}>How verification works →</Link>
        </p>
      </main>
    </div>
  );
}
