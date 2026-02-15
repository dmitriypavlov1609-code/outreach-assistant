module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.OUTREACH_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    res.status(500).json({ error: "Server is not configured. Set RESEND_API_KEY and OUTREACH_FROM_EMAIL." });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();
  const fromName = String(body.fromName || "Outreach Assistant").trim();
  const replyTo = String(body.replyTo || "").trim();

  if (!to || !subject || !text) {
    res.status(400).json({ error: "Fields to, subject and text are required." });
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        text,
        reply_to: replyTo || undefined
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = payload?.message || payload?.error || "Failed to send email";
      res.status(502).json({ error: msg });
      return;
    }

    res.status(200).json({ ok: true, messageId: payload.id || "" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Unexpected server error" });
  }
};
