import express from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";

const app = express();
app.use(cors());
app.use(express.json());

const users = {};
const tasks = [
  {
    id: "task1",
    link: "https://instagram.com/example",
    reward: 10,
    duration: 20
  }
];

app.get("/", (req, res) => {
  res.send("SocialHub Backend is running");
});

app.post("/auth/login", (req, res) => {
  const userId = uuid();
  users[userId] = { id: userId, points: 0, completed: [] };
  res.json({ userId });
});

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/tasks/start", (req, res) => {
  const { userId, taskId } = req.body;
  if (!users[userId]) return res.status(403).json({ error: "User not found" });
  users[userId].activeTask = { taskId, startedAt: Date.now() };
  res.json({ success: true });
});

app.post("/tasks/complete", (req, res) => {
  const { userId, taskId } = req.body;
  const user = users[userId];
  const task = tasks.find(t => t.id === taskId);

  if (!user || !task) return res.status(400).end();

  const spent = (Date.now() - user.activeTask.startedAt) / 1000;
  if (spent < task.duration)
    return res.status(400).json({ error: "Time not enough" });

  user.points += task.reward;
  user.completed.push(taskId);
  user.activeTask = null;

  res.json({ success: true, points: user.points });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
