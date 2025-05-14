import express from "express"
import cors from "cors"
import path from "path"
import delegatesRoutes from "./api/routes/delegates"

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes
app.use("/api/delegates", delegatesRoutes)

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../../client/build")))

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/build/index.html"))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
