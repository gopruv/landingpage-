type OrcredBadgeProps = {
  projectTitle: string;
  techStack?: string[];
  credentialId: string;
  width?: number;
};

export function OrcredBadge({
  projectTitle,
  techStack = [],
  credentialId,
  width = 340,
}: OrcredBadgeProps) {
  const stack = techStack.join(" · ");

  return (
    <div className="orc-badge" style={{ width }}>
      <div className="orc-badge__frame">
        <div className="orc-badge__card">
          <div className="orc-badge__head">
            <span className="orc-badge__mark">
              <svg viewBox="0 0 40 40" fill="none" aria-hidden>
                <circle cx="20" cy="20" r="20" fill="#eb4511" />
              </svg>
              <span>Orcred</span>
            </span>
            <span className="orc-badge__pill">
              <i />
              <span>Verified</span>
            </span>
          </div>

          <div className="orc-badge__body">
            <svg className="orc-badge__check" viewBox="0 0 100 100" fill="none" aria-hidden>
              <circle cx="50" cy="50" r="50" fill="#eb4511" />
              <path
                d="M 29 51 l 14.5 14.5 L 71 34.5"
                stroke="#fff"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span className="orc-badge__label">Project</span>
            <div className="orc-badge__project">{projectTitle}</div>
            {stack && <div className="orc-badge__stack">{stack}</div>}
          </div>

          <div className="orc-badge__foot">
            <span>{credentialId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrcredBadge;
