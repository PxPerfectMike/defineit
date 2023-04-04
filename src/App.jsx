import React, { useState, useEffect } from 'react';
import randomWords from 'random-words';
import { motion, useAnimation } from 'framer-motion';
import './App.css';

const App = () => {
	const [currentWord, setCurrentWord] = useState('');
	const [currentDefinition, setCurrentDefinition] = useState(null);
	const [phonetic, setPhonetic] = useState('');
	const [audioUrl, setAudioUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [delay, setDelay] = useState(0);

	const handleSwipe = () => {
		if (delay <= 0) {
			setCurrentDefinition(null);
			setDelay(1000);
			setCurrentWord(randomWords(1));
		}
	};

	const fetchDefinition = async () => {
		setIsLoading(true);
		const response = await fetch(
			`https://api.dictionaryapi.dev/api/v2/entries/en/${currentWord}`
		);
		const data = await response.json();
		setCurrentDefinition(data[0]);
		setPhonetic(data[0].phonetics[0].text);
		setAudioUrl(data[0].phonetics[0].audio);
		setIsLoading(false);
		console.log(audioUrl);
	};

	useEffect(() => {
		if (currentWord) {
			fetchDefinition();
		}
	}, [currentWord]);

	useEffect(() => {
		if (delay > 0) {
			const timeout = setTimeout(() => {
				setDelay(delay - 100);
			}, 100);
			return () => clearTimeout(timeout);
		}
	}, [delay]);

	const cardControls = useAnimation();

	const handleDragEnd = (event, info) => {
		const offScreenThreshold = 150;
		if (Math.abs(info.offset.x) > offScreenThreshold) {
			handleSwipe();
		} else {
			cardControls.start({
				x: 0,
				transition: { type: 'spring', stiffness: 200, damping: 30 },
			});
		}
	};

	const cardStyle = {
		position: 'relative',
		backgroundColor: 'white',
		padding: '1rem',
		margin: '1rem',
	};

	const dragConstraints = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	};

	return (
		<div>
			{isLoading ? (
				<p>Loading...</p>
			) : (
				<motion.div
					drag={delay <= 0 ? 'x' : false}
					onDragEnd={handleDragEnd}
					className='mainCard'
					style={cardStyle}
					dragConstraints={dragConstraints}
					dragElastic={0.7}
					animate={cardControls}
				>
					{currentDefinition ? (
						<>
							<h1 className='current-word'>{currentWord}</h1>
							<h2>{phonetic}</h2>
							<div>
								<h2>{currentDefinition.meanings[0].partOfSpeech}</h2>
								<p>{currentDefinition.meanings[0].definitions[0].definition}</p>
							</div>
							{audioUrl && (
								<div>
									<audio src={audioUrl} id='audioPronunciation' />
									<button
										onClick={() =>
											document.getElementById('audioPronunciation').play()
										}
									>
										Play Pronunciation
									</button>
								</div>
							)}
						</>
					) : (
						<p>No definition found</p>
					)}
				</motion.div>
			)}
			{delay > 0 && (
				<div style={{ textAlign: 'center', marginTop: '1rem' }}>
					Swipe will be enabled in {delay / 1000}s
				</div>
			)}
		</div>
	);
};
export default App;
