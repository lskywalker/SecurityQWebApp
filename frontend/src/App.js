import { useState, useEffect } from "react";
import axios from "axios";
import "./styles.css";

function App() {
	const [questions, setQuestions] = useState([]);
	const [responses, setResponses] = useState({});
	const [currentIndex, setCurrentIndex] = useState(0);
	const [subIndex, setSubIndex] = useState(-1);
	const [score, setScore] = useState(null);
	const [loading, setLoading] = useState(true);
	const [assessmentComplete, setAssessmentComplete] = useState(false);
	const [riskLevel, setRiskLevel] = useState("");
	const [selectedExplanation, setSelectedExplanation] = useState(null);

	useEffect(() => {
		axios
			.get("http://localhost:5001/api/questions")
			.then((response) => {
				setQuestions(response.data);
				setLoading(false);
			})
			.catch(() => {});
	}, []);

	const handleResponse = (answer) => {
		const currentQuestion = questions[currentIndex];

		setResponses((prev) => ({
			...prev,
			[currentQuestion.id]: {
				answer,
				subresponses: prev[currentQuestion.id]?.subresponses || {},
			},
		}));

		if (answer === "No" || !currentQuestion.subquestions) {
			moveToNextQuestion();
		} else {
			setSubIndex(0);
		}
	};

  const handleSubResponse = (subId, subAnswer) => {
    setResponses((prev) => {
        const currentQuestion = questions[currentIndex];

        return {
            ...prev,
            [currentQuestion.id]: {
                ...prev[currentQuestion.id],
                subresponses: {
                    ...prev[currentQuestion.id]?.subresponses,
                    [subId]: subAnswer,
                },
            },
        };
    });

    const currentQuestion = questions[currentIndex];

    if (subIndex < currentQuestion.subquestions.length - 1) {
        setSubIndex((prev) => prev + 1);
    } else {
        setSubIndex(-1);
        moveToNextQuestion();
    }
};


	const moveToNextQuestion = () => {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex((prevIndex) => prevIndex + 1);
			setSelectedExplanation(null);
			setSubIndex(-1);
		} else {
			handleSubmit();
		}
	};

	const handleSubmit = async () => {
		const formattedResponses = Object.entries(responses).map(([id, response]) => ({
			id: parseInt(id),
			answer: response.answer,
			subresponses: response.subresponses || {},
		}));

		try {
			const res = await axios.post("http://localhost:5001/api/score", { responses: formattedResponses });
			setScore(res.data.score);
      setRiskLevel(res.data.level);
			setAssessmentComplete(true);
		} catch {}
	};

	if (loading) return <h1 className="text-center">Loading questions...</h1>;

	if (assessmentComplete) {
		return (
			<div className="container">
				<h1>Assessment Completed</h1>
				<h2>Your Score: {score}%</h2>
        		<h3>Risk Level: {riskLevel}</h3>
			</div>
		);
	}

	const currentQuestion = questions[currentIndex];

	if (subIndex >= 0) {
		const currentSub = currentQuestion.subquestions[subIndex];

		return (
			<div className="container">
				<h1>{currentSub.question}</h1>

				{subIndex >= 0 &&
					currentSub.options.map((option) => (
						<button key={option} className="button" onClick={() => handleSubResponse(currentSub.id, option)}>
							{option}
						</button>
					))}
			</div>
		);
	}

	return (
		<div className="container">
			<h1>{currentQuestion.question}</h1>

			{currentQuestion.options.map((option) => (
				<button key={option} className="button" onClick={() => handleResponse(option)}>
					{option}
				</button>
			))}

			<div style={{ marginTop: "10px" }}>
				<button
					style={{ background: "none", border: "none", cursor: "pointer" }}
					onClick={() => setSelectedExplanation(selectedExplanation === currentQuestion.explanation ? null : currentQuestion.explanation)}
				>
					<img 
						src="/img/question-mark.jpg" 
						alt="More Info" 
						style={{ width: "20px" }}
					/>
					<span style={{ color: "#ff6b6b", fontStyle: "italic", marginLeft: "5px" }}>More info</span>
				</button>
			</div>

			{selectedExplanation && <p style={{ fontSize: "14px", color: "gray", fontStyle: "italic" }}>{selectedExplanation}</p>}
		</div>
	);
}

export default App;
