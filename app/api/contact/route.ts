import { Resend } from "resend";
import { NextResponse } from "next/server";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

function adminInboxes(): string[] {
  const fromEnv = (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : ["contact@orcred.com"];
}

/* ── Email template — matches site light theme ── */
function buildEmail(subject: string, fields: Record<string, string>): string {
  const rows = Object.entries(fields)
    .map(
      ([k, v]) => `
      <tr>
        <td style="
          padding: 12px 16px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(15,13,12,0.4);
          white-space: nowrap;
          border-bottom: 1px solid rgba(15,13,12,0.08);
          width: 140px;
          vertical-align: top;
        ">${k}</td>
        <td style="
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.7;
          color: #0f0d0c;
          border-bottom: 1px solid rgba(15,13,12,0.08);
        ">${v}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding-bottom:28px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="
                  width:12px;height:12px;border-radius:50%;
                  background:#eb4511;
                  display:inline-block;
                  vertical-align:middle;
                  margin-right:8px;
                "></td>
                <td style="
                  font-size:15px;
                  font-weight:700;
                  letter-spacing:-0.01em;
                  color:#0f0d0c;
                  vertical-align:middle;
                  padding-left:8px;
                ">Orcred</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="
            background:#ffffff;
            border:1px solid rgba(15,13,12,0.10);
            border-radius:4px;
            overflow:hidden;
          ">

            <!-- Card header bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="
                  padding:20px 24px;
                  border-bottom:1px solid rgba(15,13,12,0.08);
                ">
                  <div style="
                    display:inline-block;
                    font-size:9px;
                    font-weight:600;
                    letter-spacing:0.3em;
                    text-transform:uppercase;
                    color:#eb4511;
                    margin-bottom:8px;
                  ">New Submission</div>
                  <div style="
                    font-size:18px;
                    font-weight:400;
                    letter-spacing:-0.02em;
                    color:#0f0d0c;
                    line-height:1.2;
                  ">${subject}</div>
                </td>
              </tr>
            </table>

            <!-- Fields table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${rows}
            </table>

            <!-- Footer inside card -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="
                  padding:16px 24px;
                  border-top:1px solid rgba(15,13,12,0.08);
                ">
                  <span style="
                    font-size:10px;
                    font-weight:400;
                    color:rgba(15,13,12,0.35);
                    letter-spacing:0.05em;
                  ">Sent via orcred.com</span>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Bottom spacer -->
        <tr>
          <td style="padding-top:24px;">
            <span style="
              font-size:10px;
              color:rgba(15,13,12,0.28);
              letter-spacing:0.1em;
            ">orcred.com — The Verification Standard for AI/ML Engineers</span>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/* ── Friendly subject lines per form type ── */
function getSubject(type: string, fields: Record<string, string>): string {
  const name = fields.name ?? fields["full name"] ?? "Someone";
  if (type === "verify")  return `Verification Application — ${name}`;
  if (type === "review" || type === "reviewer") return `Reviewer Application — ${name}`;
  return `Contact Message — ${name}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, ...fields } = body as { type: string } & Record<string, string>;

    if (!resend) {
      console.warn("RESEND_API_KEY not set — email not sent");
      return NextResponse.json({ ok: true });
    }

    const subject = getSubject(type, fields);
    const html    = buildEmail(subject, fields);

    const recipients = adminInboxes();
    const failures: string[] = [];

    for (const to of recipients) {
      try {
        await resend.emails.send({
          from:    "Orcred <noreply@orcred.com>",
          to,
          subject,
          html,
        });
      } catch (err) {
        console.error("Contact route error for", to, err);
        failures.push(to);
      }
    }

    if (failures.length === recipients.length) {
      return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 500 });
  }
}
