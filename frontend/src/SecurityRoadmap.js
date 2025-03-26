import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./styles/styles.css";

function SecurityRoadmap() {
	const { userId } = useParams();
	const [roadmap, setRoadmap] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchRoadmap = async () => {
			try {
				const res = await axios.get(`http://localhost:5001/api/get-responses/${userId}`);
				if (res.data.roadmap) {
					setRoadmap(res.data.roadmap);
				}
			} catch (error) {
				console.error("🚨 Error fetching roadmap:", error);
			}
			setLoading(false);
		};

		fetchRoadmap();
	}, [userId]);

	const handleGenerateRoadmap = async () => {
		setLoading(true);

		try {
			await axios.post(`http://localhost:5001/api/generate-roadmap`, { userId });

			setTimeout(async () => {
				const res = await axios.get(`http://localhost:5001/api/get-responses/${userId}`);
				if (res.data.roadmap) {
					setRoadmap(res.data.roadmap);
				}
				setLoading(false);
			}, 5000);
		} catch (error) {
			console.error("🚨 Error generating roadmap:", error);
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="roadmap-page">
			<div className="roadmap-container">
				<h1 className="roadmap-title">⏳ Loading roadmap... Please wait</h1>
			</div>
			</div>
		);
	}

	return (
		<div className="roadmap-page">
			<div className="roadmap-container">
			<h1 className="roadmap-title">🔐 Personalized Security Roadmap</h1>
		
			{roadmap ? (
				<div className="roadmap-content">
				<ReactMarkdown>{roadmap}</ReactMarkdown>
				</div>
			) : (
				<button className="button" onClick={handleGenerateRoadmap}>
				🛠 Generate Security Roadmap
				</button>
			)}
		
			<div className="roadmap-buttons">
				<button className="button" onClick={() => navigate(`/results/${userId}`)}>
				⬅️ Back to Results
				</button>
			</div>
			</div>
		</div>
		);
		
}

export default SecurityRoadmap;
