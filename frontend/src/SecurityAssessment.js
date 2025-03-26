import { useState, useEffect } from "react";
import axios from "axios";
import "./styles/styles.css";

function SecurityAssessment({ questions, responses, setResponses, onSubmit }) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [subIndex, setSubIndex] = useState(-1);
	const [showExplanation, setShowExplanation] = useState(false);

	useEffect(() => {
		if (questions.length === 0) {
			axios.get("http://localhost:5001/api/questions")
				.then((response) => setResponses({ questions: response.data }))
				.catch(() => {});
		}
	}, [questions, setResponses]);

	const handleResponse = (answer) => {
		const currentQuestion = questions[currentIndex];

		setResponses((prev) => ({
			...prev,
			[currentQuestion.id]: {
				answer,
				subresponses: prev[currentQuestion.id]?.subresponses || {},
			},
		}));

		if (answer === "Yes" && currentQuestion.subquestions) {
			setSubIndex(0);
		} else {
			moveToNextQuestion();
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
			setSubIndex(-1);
			setShowExplanation(false);
		} else {
			onSubmit();
		}
	};

	if (questions.length === 0) {
		return <h1>Loading security questions...</h1>;
	}

	const currentQuestion = questions[currentIndex];

	if (subIndex >= 0) {
		const currentSub = currentQuestion.subquestions[subIndex];

		return (
			<div className="assessment-page">
				<div className="assessment-card">
					<h1>{currentSub.question}</h1>
					{currentSub.options.map((option) => (
						<button
							key={option}
							className="button"
							onClick={() => handleSubResponse(currentSub.id, option)}
						>
						{option}
						</button>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="assessment-page">
			<div className="assessment-card">
				<h1>{currentQuestion.question}</h1>

				{currentQuestion.options.map((option) => (
					<button
					key={option}
					className="button"
					onClick={() => handleResponse(option)}
					>
					{option}
					</button>
				))}

				{currentQuestion.explanation && (
					<div className="explanation-container">
						<button className="question-mark-btn" onClick={() => setShowExplanation((prev) => !prev)}>
							❓
						</button>
						{showExplanation && (
							<div className="explanation-box">
								<p><i>{currentQuestion.explanation}</i></p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
		);
}

export default SecurityAssessment;
