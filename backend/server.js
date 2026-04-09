const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// CONNECT MONGODB
mongoose.connect("mongodb://127.0.0.1:27017/todoDB")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

// MODELS
const User = mongoose.model("User", {
  email: String,
  password: String
});

const Task = mongoose.model("Task", {
  userId: String,
  task: String,
  deadline: String,
  completed: Boolean
});

// AUTH MIDDLEWARE
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.send("No token");

  try {
    const decoded = jwt.verify(token, "secret");
    req.userId = decoded.id;
    next();
  } catch {
    res.send("Invalid token");
  }
}

// SIGNUP
app.post("/signup", async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.send("Fill all fields");
  }

  const hashed = await bcrypt.hash(req.body.password, 10);
  await User.create({ email: req.body.email, password: hashed });

  res.send("Signup success");
});

// LOGIN
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.send("User not found");

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) return res.send("Wrong password");

  const token = jwt.sign({ id: user._id }, "secret");
  res.json({ token });
});

// ADD TASK
app.post("/addTask", auth, async (req, res) => {
  console.log("Incoming Task:", req.body);

  const task = await Task.create({
    userId: req.userId,
    task: req.body.task,
    deadline: req.body.deadline,
    completed: false
  });

  res.json(task);
});

// GET TASKS
app.get("/tasks", auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.userId });
  res.json(tasks);
});

// COMPLETE TASK
app.put("/complete/:id", auth, async (req, res) => {
  await Task.findByIdAndUpdate(req.params.id, { completed: true });
  res.send("Completed");
});

// DELETE TASK
app.delete("/delete/:id", auth, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

app.listen(5000, () => console.log("Server running on port 5000"));