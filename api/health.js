module.exports = function handler(req, res) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.status(200).json({
    status: 'ok',
    anthropic_key_configured: hasKey,
    timestamp: new Date().toISOString()
  });
};
