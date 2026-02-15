module.exports = async (_req, res) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.OUTREACH_FROM_EMAIL;
  res.status(200).json({
    ok: true,
    hasResendApiKey: Boolean(apiKey),
    hasOutreachFromEmail: Boolean(fromEmail),
    fromEmail: fromEmail ? String(fromEmail) : ""
  });
};
