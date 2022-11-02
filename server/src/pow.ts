import { Block } from "./block";
import { getLatestBlock, getBlockchain } from "./blockchain";

// in seconds
const BLOCK_GENERATION_INTERVAL: number = 10;

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 5;

const getDifficulty = (aBlockchain: Block[]): number => {
	const latestBlock: Block = aBlockchain[getBlockchain().length - 1];
	if (
		latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
		latestBlock.index !== 0
	) {
		return getAdjustedDifficulty(latestBlock, aBlockchain);
	} else {
		return latestBlock.difficulty;
	}
};

const getAdjustedDifficulty = (latestBlock: Block, aBlockchain: Block[]) => {
	const prevAdjustmentBlock: Block =
		aBlockchain[getBlockchain().length - DIFFICULTY_ADJUSTMENT_INTERVAL];
	const timeExpected: number =
		BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
	const timeTaken: number =
		latestBlock.timestamp - prevAdjustmentBlock.timestamp;
	if (timeTaken < timeExpected / 2) {
		return prevAdjustmentBlock.difficulty + 1;
	} else if (timeTaken > timeExpected * 2) {
		return prevAdjustmentBlock.difficulty - 1;
	} else {
		return prevAdjustmentBlock.difficulty;
	}
};

const getAccumulatedDifficulty = (aBlockchain: Block[]): number => {
	return aBlockchain
		.map((block) => block.difficulty)
		.map((difficulty) => Math.pow(2, difficulty))
		.reduce((a, b) => a + b);
};

export { getDifficulty, getAccumulatedDifficulty };
