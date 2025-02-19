const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

let profileQuestions = [];

try {
	const data = fs.readFileSync(path.join(__dirname, "assessment", "profile.json"), "utf-8");
	profileQuestions = JSON.parse(data);
} catch (error) {
	console.error("Error loading profile.json:", error);
}

router.get("/api/profile", (req, res) => {
	if (profileQuestions.length === 0) {
		return res.status(404).json({ error: "Profile questions not found" });
	}
	res.json(profileQuestions);
});

module.exports = router;
