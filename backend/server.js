const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/User");
const Event = require("./models/Event");
const Message = require("./models/Message");
const auth = require("./middleware/auth");

const app = express();
app.use(express.json());

// ✅ Fix CORS (frontend + file:// testing)
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    return cb(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

/* ---------------- AUTH ROUTES ---------------- */

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ message: "Signup successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- EVENT ROUTES ---------------- */

// Add Event
app.post("/events", auth, async (req, res) => {
  try {
    const { title, date, description } = req.body;
    if (!title || !date || !description) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newEvent = new Event({
      user: req.user.id,
      title,
      date,
      description
    });

    await newEvent.save();
    res.json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    console.error("❌ Error saving event:", err);
    res.status(500).json({ error: err.message });
  }
});


// Get all events
app.get("/events", async (req, res) => {
  try {
    const events = await Event.find().populate("user", "email");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete event
app.delete("/events/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- CONTACT ROUTE ---------------- */
app.post("/contact", async (req, res) => {
  try {
    console.log("📩 Contact payload:", req.body);

    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    res.json({ message: "✅ Message sent successfully!" });
  } catch (err) {
    console.error("❌ Contact error:", err);
    res.status(500).json({ message: "Server error while sending message" });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));


