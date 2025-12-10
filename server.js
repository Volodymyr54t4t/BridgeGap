const express = require("express")
const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("frontend"))
app.use(express.static("public"))

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

// Initialize Database
async function initializeDatabase() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        user_type VARCHAR(20) NOT NULL DEFAULT 'young',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Moderators table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS moderators (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        moderator_id INTEGER REFERENCES moderators(id) ON DELETE CASCADE,
        new_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("Database initialized successfully")
  } catch (err) {
    console.error("Error initializing database:", err)
  }
}

initializeDatabase()

// ============ AUTH ROUTES ============

// Register User
app.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth } = req.body

    // Validation
    if (!firstName || !lastName || !email || !password || !dateOfBirth) {
      return res.status(400).json({ error: "All fields are required" })
    }

    // Check if user exists
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Determine user type based on age
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const userType = age >= 60 ? "senior" : "young"

    // Create user
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password, date_of_birth, user_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, user_type",
      [firstName, lastName, email, hashedPassword, dateOfBirth, userType],
    )

    const newUser = result.rows[0]

    // Notify moderators about new user
    const moderators = await pool.query("SELECT id FROM moderators")
    for (const mod of moderators.rows) {
      await pool.query("INSERT INTO notifications (moderator_id, new_user_id, message) VALUES ($1, $2, $3)", [
        mod.id,
        newUser.id,
        `New ${userType} user registered: ${firstName} ${lastName}`,
      ])
    }

    res.status(201).json({
      message: "Registration successful",
      user: newUser,
    })
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Login User
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const user = result.rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        userType: user.user_type,
        dateOfBirth: user.date_of_birth,
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Register Moderator
app.post("/api/moderator/register", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const modExists = await pool.query("SELECT * FROM moderators WHERE email = $1", [email])
    if (modExists.rows.length > 0) {
      return res.status(400).json({ error: "Moderator already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query("INSERT INTO moderators (email, password) VALUES ($1, $2) RETURNING id, email", [
      email,
      hashedPassword,
    ])

    res.status(201).json({
      message: "Moderator registered successfully",
      moderator: result.rows[0],
    })
  } catch (err) {
    console.error("Moderator registration error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Login Moderator
app.post("/api/moderator/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const result = await pool.query("SELECT * FROM moderators WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const moderator = result.rows[0]
    const passwordMatch = await bcrypt.compare(password, moderator.password)

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    res.json({
      message: "Login successful",
      moderator: {
        id: moderator.id,
        email: moderator.email,
      },
    })
  } catch (err) {
    console.error("Moderator login error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// ============ USER ROUTES ============

// Get user profile
app.get("/api/user/:id", async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, user_type, date_of_birth, created_at FROM users WHERE id = $1",
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error fetching user:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Update user profile
app.put("/api/user/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, dateOfBirth } = req.body

    const result = await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, date_of_birth = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
      [firstName, lastName, dateOfBirth, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    })
  } catch (err) {
    console.error("Error updating user:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// ============ MODERATOR ROUTES ============

// Get all notifications for moderator
app.get("/api/moderator/:id/notifications", async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      "SELECT n.id, n.message, n.is_read, n.created_at, u.id as user_id, u.first_name, u.last_name, u.email FROM notifications n JOIN users u ON n.new_user_id = u.id WHERE n.moderator_id = $1 ORDER BY n.created_at DESC",
      [id],
    )

    res.json(result.rows)
  } catch (err) {
    console.error("Error fetching notifications:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Mark notification as read
app.put("/api/notification/:id/read", async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *", [id])

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error updating notification:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Get user profile for moderator
app.get("/api/moderator/user/:id", async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, user_type, date_of_birth, created_at FROM users WHERE id = $1",
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error fetching user:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Get all users for moderator
app.get("/api/moderator/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, user_type, date_of_birth, created_at FROM users ORDER BY created_at DESC",
    )
    res.json(result.rows)
  } catch (err) {
    console.error("Error fetching all users:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// ============ IN DEVELOPMENT ROUTES ============

app.get("/api/chats", (req, res) => {
  res.status(503).json({ error: "Chats feature is under development" })
})

app.get("/api/interactive", (req, res) => {
  res.status(503).json({ error: "Interactive features are under development" })
})

app.get("/api/groups", (req, res) => {
  res.status(503).json({ error: "Groups feature is under development" })
})

app.get("/api/private-messages", (req, res) => {
  res.status(503).json({ error: "Private messages are under development" })
})

app.get("/api/games", (req, res) => {
  res.status(503).json({ error: "Games feature is under development" })
})

// Serve index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
})

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dashboard.html"))
})

app.get("/moderator", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "moderator.html"))
})

// Start server
app.listen(PORT, () => {
  console.log(`BridgeGap server is running on http://localhost:${PORT}`)
})
