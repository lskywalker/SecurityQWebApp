const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const PROFILE_FILE = path.join(__dirname, "assessment", "profile.json");

let profileQuestions = [];

const loadProfileQuestions = () => {
    try {
        const data = fs.readFileSync(PROFILE_FILE, "utf-8");
        profileQuestions = JSON.parse(data);
    } catch (error) {
        console.error("Error loading profile.json:", error);
        profileQuestions = [];
    }
};

loadProfileQuestions();

router.get("/api/profile", (req, res) => {
    if (!profileQuestions.length) {
        console.error("⚠️ Profile questions are empty. Check profile.json!");
        return res.status(500).json({ error: "Profile questions not found or failed to load" });
    }
    res.json(profileQuestions);
});

module.exports = router;
