import { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, useNavigate } from "react-router-dom";
import Profile from "./Profile";
import SecurityAssessment from "./SecurityAssessment";
import "./styles/styles.css";

function App() {
	const [questions, setQuestions] = useState([]);  
	const [profileResponses, setProfileResponses] = useState({});  
	const [responses, setResponses] = useState({});  
	const [assessmentComplete, setAssessmentComplete] = useState(false);
	const [score, setScore] = useState(null);
	const [riskLevel, setRiskLevel] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		axios.get("http://localhost:5001/api/questions")
			.then((response) => setQuestions(response.data))
			.catch(() => {});
	}, []);

	useEffect(() => {
		const savedProfile = localStorage.getItem("profileResponses");
		if (savedProfile) {
			const parsedProfile = JSON.parse(savedProfile);
			setProfileResponses(parsedProfile);
		}
	}, []);	

	const handleProfileSubmit = (profileData) => {
	
		setTimeout(() => {
			setProfileResponses(profileData);
			localStorage.setItem("profileResponses", JSON.stringify(profileData));
			navigate("/security-assessment");
		}, 50);
	};	
	
	// FOR NOW TO START OVER / MIGHT NOT NEED IT IF I START TO STORE EVERYTHING
	const clearResults = () => {
		localStorage.removeItem("profileResponses");
		localStorage.removeItem("score");
		localStorage.removeItem("riskLevel");
		localStorage.removeItem("assessmentComplete");
	
		setProfileResponses({});
		setScore(null);
		setRiskLevel("");
		setAssessmentComplete(false);
		setResponses({});
		
		navigate("/");
	};
	

	const handleSubmit = async () => {
	
		const formattedResponses = Object.entries(responses).map(([id, response]) => ({
			id: id.toString(),
			answer: response.answer,
			subresponses: response.subresponses || {},
		}));
	
		try {
			const res = await axios.post("http://localhost:5001/api/score", {
				responses: formattedResponses
			});
	
			setScore(res.data.score);
			setRiskLevel(res.data.level);
			setAssessmentComplete(true);
			navigate("/results");
		} catch (error) {
			console.error("Error submitting assessment:", error);
		}
	};	

	return (
		<Routes>
			<Route path="/" element={<Profile onSubmit={handleProfileSubmit} />} />
			<Route 
				path="/security-assessment" 
				element={
					<SecurityAssessment 
						questions={questions} 
						responses={responses} 
						setResponses={setResponses} 
						onSubmit={handleSubmit} 
					/>
				} 
			/>
			<Route path="/results" element={
				assessmentComplete ? (
				<div className="container">
					<h1>Assessment Completed</h1>
					<h2>Your Score: {score}%</h2>
					<h3>Risk Level: {riskLevel}</h3>

					<div className="profile-container">
						<h2>Profile Information</h2>
						<div className="profile-card">
							<p><strong>Job Title:</strong> {profileResponses.title || "N/A"}</p>
							<p><strong>Role:</strong> {profileResponses.description || "N/A"}</p>
							<p><strong>Industry:</strong> {profileResponses.industry || "N/A"}</p>
							<p><strong>Compliance Requirements:</strong> {profileResponses.compliance?.join(", ") || "None"}</p>
							<p><strong>Biggest Challenge:</strong> {profileResponses.biggest_challenge || "Not specified"}</p>
							<p><strong>Reason:</strong> {profileResponses.challenge_reason || "Not specified"}</p>
						</div>
					</div>

					<button className="button" onClick={clearResults}>Restart Assessment</button>
				</div>
			) : (
				<h1>Loading results...</h1>
			)
		} />

		</Routes>
	);
}

export default App;
