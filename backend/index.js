const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const profileRoutes = require("./profile");
const questionsRoutes = require("./questions");

app.use(profileRoutes);
app.use(questionsRoutes);

let questions = [];
try {
	const data = fs.readFileSync(path.join(__dirname, "assessment", "questions.json"), "utf-8");
	questions = JSON.parse(data);
} catch (error) {
	console.error("Error loading questions.json:", error);
}

const calculateMaxPossibleScore = () => {
	let maxScore = 0;
	questions.forEach((question) => {
		maxScore += 10;
		if (question.subquestions) {
			maxScore += question.subquestions.length * 5;
		}
	});
	return maxScore;
};

app.post("/api/score", (req, res) => {

	const responses = req.body.responses;
	if (!responses || !Array.isArray(responses)) {
		return res.status(400).json({ error: "Invalid responses format" });
	}

	let totalScore = 0;
	let maxPossibleScore = calculateMaxPossibleScore() - 10;
	let bestAnswers = ["Monthly", "Quarterly", "Every few minutes", "Hourly", "Per session", "Manually"];

	questions.forEach((question) => {
		const response = responses.find((r) => parseInt(r.id) === parseInt(question.id));
	
		if (response) {
			if (response.answer === "Yes") {
				totalScore += 10;
				if (question.subquestions) {
					question.subquestions.forEach((subquestion) => {
						const subAnswer = response.subresponses ? response.subresponses[subquestion.id] : null;
						if (subAnswer && (subAnswer === "Yes" || bestAnswers.includes(subAnswer))) {
							totalScore += 5;
						}
					});
				}
			} 
		}
	});	
	let normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);

	res.json({ score: normalizedScore, level: getRiskLevel(normalizedScore) });
});

const getRiskLevel = (score) => {
	if (score >= 80) return "Advanced";
	if (score >= 60) return "Mature";
	if (score >= 40) return "Moderate";
	if (score >= 20) return "At Risk";
	return "Non-Existent";
};

app.listen(5001, () => console.log("Server running on port 5001"));
