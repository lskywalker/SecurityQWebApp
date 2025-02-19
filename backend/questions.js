const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

let questions = [];

try {
	const data = fs.readFileSync(path.join(__dirname, "assessment", "questions.json"), "utf-8");
	questions = JSON.parse(data);
} catch (error) {
	console.error("Error loading questions.json:", error);
}

router.get("/api/questions", (req, res) => {
	if (questions.length === 0) {
		return res.status(404).json({ error: "Security questions not found" });
	}
	res.json(questions);
});

module.exports = router;
