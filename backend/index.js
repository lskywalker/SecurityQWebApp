const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const profileRoutes = require("./profile");
const questionsRoutes = require("./questions");

app.use(profileRoutes);
app.use(questionsRoutes);

const RESPONSES_FILE = path.join(__dirname, "assessment", "responses.json");
const QUESTIONS_FILE = path.join(__dirname, "assessment", "questions.json");

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

let questions = [];
try {
	const data = fs.readFileSync(QUESTIONS_FILE, "utf-8");
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

const getRiskLevel = (score) => {
	if (score >= 80) return "Advanced";
	if (score >= 60) return "Mature";
	if (score >= 40) return "Moderate";
	if (score >= 20) return "At Risk";
	return "Non-Existent";
};

const loadResponses = () => {
	try {
		if (!fs.existsSync(RESPONSES_FILE)) return [];
		const data = fs.readFileSync(RESPONSES_FILE, "utf-8");
		const parsed = JSON.parse(data);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error("Error loading responses.json:", error);
		return [];
	}
};

const saveResponses = (responses) => {
	try {
		fs.writeFileSync(RESPONSES_FILE, JSON.stringify(responses, null, 2));
	} catch (error) {
	console.error("Error saving responses.json:", error);
	}
};

const generateNumericUserId = (savedResponses, length = 8) => {
	let userId;
	do {
		userId = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
	} while (savedResponses.some(entry => entry.userId === userId));
	return userId;
};

app.post("/api/score", async (req, res) => {
	let { userId, profileResponses, assessmentResponses } = req.body;
		
	if (!assessmentResponses || !Array.isArray(assessmentResponses)) {
		return res.status(400).json({ error: "Invalid request format" });
	}

	let savedResponses = loadResponses();
	if (!Array.isArray(savedResponses)) savedResponses = [];

	userId = generateNumericUserId(savedResponses);

	let totalScore = 0;
	let maxPossibleScore = calculateMaxPossibleScore() - 10;
	let bestAnswers = ["Monthly", "Quarterly", "Every few minutes", "Hourly", "Per session", "Manually"];
		
	let categoryScores = {};
	let categoryMaxScores = {};

	questions.forEach((question) => {
		if (question.categories) {
			question.categories.forEach((category) => {
				if (!categoryMaxScores[category]) categoryMaxScores[category] = 0;
				if (!categoryScores[category]) categoryScores[category] = 0;
				categoryMaxScores[category] += 5;`		`
			});
		}
	
		if (question.subquestions) {
			question.subquestions.forEach((sub) => {
				if (sub.categories) {
					sub.categories.forEach((category) => {
						if (!categoryMaxScores[category]) categoryMaxScores[category] = 0;
						if (!categoryScores[category]) categoryScores[category] = 0;
						categoryMaxScores[category] += 5;
					});
				}
			});
		}
	});

	questions.forEach((question) => {
		const response = assessmentResponses.find((r) => parseInt(r.id) === parseInt(question.id));
		if (response) {
			
			if (response.answer === "Yes") {
				totalScore += 10;
				question.categories.forEach((category) => {
					categoryScores[category] = (categoryScores[category] || 0) + 5;
				});
			}
			
			if (question.subquestions) {
				question.subquestions.forEach((subquestion) => {
					const subAnswer = response.subresponses ? response.subresponses[subquestion.id] : null;
					
					if (subAnswer && (subAnswer === "Yes" || bestAnswers.includes(subAnswer))) {
						totalScore += 5;
						subquestion.categories.forEach((category) => {
							categoryScores[category] = (categoryScores[category] || 0) + 5;
						});
					}
				});
			}
		}
	});
		
	let categoryMaturity = {};
	for (const category in categoryScores) {
		let earnedPoints = categoryScores[category];
		let maxPoints = categoryMaxScores[category];
		let percentage = 0;
		if (maxPoints > 0) {
			percentage = (earnedPoints / maxPoints) * 100;
		}

		categoryMaturity[category] = {
			score_percentage: Math.round(percentage),
			maturity_level: getMaturityLevel(percentage),
			color: getMaturityColor(percentage)
		};
	}
		
	let normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
	let riskLevel = getRiskLevel(normalizedScore);

	let existingUser = savedResponses.find((entry) => entry.userId === userId);
	if (existingUser) {
		existingUser.profileResponses = profileResponses;
		existingUser.assessmentResponses = assessmentResponses;
		existingUser.score = normalizedScore;
		existingUser.riskLevel = riskLevel;
		existingUser.categoryMaturity = categoryMaturityArray;
	} else {
		savedResponses.push({
			userId,
			profileResponses,
			assessmentResponses,
			score: normalizedScore,
			riskLevel,
			categoryMaturity,
			roadmap: null,
		});
	}

	saveResponses(savedResponses);
		
	const categoryMaturityArray = Object.entries(categoryMaturity).map(([category, data]) => ({
		category,
		score: data.score_percentage,
		color: data.color,
		maturity: data.maturity_level
	}));

	res.json({ userId, score: normalizedScore, riskLevel, categoryMaturity: categoryMaturityArray });
});

function getMaturityLevel(score) {
	if (score < 30) return "At Risk";
	if (score < 60) return "Moving Toward Maturity";
	if (score < 90) return "Mature";
	return "Advanced";
}

function getMaturityColor(score) {
	if (score < 30) return "#FFCCCC";   // Light Coral
	if (score < 60) return "#FFE5B4";   // Light Orange
	if (score < 90) return "#D5F5E3";   // Pale Mint
	return "#CCE5FF";				   // Light Sky Blue
}

app.get("/api/get-responses/:userId", (req, res) => {
	const { userId } = req.params;
	let savedResponses = loadResponses();
  
	if (!Array.isArray(savedResponses)) {
		savedResponses = [];
	}
  
	let userEntry = savedResponses.find((entry) => entry.userId === decodeURIComponent(userId));
	if (!userEntry) {
		console.error(`🚨 User not found: ${userId}`);
		return res.status(404).json({ error: "User responses not found" });
	}

	if (!Array.isArray(userEntry.categoryMaturity)) {
		userEntry.categoryMaturity = Object.entries(userEntry.categoryMaturity || {}).map(([category, data]) => ({
			category,
			score: 1,
			color: data.color,
			maturity: data.maturity_level || "Unknown",
		}));
	}

	res.json(userEntry);
  });

app.post("/api/generate-roadmap", async (req, res) => {
	const { userId } = req.body;
	if (!userId) {
	  return res.status(400).json({ error: "User ID is required" });
	}
  
	let savedResponses = loadResponses();
	let userEntry = savedResponses.find((entry) => entry.userId === userId);
  
	if (!userEntry) {
	  console.error(`🚨 User not found in responses.json: ${userId}`);
	  return res.status(404).json({ error: "User responses not found" });
	}
  
	const { profileResponses, assessmentResponses, score, riskLevel, categoryMaturity } = userEntry;
  
	const prompt = `
    I need your help generating a tailored security roadmap based on the following user information and assessment results. For this roadmap recommendation I want you to take the role of a cybersecurity consultant advising a client on how to improve their security posture.

    # User Security Profile
    - Full Name: \${profileResponses.full_name || "N/A"}
    - Company: \${profileResponses.company_name || "N/A"}
    - Job Title: \${profileResponses.title || "N/A"}
    - Industry: \${profileResponses.industry || "N/A"}
    - Compliance Requirements: \${profileResponses.compliance?.join(", ") || "None"}
    - Biggest Security Challenge: \${profileResponses.biggest_challenge || "N/A"}
    - Reason for this challenge: \${profileResponses.challenge_reason || "N/A"}

    # Security Assessment Summary
    - Overall Security Score: \${score}%
    - Risk Level: \${riskLevel}
    - Maturity by Category:
    \${Object.entries(categoryMaturity)
      .map(([category, data]) => \`  - \${category}: \${data.maturity_level} (\${data.score_percentage}%)\`)
      .join("\\n")}
    
    Please use the score_percentage above to decide priority, but do not display the percentages anywhere in the roadmap. Only show the maturity level like "At Risk", "Mature", etc.

    # Assessment Answers
    \${assessmentResponses.map(response => \`- Question \${response.id}: \${response.answer} \${response.subresponses ? \`(\${JSON.stringify(response.subresponses)})\` : ""}\`).join("\\n")}
    
    ---
    
    # What I need from you:
    Please generate a detailed, practical, and prioritized security roadmap that helps this company improve their overall security posture. Focus on:
    
    - Highlighting the most critical weaknesses, especially in categories marked "At Risk" or "Moving Toward Maturity".
    - Recommending specific, actionable steps the company should take to improve each weak area.
    - Prioritizing the tasks — what should they tackle first? What's less urgent?
    - Considering their industry, compliance requirements, and biggest challenge when suggesting improvements.
    - Check the industries they provided as answer and check online if they are missing any compliance requirements for that industry.
    - If possible, recommend tools, frameworks, or resources that would help them take action.
    
    Please format the roadmap clearly in these sections:
    1. Critical Security Gaps
    2. Medium-Priority Actions
    3. Long-Term Goals

    Keep the tone professional, but human — like you're advising a client.

    Make sure to also focus on HOW they will implement these changes, not just WHAT they should do.

    ---
    
    # Additional Heading Instructions:
    - Use "# Personalized Security Roadmap" (if you include a top-level title).
    - Use "## Tailored Security Roadmap for [Full Name]" to introduce the user-specific roadmap.
    - Use "###" headings for each numbered section (e.g., "### 1. Critical Security Gaps", "### 2. Medium-Priority Actions", etc.).
	`;
	try {
		const response = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [{ role: "user", content: prompt }],
		max_tokens: 1000,
	});

	if (!response.choices || !response.choices[0] || !response.choices[0].message.content) {
		console.error("🚨 OpenAI response missing content:", response);
		return res.status(500).json({ error: "Failed to generate roadmap" });
	}
  
	const roadmap = response.choices[0].message.content.trim();

	userEntry.roadmap = roadmap;
	saveResponses(savedResponses);

	res.json({ roadmap });
	} catch (error) {
	console.error("🚨 Error generating roadmap:", error);
	res.status(500).json({ error: "Failed to generate security roadmap" });
	}
  });

app.listen(5001, () => console.log("Server running on port 5001"));
