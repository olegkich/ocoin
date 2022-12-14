import { generateNewBlock, getBlockchain } from "./blockchain";
import { connectToPeers, getPeers, initP2PServer } from "./p2pserver";
import { Block } from "./block";
import express from "express";
import { HTTP_PORT, P2P_PORT } from "./const";
import chalk from "chalk";

const initHttpServer = (myHttpPort: number) => {
	const app = express();
	app.use(express.json());

	app.get("/blocks", (req, res) => {
		res.send(getBlockchain());
	});
	app.post("/mineBlock", (req, res) => {
		const newBlock: Block = generateNewBlock(req.body.data);

		res.send(newBlock);
	});
	app.get("/peers", (req, res) => {
		res.send(
			getPeers().map(
				(s: any) => s._socket.remoteAddress + ":" + s._socket.remotePort
			)
		);
	});
	app.post("/addPeer", (req, res) => {
		connectToPeers(req.body.peer);

		res.send();
	});

	app.listen(myHttpPort, () => {
		console.log(
			chalk.blue(
				":::server::: - listening http on port: " + myHttpPort,
				"\n"
			)
		);
	});
};

initHttpServer(HTTP_PORT);
initP2PServer(P2P_PORT);
