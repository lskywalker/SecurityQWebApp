import { useState, useEffect} from "react";
import axios from "axios";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Profile from "./Profile";
import SecurityAssessment from "./SecurityAssessment";
import SecurityRoadmap from "./SecurityRoadmap";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell} from "recharts";
import "./styles/styles.css";

function App() {
	const [questions, setQuestions] = useState([]);
	const [profileResponses, setProfileResponses] = useState({});
	const [responses, setResponses] = useState({});
	// eslint-disable-next-line no-unused-vars
	const [score, setScore] = useState(null);
	// eslint-disable-next-line no-unused-vars
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

	const handleSubmit = async () => {
		const formattedResponses = Object.entries(responses).map(([id, response]) => ({
			id: id.toString(),
			answer: response.answer,
			subresponses: response.subresponses || {},
		}));

		try {
			const res = await axios.post("http://localhost:5001/api/score", {
				profileResponses,
				assessmentResponses: formattedResponses,
			});
			setScore(res.data.score);
			setRiskLevel(res.data.riskLevel);
			
			localStorage.setItem("userId", res.data.userId); 
			navigate(`/results/${res.data.userId}`);			
		} catch (error) {
			console.error("Error submitting assessment:", error);
		}
	};
	
	function ResultsPage() {
		const { userId } = useParams();
		const navigate = useNavigate();
		const [score, setScore] = useState(null);
		const [riskLevel, setRiskLevel] = useState("");
		const [roadmap, setRoadmap] = useState("");
		const [categoryMaturity, setCategoryMaturity] = useState([]);
		const [loadingResults, setLoadingResults] = useState(false);
		
		const [profile, setProfile] = useState({});
		
		useEffect(() => {
			if (!userId) return;
		
			const fetchResults = async () => {
			if (loadingResults) return;
			setLoadingResults(true);
		
			try {
				console.log("Fetching results for userId:", userId);
				const res = await axios.get(`http://localhost:5001/api/get-responses/${userId}`);
				if (res.data) {
				setScore(res.data.score);
				setRiskLevel(res.data.riskLevel);
				setRoadmap(res.data.roadmap || "");
				setCategoryMaturity(Array.isArray(res.data.categoryMaturity) ? res.data.categoryMaturity : []);
				setProfile(res.data.profileResponses || {});
				}
			} catch (err) {
				console.error("Error fetching results:", err);
			} finally {
				setLoadingResults(false);
			}
			};
		
			fetchResults();
		}, [userId, loadingResults]);		

		return (
			<div className="container">
				{loadingResults ? (
					<h1>🔄 Loading results...</h1>
				) : (
					<>
						<h1>Assessment Completed</h1>
						<h2>Your Score: {score}%</h2>
						<h3>Security Maturity: {riskLevel}</h3>
	
						<div className="profile-container">
							<h2>Profile Information</h2>
								<p><strong>Name:</strong> {profile.full_name || "N/A"}</p>
								<p><strong>Company:</strong> {profile.company_name || "N/A"}</p>
								<p><strong>Job Title:</strong> {profile.title || "N/A"}</p>
								<p><strong>Role:</strong> {profile.description || "N/A"}</p>
								<p><strong>Industry:</strong> {profile.industry || "N/A"}</p>
								<p><strong>Compliance Requirements:</strong> {profile.compliance?.join(", ") || "None"}</p>
								<p><strong>Biggest Challenge:</strong> {profile.biggest_challenge || "Not specified"}</p>
								<p><strong>Reason:</strong> {profile.challenge_reason || "Not specified"}</p>
						</div>

						<div className="chart-container">
							<h2>Category Maturity Overview</h2>
							<ResponsiveContainer width="100%" height={400}>
								<BarChart data={categoryMaturity} layout="vertical" margin={{ top: 20, right: 50, left: 100, bottom: 20 }}>
									<XAxis type="number" hide />
									<YAxis dataKey="category" type="category" width={300} />
									<Tooltip 
										cursor={{ fill: 'transparent' }}
										content={({ active, payload, coordinate }) => {
											if (!active || !payload || payload.length === 0) return null;
											const data = payload[0].payload;
											return (
												<div
													style={{
														position: 'absolute',
														left: coordinate.x + 10,
														top: coordinate.y - 10,
														backgroundColor: '#fff',
														padding: '8px 12px',
														borderRadius: '5px',
														border: '1px solid #ccc',
														boxShadow: '0px 2px 8px rgba(0,0,0,0.2)',
														pointerEvents: 'none',
														whiteSpace: 'nowrap'
													}}
												>
													<strong>{data.maturity}</strong>
												</div>
											);
										}}
									/>
									<Bar dataKey="score" barSize={30}>
										{categoryMaturity.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
						<button className="button" onClick={() => navigate(`/roadmap/${userId}`)}>
							{roadmap ? "View Security Roadmap" : "Generate Security Roadmap"}
						</button>
					</>
				)}
			</div>
		);
	}

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
			<Route path="/results/:userId" element={<ResultsPage />} />
			<Route path="/roadmap/:userId" element={<SecurityRoadmap />} />
		</Routes>
	);
}

export default App;
