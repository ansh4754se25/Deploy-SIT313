const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const formData = require("form-data");
const Mailgun = require("mailgun.js");

dotenv.config({
    path: path.join(__dirname, "cred.env")
});
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY
});

const MAILGUN_DOMAIN = "sandboxb3d374cbce0f45488db5a6f725dbbaf5.mailgun.org";
const MAILGUN_FROM = "postmaster@" + MAILGUN_DOMAIN;
// Test route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Task P5 backend is running successfully!"
    });
});

// Newsletter subscription route
app.post("/subscribe", async (req, res) =>  {
    try {
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim()
                : "";

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        console.log("Newsletter subscription received:", email);
           // Send welcome email 
        const result = await mg.messages.create( 
            "sandboxb3d374cbce0f45488db5a6f725dbbaf5.mailgun.org", 
            { 
                from: "postmaster@sandboxb3d374cbce0f45488db5a6f725dbbaf5.mailgun.org", 
                to: [email], 
                subject: "Welcome to DEV@Deakin", 
                text: "Welcome to DEV@Deakin! Thank you for visiting the site.", 
                html: ` 
                    <h2>Welcome to DEV@Deakin!</h2> 
                    <p>Thank you for visiting the site.</p> 
                ` 
            } 
        ); 

        return res.status(200).json({
            message: "Your email was received successfully!"
        });
    } catch (error) {
        console.error("Subscription error:", error);

        return res.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
});

app.post("/plan-confirmation", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
    const name = typeof req.body.name === "string" ? req.body.name.trim().slice(0, 100) : "there";
    const plan = typeof req.body.plan === "string" ? req.body.plan.trim() : "";
    const purchaseTime = new Date(req.body.purchaseTime);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "A valid account email is required." });
    }
    if (plan !== "Paid") {
      return res.status(400).json({ message: "Only Paid plan confirmations can be sent." });
    }
    if (!req.body.purchaseTime || Number.isNaN(purchaseTime.getTime())) {
      return res.status(400).json({ message: "A valid purchase date and time are required." });
    }
    if (!process.env.MAILGUN_API_KEY) {
      return res.status(503).json({ message: "Email is not configured on the backend." });
    }

    const formattedTime = purchaseTime.toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
    const greeting = name || "there";
    const text = [
      "Hi " + greeting + ",",
      "",
      "Your DEV@Deakin plan is now Paid.",
      "Plan: Paid",
      "Date and time: " + formattedTime + " IST",
      "",
      "This is a class demonstration. No real payment was processed.",
    ].join("\n");

    await mg.messages.create(MAILGUN_DOMAIN, {
      from: MAILGUN_FROM,
      to: [email],
      subject: "Your DEV@Deakin Paid plan confirmation",
      text,
      html: "<h2>Your plan is now Paid</h2><p>Hi " + greeting + ",</p><p>Your DEV@Deakin Paid plan was recorded on <strong>" + formattedTime + " IST</strong>.</p><p><em>This is a class demonstration. No real payment was processed.</em></p>",
    });

    return res.status(200).json({ message: "Confirmation email sent." });
  } catch (error) {
    console.error("Plan confirmation email error:", error);
    return res.status(500).json({ message: "The plan was saved, but the confirmation email could not be sent." });
  }
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});