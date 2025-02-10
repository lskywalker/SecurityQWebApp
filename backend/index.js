const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Load questions from `questions.json`
let questions = [];
try {
	const data = fs.readFileSync("./questions.json", "utf-8");
	questions = JSON.parse(data);
} catch (error) {
	console.error("Error loading questions.json:", error);
}

// API to get all questions
app.get("/api/questions", (req, res) => {
	res.json(questions);
});

// Calculate risk score
app.post("/api/score", (req, res) => {
	const responses = req.body.responses;
	let totalScore = 0;
	let maxPossibleScore = 190;
	let bestAnswers = [
		"Monthly",
		"Quarterly",
		"Every few minutes",
		"Hourly"
	]

	questions.forEach((question) => {
		const response = responses.find((r) => r.id === question.id);
		if (response && response.answer === "Yes") {
			totalScore += 10; 

			if (question.subquestions) {
				question.subquestions.forEach((subquestion) => {
					const subAnswer = response.subresponses ? response.subresponses[subquestion.id] : null;

					if (subAnswer) {
						if (subAnswer === "Yes" || bestAnswers.includes(subAnswer)) {
							totalScore += 5;
						}
					}
				});
			}
		}
	});

	let normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);

	res.json({ score: normalizedScore, level: getRiskLevel(normalizedScore) });
});

// Risk Level Calculation
const getRiskLevel = (score) => {
	if (score >= 80) return "Advanced";
	if (score >= 60) return "Mature";
	if (score >= 40) return "Moderate";
	if (score >= 20) return "At Risk";
	return "Non-Existent";
};

app.listen(5001, () => console.log("Server running on port [5001]"));
