import { useState } from "react";
import { Link } from "react-router-dom";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

const plans = [
  { name: "Free", price: "$0", description: "A good place to start sharing your ideas.", features: ["Browse community posts", "Publish up to 3 posts each month", "Standard image uploads"] },
  { name: "Paid", price: "$7.99", period: " / month", description: "More room to create, learn, and connect.", features: ["Everything in Free", "Publish up to 20 posts each month", "Larger image uploads", "Priority community support"] },
];

export default function PricingPage() {
  const { user, profile, setProfile, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [cardNumber, setCardNumber] = useState("");

  async function handleUpgrade(event) {
    event.preventDefault();
    if (!user || profile?.plan === "Paid") return;
    if (!/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ""))) {
      setMessage("Enter a card number with 13 to 19 digits.");
      return;
    }
    setMessage("");
    setSaving(true);
    let planSaved = false;
    const purchaseTime = new Date().toISOString();
    try {
      await updateDoc(doc(db, "users", user.uid), { plan: "Paid", planUpdatedAt: serverTimestamp() });
      planSaved = true;
      setProfile((current) => ({ ...current, plan: "Paid" }));
      setShowModal(false);

      const response = await fetch("http://localhost:3000/plan-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || profile?.name || "DEV@Deakin member",
          plan: "Paid",
          purchaseTime,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Email delivery failed.");
      setMessage("Your plan is now Paid. A confirmation email has been sent.");
    } catch (error) {
      console.error("Upgrade confirmation error:", error);
      if (planSaved) {
        setShowModal(false);
        setMessage("Your plan is Paid, but we could not send the confirmation email. Check that the backend and Mailgun are running.");
      } else {
        setMessage("We could not update your plan. Check your Firestore setup and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const currentPlan = profile?.plan || "Free";
  return <main className="pricing-page">
    <section className="pricing-intro">
      <p className="eyebrow">Plans for every creator</p><h1>Choose your plan</h1>
      <p>Start with the essentials, then upgrade when you need more room to grow.</p>
      {!loading && user && <p className="current-plan">Your current plan: <strong>{currentPlan}</strong></p>}
    </section>
    <section className="plan-grid" aria-label="Available plans">
      {plans.map((plan) => <article className={`plan-card ${plan.name === "Paid" ? "plan-card-featured" : ""}`} key={plan.name}>
        {plan.name === "Paid" && <span className="plan-badge">More for creators</span>}
        <h2>{plan.name}</h2><p className="plan-description">{plan.description}</p>
        <p className="plan-price"><strong>{plan.price}</strong>{plan.period && <span>{plan.period}</span>}</p>
        <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        {plan.name === "Free" ? <button className="plan-button plan-button-secondary" type="button" disabled={currentPlan === "Free" && Boolean(user)}>{user && currentPlan === "Free" ? "Your current plan" : "Free plan"}</button>
          : !user ? <Link className="plan-button" to="/login">Login to upgrade</Link>
          : currentPlan === "Paid" ? <button className="plan-button" type="button" disabled>You're on Paid</button>
          : <button className="plan-button" type="button" onClick={() => { setMessage(""); setShowModal(true); }}>Upgrade plan</button>}
      </article>)}
    </section>
    {message && <p className="pricing-message" role="status">{message}</p>}
    {showModal && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
      <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title">
        <button className="modal-close" type="button" aria-label="Close" onClick={() => setShowModal(false)}>×</button>
        <p className="eyebrow">Demo checkout</p><h2 id="payment-title">Upgrade to Paid</h2>
        <p className="demo-notice">Class demo only. Use sample details; payment is not processed and card details are not saved.</p>
        <form onSubmit={handleUpgrade}>
          <label>Name on card<input autoComplete="cc-name" required minLength={2} placeholder="Alex Morgan" /></label>
          <label>Card number<input className="card-number-input" type="text" inputMode="numeric" autoComplete="off" required pattern="[0-9 ]{13,23}" maxLength={23} value={cardNumber} onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 19); setCardNumber(digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()); }} placeholder="4242 4242 4242 4242" /></label>
          <div className="payment-fields">
            <label>Expiry<input required pattern="(0[1-9]|1[0-2])/[0-9]{2}" placeholder="MM/YY" maxLength={5} /></label>
            <label>CVC<input inputMode="numeric" autoComplete="off" required pattern="[0-9]{3,4}" maxLength={4} placeholder="123" /></label>
          </div>
          <button className="plan-button" type="submit" disabled={saving}>{saving ? "Updating plan..." : "Confirm upgrade"}</button>
        </form>
      </section>
    </div>}
  </main>;
}
