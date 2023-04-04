import React, { useState, useEffect } from 'react';
import randomWords from 'random-words';
import {
	motion,
	useAnimation,
	useMotionValue,
	useTransform,
} from 'framer-motion';
import './App.css';

const App = () => {
	const [currentWord, setCurrentWord] = useState('');
	const [currentDefinition, setCurrentDefinition] = useState(null);
	const [phonetic, setPhonetic] = useState('');
	const [audioUrl, setAudioUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [delay, setDelay] = useState(0);
	const [nextWord, setNextWord] = useState('');
	const [nextDefinition, setNextDefinition] = useState(null);
	const [nextPhonetic, setNextPhonetic] = useState('');
	const [nextAudioUrl, setNextAudioUrl] = useState('');

	const x = useMotionValue(0);
	const rotation = useTransform(x, [-300, 0, 300], [-15, 0, 15]);

	const cardClassName = delay > 0 ? 'mainCard no-pointer-events' : 'mainCard';

	const getNewWord = () => {
		setCurrentDefinition(null);
		setDelay(1000);
		setCurrentWord(randomWords(1));
	};

	const handleSwipe = () => {
		if (delay <= 0) {
			getNewWord();
			setDelay(1000);
		}
	};

	const fetchDefinition = async () => {
		setIsLoading(true);
		const response = await fetch(
			`https://api.dictionaryapi.dev/api/v2/entries/en/${currentWord}`
		);
		const data = await response.json();

		// Check if the data is empty, if so, get a new word
		if (!data.length) {
			handleSwipe();
			setIsLoading(false);
			return;
		}

		setCurrentDefinition(data[0]);

		if (data[0].phonetics[1]) {
			setPhonetic(data[0].phonetics[1].text);
			setAudioUrl(data[0].phonetics[1].audio);
		} else if (data[0].phonetics[0]) {
			setPhonetic(data[0].phonetics[0].text);
			setAudioUrl(data[0].phonetics[0].audio);
		} else {
			setPhonetic('');
			setAudioUrl('');
		}

		setIsLoading(false);
	};

	const fetchNextDefinition = async () => {
		const response = await fetch(
			`https://api.dictionaryapi.dev/api/v2/entries/en/${nextWord}`
		);
		const data = await response.json();
		setNextDefinition(data[0]);

		if (data[0].phonetics[1]) {
			setNextPhonetic(data[0].phonetics[1].text);
			setNextAudioUrl(data[0].phonetics[1].audio);
		} else if (data[0].phonetics[0]) {
			setNextPhonetic(data[0].phonetics[0].text);
			setNextAudioUrl(data[0].phonetics[0].audio);
		} else {
			setNextPhonetic('');
			setNextAudioUrl('');
		}
	};

	useEffect(() => {
		if (currentWord) {
			fetchDefinition();
			setNextWord(randomWords(1));
			fetchNextDefinition();
		}
	}, [currentWord]);

	useEffect(() => {
		if (currentDefinition === null && currentWord) {
			handleSwipe();
		}
	}, [currentDefinition]);

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
		if (delay <= 0) {
			const offScreenThreshold = 150;
			if (Math.abs(info.offset.x) > offScreenThreshold) {
				setCurrentWord(nextWord);
				setCurrentDefinition(nextDefinition);
				setPhonetic(nextPhonetic);
				setAudioUrl(nextAudioUrl);
				setNextWord(randomWords(1));
				fetchNextDefinition();
			} else {
				cardControls.start({
					x: 0,
					transition: { type: 'spring', stiffness: 200, damping: 30 },
				});
			}
		}
	};

	const borderColor = delay > 0 ? 'red' : '#629d50';

	const cardStyle = {
		position: 'relative',
		backgroundColor: 'white',
		padding: '1rem',
		margin: '1rem',
		border: `4px solid ${borderColor}`,
		borderRadius: '6px',
		maxHeight: '90vh',
	};

	const dragConstraints = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	};

	const transformMeanings = (meanings) => {
		const uniqueMeanings = {};
		let count = 0;

		for (const meaning of meanings) {
			if (count >= 2) break;

			if (!uniqueMeanings[meaning.partOfSpeech]) {
				uniqueMeanings[meaning.partOfSpeech] = meaning.definitions.slice(0, 2);
				count += 1;
			}
		}

		return Object.entries(uniqueMeanings).map(
			([partOfSpeech, definitions]) => ({
				partOfSpeech,
				definitions,
			})
		);
	};

	const DefineList = currentDefinition
		? transformMeanings(currentDefinition.meanings).map((meaning) => (
				<div key={meaning.partOfSpeech}>
					<h2>{meaning.partOfSpeech}</h2>
					{meaning.definitions.map((definition, index) => (
						<p key={index}>{definition.definition}</p>
					))}
				</div>
		  ))
		: null;

	return (
		<div>
			{isLoading ? (
				<p>Loading...</p>
			) : (
				<motion.div
					style={{ x, rotate: rotation, ...cardStyle, zIndex: 2 }}
					drag='x'
					onDragEnd={handleDragEnd}
					className={cardClassName}
					dragConstraints={dragConstraints}
					dragElastic={0.7}
					animate={cardControls}
				>
					{currentDefinition ? (
						<>
							<h1 className='current-word'>{currentWord}</h1>
							<h2>{phonetic}</h2>
							{DefineList}
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
		</div>
	);
};
export default App;
