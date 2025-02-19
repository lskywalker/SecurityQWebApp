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
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("http://localhost:5001/api/profile")
            .then((response) => setProfileQuestions(response.data))
            .catch(() => {});
    }, []);

    const handleResponse = (answer) => {
        const currentQuestion = profileQuestions[currentIndex];
    
        setResponses((prev) => {
            const updatedResponses = {
                ...prev,
                [currentQuestion.id]: answer,
            };
            return updatedResponses;
        });
    
        setInputValue("");
        setSelectedOptions([]);
    
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

    return (
        <div className="container">
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
                currentQuestion.options.map((option) => (
                    <button key={option} className="button" onClick={() => handleResponse(option)}>
                        {option}
                    </button>
                ))
            )}
        </div>
    );
}

export default Profile;
