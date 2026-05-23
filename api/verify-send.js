// api/verify-send.js — Telnyx Verify: send SMS code
// Requires env vars: TELNYX_API_KEY, TELNYX_VERIFY_PROFILE_ID

export default async function handler(req, res) {
  // CORS — only needed if you ever serve the frontend from a different origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone } = req.body || {};

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Normalize Australian numbers to E.164 (+61...)
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

  // Basic AU mobile sanity check
  if (!/^\+614\d{8}$/.test(normalized)) {
    return res.status(400).json({ error: 'Please enter a valid Australian mobile number' });
  }

  const apiKey = process.env.TELNYX_API_KEY;
  const verifyProfileId = process.env.TELNYX_VERIFY_PROFILE_ID;

  if (!apiKey || !verifyProfileId) {
    console.error('Missing Telnyx env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://api.telnyx.com/v2/verifications/sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: normalized,
        verify_profile_id: verifyProfileId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telnyx error:', data);
      const detail = data?.errors?.[0]?.detail || 'Could not send verification code';
      return res.status(response.status).json({ error: detail });
    }

    // Success — return verification id (frontend doesn't strictly need it, but useful for logging)
    return res.status(200).json({
      success: true,
      phone: normalized,
      verification_id: data?.data?.id
    });
  } catch (err) {
    console.error('verify-send error:', err);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
}
