"use client";

/**
 * Legal — the shell for Terms and Privacy.
 *
 * A sticky contents column on the left tracks where you are, and the clauses
 * run down one comfortable measure on the right. Long legal copy is the place
 * where readable line length and body size matter most, so both are generous.
 *
 * The wording of these pages is legally operative and is rendered exactly as
 * supplied; this component only sets it.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import Frame from "./Frame";
import { Head } from "./Sheet";
import { L, Rise, SHELL, T } from "./kit";

export type Section = { title: string; body: string[] };

export function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function Legal({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: Section[];
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(sections[0] ? slug(sections[0].title) : "");
  const ids = sections.map((s) => slug(s.title)).join("|");

  useEffect(() => {
    const list = ids.split("|").filter(Boolean);
    if (!list.length) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.3;
        let cur = list[0];
        for (const id of list) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= line) cur = id;
        }
        setActive(cur);
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ids]);

  const jump = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <Frame>
      <Head
        eyebrow="Legal"
        title={[title]}
        lede="Plain terms, published in full."
        meta={[updated, `${sections.length} sections`]}
      />

      <div style={{ borderTop: "1px solid var(--line)" }}>
        <div className={`${SHELL} grid grid-cols-1 lg:grid-cols-12 lg:gap-x-14 py-12 lg:py-16`}>
          {/* Contents */}
          <aside className="lg:col-span-4 xl:col-span-3 mb-10 lg:mb-0" aria-label="Contents">
            <div className="lg:sticky lg:top-[88px]">
              <L style={{ display: "block", marginBottom: 14 }}>On this page</L>
              <ol className="flex flex-col gap-0.5" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {sections.map((s) => {
                  const id = slug(s.title);
                  const on = id === active;
                  return (
                    <li key={id}>
                      <Link
                        href={`#${id}`}
                        onClick={jump(id)}
                        style={{
                          display: "block",
                          padding: "9px 12px",
                          borderRadius: "var(--r-sm)",
                          textDecoration: "none",
                          fontSize: 14.5,
                          fontWeight: on ? 500 : 400,
                          lineHeight: 1.4,
                          color: on ? "var(--or)" : "var(--ink-2)",
                          backgroundColor: on ? "var(--or-soft)" : "transparent",
                          transition: "color .2s ease, background-color .2s ease",
                        }}
                      >
                        {s.title}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>

          {/* Clauses */}
          <div className="lg:col-span-8 xl:col-span-9">
            {sections.map((s, i) => (
              <section
                key={s.title}
                id={slug(s.title)}
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--line)",
                  paddingTop: i === 0 ? 0 : 36,
                  paddingBottom: 36,
                  scrollMarginTop: 84,
                }}
              >
                <Rise>
                  <h2 style={{ ...T.title, fontSize: "clamp(21px, 1.9vw, 26px)", marginBottom: 16, maxWidth: 640 }}>
                    {s.title}
                  </h2>
                  <div className="flex flex-col" style={{ gap: 15, maxWidth: 680 }}>
                    {s.body.map((p, j) => (
                      <p key={j} style={{ ...T.body, margin: 0 }}>
                        {p}
                      </p>
                    ))}
                  </div>
                </Rise>
              </section>
            ))}

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 28 }}>
              <p style={{ ...T.fine, margin: 0 }}>
                Questions about this document? Write to{" "}
                <a href="mailto:contact@orcred.com" className="orx-ref">contact@orcred.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}
