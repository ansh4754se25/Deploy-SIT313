const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, getFirestore: getAdminFirestore } = require("firebase-admin/firestore");

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

function getFirestore() {
    if (!getApps().length) {
        const options = {};
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            options.credential = cert(serviceAccount);
            options.projectId = serviceAccount.project_id;
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            const credentialPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
            const serviceAccount = JSON.parse(fs.readFileSync(credentialPath, "utf8"));
            if (serviceAccount.project_id !== process.env.FIREBASE_PROJECT_ID) {
                throw new Error("The service-account project_id must match FIREBASE_PROJECT_ID.");
            }
            options.credential = cert(serviceAccount);
            options.projectId = serviceAccount.project_id;
        } else {
            options.credential = applicationDefault();
            options.projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
        }
        initializeApp(options);
    }
    return getAdminFirestore();
}

async function readOptionalUser(req, res, next) {
    const authorization = req.get("authorization") || "";
    if (!authorization) {
        req.user = null;
        return next();
    }
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ message: "A valid login token is required." });
    try {
        getFirestore();
    } catch (error) {
        console.error("Firebase Admin configuration error:", error.stack || error.message);
        return res.status(503).json({ message: "Backend Firebase Admin credentials are not configured." });
    }
    try {
        req.user = await getAuth().verifyIdToken(match[1]);
        return next();
    } catch {
        return res.status(401).json({ message: "Your login token is invalid or Firebase Admin is not configured." });
    }
}

function cleanPost(post, id) {
    const createdAt = post.createdAt?.toDate
        ? post.createdAt.toDate().toISOString()
        : post.createdAt || null;
    return {
        id: id || post.id,
        type: post.type,
        title: post.title,
        body: post.body,
        tags: Array.isArray(post.tags) ? post.tags : [],
        plan: post.plan === "Paid" ? "Paid" : "Free",
        authorId: post.authorId || "",
        authorName: post.authorName || "DEV@Deakin member",
        createdAt,
    };
}

app.post("/posts", readOptionalUser, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Please log in before publishing a post." });
    try {
        const db = getFirestore();
        const { type, title, body } = req.body || {};
        const cleanTitle = typeof title === "string" ? title.trim() : "";
        const cleanBody = typeof body === "string" ? body.trim() : "";
        const plan = req.body?.plan === "Paid" ? "Paid" : req.body?.plan === "Free" ? "Free" : "";
        const tags = Array.isArray(req.body?.tags) ? req.body.tags : [];
        if (!["Question", "Article"].includes(type)) return res.status(400).json({ message: "Choose Question or Article." });
        if (cleanTitle.length < 3 || cleanTitle.length > 120) return res.status(400).json({ message: "The title must be 3 to 120 characters." });
        if (cleanBody.length < 10 || cleanBody.length > 3000) return res.status(400).json({ message: "The description must be 10 to 3000 characters." });
        if (!plan) return res.status(400).json({ message: "Choose whether the post is Free or Paid." });
        if (!Array.isArray(tags) || tags.length > 3 || tags.some((tag) => typeof tag !== "string" || tag.trim().length > 30)) {
            return res.status(400).json({ message: "Use up to 3 tags, each no longer than 30 characters." });
        }
        const profileSnapshot = await db.collection("users").doc(req.user.uid).get();
        const profile = profileSnapshot.exists ? profileSnapshot.data() : {};
        const authorPlan = profile.plan === "Paid" ? "Paid" : "Free";
        if (plan === "Paid" && authorPlan !== "Paid") {
            return res.status(403).json({ message: "Upgrade to the Paid plan before publishing a Paid post." });
        }
        const postRef = db.collection("posts").doc();
        const post = {
            type,
            title: cleanTitle,
            body: cleanBody,
            tags: [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))],
            plan,
            authorId: req.user.uid,
            authorName: profile.name || req.user.name || "DEV@Deakin member",
            createdAt: FieldValue.serverTimestamp(),
        };
        await postRef.set(post);
        return res.status(201).json({ message: "Your post has been published.", post: cleanPost({ ...post, createdAt: new Date() }, postRef.id) });
    } catch (error) {
        console.error("Unable to save post:", error);
        return res.status(503).json({ message: "Post storage is unavailable. Check the Firebase Admin credentials on the backend." });
    }
});

app.get("/posts", readOptionalUser, async (req, res) => {
    try {
        const db = getFirestore();
        let plan = req.user ? "Free" : "Visitor";
        if (req.user) {
            const profile = await db.collection("users").doc(req.user.uid).get();
            if (profile.exists && profile.data().plan === "Paid") plan = "Paid";
        }
        const postsSnapshot = await db.collection("posts").get();
        const posts = postsSnapshot.docs.map((document) => cleanPost(document.data(), document.id));

        // Include posts created by the earlier version, which stored them inside users/{uid}.
        const usersSnapshot = await db.collection("users").get();
        for (const userDocument of usersSnapshot.docs) {
            const legacyPosts = userDocument.data().posts;
            if (!Array.isArray(legacyPosts)) continue;
            for (const legacyPost of legacyPosts) {
                posts.push(cleanPost({ ...legacyPost, plan: legacyPost.plan || "Free", authorId: legacyPost.authorId || userDocument.id }, `legacy-${userDocument.id}-${legacyPost.id}`));
            }
        }

        const visiblePosts = posts
            .filter((post) => plan === "Paid" || post.plan !== "Paid")
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return res.status(200).json({ posts: visiblePosts, plan });
    } catch (error) {
        console.error("Unable to fetch posts:", error);
        return res.status(503).json({ message: "Post browsing is unavailable. Check the Firebase Admin credentials on the backend." });
    }
});

app.post("/plan-upgrade", readOptionalUser, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Please log in before upgrading." });
    try {
        const db = getFirestore();
        await db.collection("users").doc(req.user.uid).set({ plan: "Paid", planUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return res.status(200).json({ message: "Your plan is now Paid." });
    } catch (error) {
        console.error("Unable to update plan:", error);
        return res.status(503).json({ message: "Plan upgrade is unavailable. Check Firebase Admin credentials." });
    }
});
// Test route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Task D2 backend is running successfully!"
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
