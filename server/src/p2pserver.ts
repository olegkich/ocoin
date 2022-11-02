import chalk from "chalk";
import WebSocket from "ws";
import { Block } from "./block";
import {
	addBlockToChain,
	getBlockchain,
	getLatestBlock,
	isBlockTypeValid,
	replaceChain,
} from "./blockchain";
import { P2P_PORT } from "./const";
import { JSONToObject } from "./util";

// connected sockets
const peers: Array<WebSocket> = [];

enum MessageType {
	QUERY_LATEST_BLOCK = 0,
	QUERY_BLOCKCHAIN = 1,
	QUERY_NEW_CHAIN = 2,
}

interface Message {
	type: MessageType;
	data: any;
}

const requestLatestBlock = () => ({
	type: MessageType.QUERY_LATEST_BLOCK,
	data: JSON.stringify([getLatestBlock()]),
});

const requestBlockchain = () => ({
	type: MessageType.QUERY_BLOCKCHAIN,
	data: JSON.stringify(getBlockchain()),
});

const initP2PServer = (port: number) => {
	const server = new WebSocket.Server({ port });
	console.log(chalk.blue(`:::server::: - listening p2p on port : ${port}`));
	server.on("connection", (ws) => {
		console.log(chalk.blue(":::server::: - new peer conected"));
		handleConnection(ws);
	});
};

const write = (ws: WebSocket, message: Message) => {
	ws.send(JSON.stringify(message));
};

const handleConnection = (ws: WebSocket) => {
	peers.push(ws);
	initMessageHandler(ws);
	initErrorHandler(ws);
	write(ws, { type: MessageType.QUERY_LATEST_BLOCK, data: null });
};

const broadcast = (message: Message) => {
	peers.forEach((ws) => write(ws, message));
};

const initMessageHandler = (ws: WebSocket) => {
	ws.on("message", (data: string) => {
		const message = JSONToObject<Message>(data);

		console.log(
			chalk.yellow(
				`:::server::: - processing recieved message of type ${
					(JSON.stringify(message.type), "\n")
				}`
			)
		);

		if (message === null) {
			console.log(
				chalk.red(
					":::server::: !ERROR! - could not parse recieved message."
				)
			);
			return;
		}
		switch (message.type) {
			case MessageType.QUERY_LATEST_BLOCK:
				write(ws, requestLatestBlock());
				break;
			case MessageType.QUERY_BLOCKCHAIN:
				write(ws, requestBlockchain());
				break;
			case MessageType.QUERY_NEW_CHAIN:
				const recievedChain: Block[] = JSONToObject<Block[]>(
					message.data
				)!;

				if (recievedChain === null) {
					console.log(
						chalk.red(":::server::: - invalid recieved blocks")
					);
					return;
				}

				console.log(
					chalk.yellow(
						"\n:::server::: - recieved blockchain: ",
						JSON.stringify(recievedChain),
						"\n"
					)
				);
				handleReplaceBlockchain(recievedChain);
				break;
		}
	});
};

const handleReplaceBlockchain = (newChain: Block[]) => {
	console.log(chalk.green(":::server::: - handling blockchain replacement"));
	if (newChain.length === 0) {
		console.log(
			chalk.red(":::server::: - !ERROR: recieved blockchain of size 0")
		);
		return;
	}

	if (!isBlockTypeValid) {
		console.log(
			chalk.red(":::server::: - !ERROR: invalid blockchain structure")
		);
		return;
	}

	const latestBlockRecieved = newChain[newChain.length - 1];
	const latestCurrentBlock = getLatestBlock();

	if (latestBlockRecieved.index > latestCurrentBlock.index) {
		console.log(
			chalk.yellow(
				"blockchain possibly behind. We got: " +
					latestCurrentBlock.index +
					" Peer got: " +
					latestBlockRecieved.index
			)
		);

		if (latestBlockRecieved.previousHash === latestCurrentBlock.hash) {
			addBlockToChain(latestBlockRecieved);
			broadcast(requestLatestBlock());
			console.log(
				chalk.greenBright(":::server::: - blockchain replaced. ")
			);
		} else if (newChain.length === 1) {
			console.log(
				chalk.yellow(
					":::server::: - we have to query the chain from our peer"
				)
			);
			broadcast(requestBlockchain());
		} else {
			console.log(
				chalk.blue(
					":::server::: - Received blockchain is longer than current blockchain, replacing..."
				)
			);
			replaceChain(newChain);
			console.log(
				chalk.greenBright(":::server::: - blockchain replaced.")
			);
		}
	} else {
		console.log(
			chalk.black(":::server::: - no new block, replacement aborted.")
		);
	}
};

const initErrorHandler = (ws: WebSocket) => {
	const closeConnection = (myWs: WebSocket) => {
		console.log(chalk.red("connection failed to peer: " + myWs.url));
		peers.splice(peers.indexOf(myWs), 1);
	};
	ws.on("close", () => closeConnection(ws));
	ws.on("error", () => closeConnection(ws));
};

const connectToPeers = (newPeer: string): void => {
	const ws: WebSocket = new WebSocket(newPeer);
	ws.on("open", () => {
		handleConnection(ws);
	});
	ws.on("error", () => {
		console.log(chalk.red("connection failed"));
	});
};

const getPeers = () => peers;

export { connectToPeers, getPeers, initP2PServer };
