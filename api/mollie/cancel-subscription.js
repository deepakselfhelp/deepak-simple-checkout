// ✅ /api/mollie/cancel-subscription.js (Final Clean Version)
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Load env variables FIRST
    const MOLLIE_KEY = process.env.MOLLIE_SECRET_KEY;
    const ADMIN_PASSWORD = process.env.ADMIN_CANCEL_PASSWORD;

    const { customerId, subscriptionId, password } = req.body;

    // Password check
    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: "Invalid admin password" });
    }

    if (!customerId || !subscriptionId) {
      return res.status(400).json({
        success: false,
        error: "Missing customerId or subscriptionId",
      });
    }

    // Try to cancel subscription
    const cancelRes = await fetch(
      `https://api.mollie.com/v2/customers/${customerId}/subscriptions/${subscriptionId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${MOLLIE_KEY}` },
      }
    );

    // 204 = Cancel queued
    if (cancelRes.status === 204) {
      return res.status(200).json({
        success: true,
        message: "Subscription cancellation requested successfully.",
      });
    }

    // Get Mollie error
    let errorDetails = {};
    try {
      errorDetails = await cancelRes.json();
    } catch (_) {}

    // ⭐ NEW FIX: Handle "already cancelled" or "canceling pending"
    if (errorDetails?.detail?.includes("has been cancelled")) {
      return res.status(200).json({
        success: true,
        message: "Subscription already cancelled or pending cancellation.",
      });
    }

    if (errorDetails?.title === "Not Found") {
      return res.status(404).json({
        success: false,
        error: "Subscription not found.",
      });
    }

    console.log("⚠️ Mollie Cancel Error:", errorDetails);

    return res.status(400).json({
      success: false,
      error: "Failed to cancel subscription",
      details: errorDetails,
    });

  } catch (err) {
    console.error("❌ Cancel Subscription API Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
