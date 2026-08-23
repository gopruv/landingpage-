"use client";

/** TEMPORARY preview — delete once badge and certificate are signed off. */
import Frame from "@/components/orx/Frame";
import Badge from "@/components/orx/Badge";
import Certificate from "@/components/orx/Certificate";
import { L, SHELL, T } from "@/components/orx/kit";

export default function ArtifactPreview() {
  return (
    <Frame>
      <div className={`${SHELL} py-16`}>
        <h1 style={{ ...T.hero, fontSize: 44, marginBottom: 12 }}>What Orcred issues</h1>
        <p style={{ ...T.lede, marginBottom: 64, maxWidth: 640 }}>
          Two artifacts, carrying different things on purpose. The dimensional breakdown lives in
          neither — that is the score report.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-14 items-start">
          <div>
            <L style={{ display: "block", marginBottom: 8 }}>Badge</L>
            <p style={{ ...T.fine, marginBottom: 28 }}>
              Shareable mark. Score, project, verified. No name — it lives on the page this links to.
            </p>
            <Badge size={230} caption={false} />
          </div>

          <div>
            <L style={{ display: "block", marginBottom: 8 }}>Certificate</L>
            <p style={{ ...T.fine, marginBottom: 28 }}>
              The formal document. Holder, credential, project, score, date, signature, reference.
            </p>
            <Certificate size={660} caption={false} />
          </div>
        </div>
      </div>
    </Frame>
  );
}
