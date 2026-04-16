import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Drivara <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_URL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-drivara-key",
};

const ICONS: Record<string, string> = {
  message:  "💬",
  accepted: "✅",
  review:   "⭐",
  request:  "🔔",
};

const COLORS: Record<string, string> = {
  message:  "#3b82f6",
  accepted: "#2ecf8e",
  review:   "#f5c842",
  request:  "#f97316",
};

function buildEmailHtml(type: string, title: string, body: string, appUrl: string): string {
  const icon  = ICONS[type]  ?? "🔔";
  const color = COLORS[type] ?? "#2ecf8e";

  const ctaButton = appUrl
    ? `<div style="text-align:center;margin-top:24px;">
        <a href="${appUrl}" style="display:inline-block;background:${color};color:#1e2a3a;text-decoration:none;
          font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;">Open Drivara</a>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1e2a3a;padding:24px 32px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
              Driv<span style="color:#2ecf8e;">ara</span>
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px 28px;">
            <div style="width:56px;height:56px;border-radius:14px;background:${color}22;
              display:flex;align-items:center;justify-content:center;
              font-size:26px;margin:0 auto 20px;text-align:center;line-height:56px;">
              ${icon}
            </div>
            <h1 style="margin:0 0 10px;font-size:20px;font-weight:800;color:#1e2a3a;text-align:center;">
              ${title}
            </h1>
            <p style="margin:0;font-size:15px;color:#6b7280;text-align:center;line-height:1.6;">
              ${body}
            </p>
            ${ctaButton}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              You're receiving this because you have an account on Drivara.<br>
              Car workshop management made easy.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY secret is not set");
    }

    const { to, type, title, body, appUrl } = await req.json();

    if (!to || !title) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, title" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const html = buildEmailHtml(type ?? "message", title, body ?? "", appUrl ?? APP_URL);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `Drivara — ${title}`,
        html,
      }),
    });

    const data = await resendRes.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: resendRes.ok ? 200 : 400,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
