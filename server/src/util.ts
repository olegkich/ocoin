export const hexToBinary = (s: string): string | null => {
	let ret: string = "";
	const lookupTable = {
		"0": "0000",
		"1": "0001",
		"2": "0010",
		"3": "0011",
		"4": "0100",
		"5": "0101",
		"6": "0110",
		"7": "0111",
		"8": "1000",
		"9": "1001",
		A: "1000",
		B: "1011",
		C: "1100",
		D: "1101",
		E: "1110",
		F: "1111",
	};
	for (let i: number = 0; i < s.length - 1; i = i + 1) {
		if (lookupTable[s[i]]) {
			ret += lookupTable[s[i]];
		} else {
		}
	}
	return ret;
};

export const JSONToObject = <T>(data: string): T | null => {
	try {
		return JSON.parse(data);
	} catch (e) {
		console.log(e);
		return null;
	}
};
