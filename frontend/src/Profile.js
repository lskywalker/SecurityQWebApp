import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import "./styles/Profile.css";

function Profile({ onSubmit }) {
	const [profileQuestions, setProfileQuestions] = useState([]);
	const [responses, setResponses] = useState({});
	const [currentIndex, setCurrentIndex] = useState(0);
	const [inputValue, setInputValue] = useState("");
	const [selectedOptions, setSelectedOptions] = useState([]);
	const [dropdownValue, setDropdownValue] = useState("");
	const [otherInput, setOtherInput] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		axios.get("http://localhost:5001/api/profile")
			.then((response) => setProfileQuestions(response.data))
			.catch(() => {});
	}, []);

	const handleResponse = (answer) => {
		const currentQuestion = profileQuestions[currentIndex];

		setResponses((prev) => ({
			...prev,
			[currentQuestion.id]: answer,
		}));

		setInputValue("");
		setSelectedOptions([]);
		setDropdownValue("");
		setOtherInput("");

		if (currentIndex === profileQuestions.length - 1) {
			setTimeout(() => {
				onSubmit({ ...responses, [currentQuestion.id]: answer });
				navigate("/security-assessment");
			}, 100);
		} else {
			setCurrentIndex((prevIndex) => prevIndex + 1);
		}
	};

	const handleMultiSelect = (option) => {
		setSelectedOptions((prev) => {
			if (prev.includes(option)) {
				return prev.filter((item) => item !== option);
			} else {
				return [...prev, option];
			}
		});
	};

	const submitMultiSelect = () => {
		handleResponse(selectedOptions);
	};

	if (profileQuestions.length === 0) {
		return <h1>Loading profile questions...</h1>;
	}

	const currentQuestion = profileQuestions[currentIndex];

	const dropdownOptions = Array.isArray(currentQuestion.options)
		? (currentQuestion.options.includes("Other") ? currentQuestion.options : [...currentQuestion.options, "Other"])
		: [];

	return (
		<div className="profile-page">
			<div className="question-card">
			<h1>{currentQuestion.question}</h1>

			{currentQuestion.type === "text" && (
				<div className="input-container">
					<input
						type="text"
						className="input-box"
						placeholder="Type your answer here..."
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && inputValue.trim()) {
								handleResponse(inputValue);
							}
						}}
					/>
					<button 
						className="next-button" 
						onClick={() => handleResponse(inputValue)}
						disabled={!inputValue.trim()}
					>
						<FaArrowRight />
					</button>
				</div>
			)}

			{currentQuestion.type === "multi-select" && (
				<div className="multi-select-container">
					{currentQuestion.options.map((option) => (
						<label key={option} className="multi-select-option">
							<input
								type="checkbox"
								checked={selectedOptions.includes(option)}
								onChange={() => handleMultiSelect(option)}
							/>
							{option}
						</label>
					))}
					<button 
						className="next-button"
						onClick={submitMultiSelect}
						disabled={selectedOptions.length === 0}
					>
						<FaArrowRight />
					</button>
				</div>
			)}

			{currentQuestion.type === "dropdown" && (
	<div className="dropdown-container">
		<div className="dropdown-wrapper">
			<select
				className="dropdown"
				value={dropdownValue}
				onChange={(e) => setDropdownValue(e.target.value)}
			>
				<option value="">Select an option</option>
				{dropdownOptions.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>

			{dropdownValue && dropdownValue !== "Other" && (
				<button
					className="next-button"
					onClick={() => handleResponse(dropdownValue)}
				>
					<FaArrowRight />
				</button>
			)}
		</div>

		{dropdownValue === "Other" && (
			<div className="input-container">
				<input
					type="text"
					className="input-box"
					placeholder="Specify your answer..."
					value={otherInput}
					onChange={(e) => setOtherInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && otherInput.trim()) {
							handleResponse(otherInput);
						}
					}}
				/>
				<button
					className="next-button"
					onClick={() => handleResponse(otherInput)}
					disabled={!otherInput.trim()}
				>
					<FaArrowRight />
				</button>
			</div>
		)}
		</div>
		)}
	</div>
	</div>
	);
}

export default Profile;
