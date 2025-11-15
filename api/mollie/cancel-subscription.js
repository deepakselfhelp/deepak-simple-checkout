// ✅ /api/mollie/cancel-subscription.js (Password Protected, Clean)
export default async function handler(req, res) {
  try {

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const MOLLIE_KEY = process.env.MOLLIE_SECRET_KEY;
    const ADMIN_PASSWORD = process.env.ADMIN_CANCEL_PASSWORD;

    const { customerId, subscriptionId, password } = req.body;

    // 🔐 Password protection
    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    if (!customerId || !subscriptionId) {
      return res.status(400).json({
        error: "customerId and subscriptionId are required"
      });
    }

    // 🔥 Attempt to cancel subscription
    const cancelRes = await fetch(
      `https://api.mollie.com/v2/customers/${customerId}/subscriptions/${subscriptionId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${MOLLIE_KEY}` }
      }
    );

    // ⭐ If 204 → Cancel successful
    if (cancelRes.status === 204) {
      return res.status(200).json({
        success: true,
        message: "Subscription cancelled successfully."
      });
    }

    // If not 204, read the error details
    let data = {};
    try {
      data = await cancelRes.json();
    } catch (_) {}

    // ⭐ If status already canceled → treat as SUCCESS
    if (data.status === "canceled") {
      return res.status(200).json({
        success: true,
        message: "Subscription was already canceled earlier."
      });
    }

    // ❌ Real failure
    return res.status(400).json({
      error: "Cancellation failed",
      details: data
    });

  } catch (err) {
    console.error("❌ Cancel API Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
