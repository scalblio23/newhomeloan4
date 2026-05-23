// api/verify-check.js — Telnyx Verify: check submitted code
// Requires env vars: TELNYX_API_KEY, TELNYX_VERIFY_PROFILE_ID

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, code } = req.body || {};

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  // Normalize phone same way as send endpoint
  let normalized = phone.replace(/\s+/g, '').replace(/[-()]/g, '');
  if (normalized.startsWith('04')) {
    normalized = '+61' + normalized.substring(1);
  } else if (normalized.startsWith('614')) {
    normalized = '+' + normalized;
  } else if (normalized.startsWith('4') && normalized.length === 9) {
    normalized = '+61' + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  const apiKey = process.env.TELNYX_API_KEY;
  const verifyProfileId = process.env.TELNYX_VERIFY_PROFILE_ID;

  if (!apiKey || !verifyProfileId) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Telnyx Verify uses POST to /verifications/by_phone_number/{phone}/actions/verify
    const response = await fetch(
      `https://api.telnyx.com/v2/verifications/by_phone_number/${encodeURIComponent(normalized)}/actions/verify`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: String(code).trim(),
          verify_profile_id: verifyProfileId
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Telnyx verify-check error:', data);
      const detail = data?.errors?.[0]?.detail || 'Verification failed';
      return res.status(response.status).json({ error: detail, verified: false });
    }

    // Telnyx returns response_code "accepted" on success
    const verified = data?.data?.response_code === 'accepted';

    if (!verified) {
      return res.status(400).json({
        error: 'Incorrect code. Please check and try again.',
        verified: false
      });
    }

    return res.status(200).json({ verified: true, phone: normalized });
  } catch (err) {
    console.error('verify-check error:', err);
    return res.status(500).json({ error: 'Failed to verify code', verified: false });
  }
}
