// /api/mollie/cancel-subscription.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const MOLLIE_KEY = process.env.MOLLIE_SECRET_KEY;
    const ADMIN_PASSWORD = process.env.ADMIN_CANCEL_PASSWORD;

    const { customerId, subscriptionId, password } = req.body;

    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    if (!customerId || !subscriptionId) {
      return res.status(400).json({ error: "Missing customerId or subscriptionId" });
    }

    const cancelRes = await fetch(
      `https://api.mollie.com/v2/customers/${customerId}/subscriptions/${subscriptionId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${MOLLIE_KEY}` }
      }
    );

    if (cancelRes.status === 204) {
      return res.status(200).json({ success: true });
    }

    let errorDetails = {};
    try { errorDetails = await cancelRes.json(); } catch (_) {}

    return res.status(400).json({ error: "Cancel failed", details: errorDetails });

  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
