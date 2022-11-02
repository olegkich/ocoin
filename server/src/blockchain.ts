import { Block } from "./block";
import * as CryptoJS from "crypto-js";

import chalk from "chalk";
import { getAccumulatedDifficulty, getDifficulty } from "./pow";
import { hexToBinary } from "./util";

const genesisBlock = new Block(
	0,
	"816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7",
	"",
	1465154705,
	"genesis block",
	1,
	0
);

let blockchain: Block[] = [genesisBlock];

const getLatestBlock = () => blockchain[blockchain.length - 1];

const getBlockchain = () => blockchain;

const getCurrentTimestamp = () => Math.round(new Date().getTime() / 1000);

const genHash = (
	index: number,
	previousHash: string,
	timestamp: number,
	data: string,
	nonce: number
) =>
	CryptoJS.SHA256(index + previousHash + timestamp + data + nonce)
		.toString()
		.toUpperCase();

const hashMatchesDifficulty = (hash: string, difficulty: number) => {
	const binaryHash = hexToBinary(hash);
	const prefix = "0".repeat(difficulty);

	return binaryHash!.startsWith(prefix);
};

export const isBlockTypeValid = (block: Block) => {
	return (
		typeof block.index === "number" &&
		typeof block.hash === "string" &&
		typeof block.previousHash === "string" &&
		typeof block.timestamp === "number" &&
		typeof block.data === "string"
	);
};

const isBlockValid = (block: Block, prevBlock: Block) => {
	if (!isBlockTypeValid) {
		console.log(chalk.red(">>>Block validation Error: Invalid structure"));
		return false;
	}

	if (block.index !== prevBlock.index + 1) {
		console.log(
			chalk.red(
				`>>>Block validation Error:\ninvalid index -> prevBlockIndex: ${prevBlock.index} --- newBlockIndex: ${block.index}`
			)
		);
		return false;
	}
	if (block.previousHash !== prevBlock.hash) {
		console.log(
			chalk.red(
				`>>>Block validation Error:\nhashes do not match -> prevBlockHash: ${prevBlock.hash} --- newBlockPrevHash: ${block.previousHash}`
			)
		);
		return false;
	}

	if (!isValidTimestamp(block, prevBlock)) {
		console.log(
			chalk.red(`>>>Block validation Error:\n invalid timestamp`)
		);
		return false;
	}
	const hashForBlock = genHash(
		block.index,
		block.previousHash,
		block.timestamp,
		block.data,
		block.nonce
	);

	if (block.hash !== hashForBlock) {
		console.log(
			chalk.red(
				`>>>Block validation Error: invalid hash -> newBlockHash: ${block.hash} --- generatedHash: ${hashForBlock}`
			)
		);
		return false;
	}

	return true;
};

const isBlockChainValid = (chainToValidate: Block[]) => {
	const isGenesisBlockValid = () => {
		return (
			JSON.stringify(chainToValidate[0]) === JSON.stringify(genesisBlock)
		);
	};

	if (!isGenesisBlockValid) {
		console.log(
			chalk.red(`>>>Blockchain Validation Error: invalid genesis block`)
		);
		return false;
	}

	for (let i = 1; i < chainToValidate.length; i++) {
		if (!isBlockValid(chainToValidate[i], chainToValidate[i - 1])) {
			console.log(
				chalk.red(
					`>>>Blockchain Validation Error: invalid block in the chain`
				)
			);
			return false;
		}
	}

	return true;
};

const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
	return (
		previousBlock.timestamp - 60 < newBlock.timestamp &&
		newBlock.timestamp - 60 < getCurrentTimestamp()
	);
};

const findBlock = (
	index: number,
	previousHash: string,
	timestamp: number,
	data: string
) => {
	let nonce = 1;

	console.log(chalk.black(">>>blockchain: mining...\n"));

	const difficulty = getDifficulty(getBlockchain());
	while (true) {
		const hash = genHash(index, previousHash, timestamp, data, nonce);
		if (hashMatchesDifficulty(hash, difficulty)) {
			return new Block(
				index,
				hash,
				previousHash,
				timestamp,
				data,
				difficulty,
				nonce
			);
		}
		nonce++;
	}
};

const addBlockToChain = (block: Block): boolean => {
	if (isBlockValid(block, blockchain[blockchain.length - 1])) {
		blockchain.push(block);
		return true;
	}
	return false;
};

const generateNewBlock = (data: string) => {
	const previousBlock = blockchain[blockchain.length - 1];
	const index = previousBlock.index + 1;
	const timestamp = getCurrentTimestamp();

	const newBlock = findBlock(index, previousBlock.hash, timestamp, data);
	addBlockToChain(newBlock);

	return newBlock;
};

const replaceChain = (newChain: Block[]) => {
	console.log(chalk.yellow(">>> Replacing Blockchain: validating..."));
	if (
		getAccumulatedDifficulty(newChain) >
			getAccumulatedDifficulty(getBlockchain()) &&
		newChain.length > blockchain.length &&
		isBlockChainValid(newChain)
	) {
		console.log(
			chalk.green(
				">>> Replacing Blockchain: recieved chain is valid. Replacing..."
			)
		);
		blockchain = newChain;
		return true;
	}
	console.log(
		chalk.red(
			">>> Replacing Blockchain: recieved chain is invalid. Replacing Aborted."
		)
	);
	return false;
};

export {
	getLatestBlock,
	getBlockchain,
	addBlockToChain,
	replaceChain,
	generateNewBlock,
};
