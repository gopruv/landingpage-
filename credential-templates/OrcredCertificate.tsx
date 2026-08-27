import { QRCodeSVG } from "qrcode.react";

const FLOURISH_D =
  "M4 26c8-14 13-19 17-18 4 1 1 12-2 17-3 5-6 6-7 4-2-3 3-10 10-14 6-4 12-6 15-3 3 3-2 9-5 12-2 3-2 5 1 5 5 0 12-6 18-13 5-6 9-11 12-10 3 1 0 8-3 13-2 4-3 7-1 8 3 1 9-3 15-9";

type OrcredCertificateProps = {
  holderName: string;
  projectTitle: string;
  techStack?: string[];
  score: number;
  issueDate: string;
  credentialId: string;
  signatoryName?: string;
  signatoryRole?: string;
  width?: number;
};

export function OrcredCertificate({
  holderName,
  projectTitle,
  techStack = [],
  score,
  issueDate,
  credentialId,
  signatoryName = "Pragathi S A",
  signatoryRole = "Founder, Orcred",
  width = 720,
}: OrcredCertificateProps) {
  const stack = techStack.join(" · ");
  const verifyUrl = `https://orcred.com/verify/${credentialId}`;
  const u = width / 720;

  return (
    <div className="orc-cert" style={{ ["--cert-w" as string]: `${width}px` }}>
      <div className="orc-cert__rule" />

      <div className="orc-cert__inner">
        <div className="orc-cert__top">
          <span className="orc-cert__mark">
            <svg viewBox="0 0 40 40" fill="none" aria-hidden>
              <circle cx="20" cy="20" r="20" fill="#eb4511" />
            </svg>
            <span>Orcred</span>
          </span>
          <span className="orc-cert__id">{credentialId}</span>
        </div>

        <div className="orc-cert__body">
          <span className="orc-cert__kicker">Certificate of Verification</span>
          <span className="orc-cert__intro">This certifies that</span>
          <span className="orc-cert__name">{holderName}</span>
          <span className="orc-cert__sentence">
            was verified in a live technical review on{" "}
            <b>{projectTitle}</b>
            {stack && <i> ({stack})</i>}, scoring{" "}
            <em>{score} out of 100</em>.
          </span>
        </div>

        <div className="orc-cert__foot">
          <div className="orc-cert__sig">
            <svg className="orc-cert__flourish" viewBox="0 0 120 36" fill="none" aria-hidden>
              <path
                d={FLOURISH_D}
                stroke="#0e0f12"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            </svg>
            <div className="orc-cert__line">
              <div className="orc-cert__strong">{signatoryName}</div>
              <div className="orc-cert__sub">{signatoryRole}</div>
            </div>
          </div>

          <div className="orc-cert__date">
            <div className="orc-cert__spacer" />
            <div className="orc-cert__line">
              <div className="orc-cert__strong">{issueDate}</div>
              <div className="orc-cert__sub">Date of issue</div>
            </div>
          </div>

          <div className="orc-cert__qr">
            <QRCodeSVG
              value={verifyUrl}
              size={Math.round(74 * u)}
              level="H"
              bgColor="transparent"
              fgColor="#0e0f12"
              marginSize={0}
            />
            <span className="orc-cert__qrcap">Scan to verify</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrcredCertificate;
