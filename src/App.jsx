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
	const [isLoading, setIsLoading] = useState(false);
	const [delay, setDelay] = useState(0);

	const x = useMotionValue(0);
	const rotation = useTransform(x, [-300, 0, 300], [-15, 0, 15]);

	const cardClassName = delay > 0 ? 'mainCard no-pointer-events' : 'mainCard';

	const audioLogo = (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='24'
			height='24'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			className='feather feather-volume-2'
		>
			<path d='M11 5L6 9H2v6h4l5 4V5z'></path>
			<path d='M15.54 8.46a5 5 0 0 1 0 7.07'></path>
		</svg>
	);

	const getNewWord = async () => {
		setIsLoading(true);
		setCurrentDefinition(null);
		setDelay(1000);
		const word = randomWords(1);
		setCurrentWord(word);

		const response = await fetch(
			`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
		);
		const data = await response.json();

		if (!data.length) {
			setIsLoading(false);
			getNewWord();
			return;
		}

		setCurrentDefinition(data[0]);
		setIsLoading(false);
	};

	useEffect(() => {
		getNewWord();
	}, []);

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
				getNewWord();
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
		maxHeight: '80vh',
		maxWidth: '95vw',
	};

	const dragConstraints =
		delay > 0
			? { top: 0, right: 0, bottom: 0, left: 0 }
			: { top: 0, right: 0, bottom: 0, left: 0 };

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

	const onContextMenu = (event) => {
		event.preventDefault();
	};

	const onAudioButtonClick = (event) => {
		event.stopPropagation();
		document.getElementById('audioPronunciation').play();
	};

	return (
		<div className='app-container' onContextMenu={onContextMenu}>
			<h1 className='app-title'>SwipeLingo</h1>
			<div className='card-container'>
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
								<div className='card-header'>
									<h1 className='current-word'>{currentWord}</h1>
									{(currentDefinition.phonetics?.[1]?.audio ||
										currentDefinition.phonetics?.[0]?.audio) && (
										<div>
											<audio
												src={
													currentDefinition.phonetics?.[1]?.audio ||
													currentDefinition.phonetics?.[0]?.audio
												}
												id='audioPronunciation'
											/>
											<button onClick={onAudioButtonClick}>{audioLogo}</button>
										</div>
									)}
								</div>
								{DefineList}
							</>
						) : (
							<p>No definition found</p>
						)}
					</motion.div>
				)}
			</div>
			<div className='banner-ad-space' />
		</div>
	);
};
export default App;
