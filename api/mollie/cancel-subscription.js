// /api/mollie/cancel-subscription.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const MOLLIE_KEY = process.env.MOLLIE_SECRET_KEY;
    const ADMIN_PASSWORD = process.env.ADMIN_CANCEL_PASSWORD;

    // ✔️ MATCHES your HTML form
    const { email, subscriptionId, adminPassword } = req.body;

    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    if (!subscriptionId) {
      return res.status(400).json({ error: "Missing subscriptionId" });
    }

    // 1️⃣ Fetch subscription to get customerId
    const subRes = await fetch(
      `https://api.mollie.com/v2/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${MOLLIE_KEY}`,
        },
      }
    );

    const sub = await subRes.json();

    if (!sub.id) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const customerId = sub.customerId;

    // 2️⃣ Cancel subscription
    const cancelRes = await fetch(
      `https://api.mollie.com/v2/customers/${customerId}/subscriptions/${subscriptionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${MOLLIE_KEY}`,
        },
      }
    );

    // ✔️ If cancellation accepted, we return SUCCESS
    if (cancelRes.status === 204) {
      return res.status(200).json({
        success: true,
        message: "Subscription cancelled successfully",
      });
    }

    // ✔️ If already cancelled, we still return SUCCESS
    if (cancelRes.status === 422) {
      return res.status(200).json({
        success: true,
        message: "Subscription was already cancelled earlier",
        alreadyCancelled: true,
      });
    }

    // Fallback
    let errorDetails = {};
    try {
      errorDetails = await cancelRes.json();
    } catch (_) {}

    return res.status(400).json({
      error: "Cancellation failed",
      details: errorDetails,
    });

  } catch (err) {
    console.error("❌ Cancel Subscription API Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
