'use strict';
function $(a, b) {
	return typeof b === 'number' ? document.querySelectorAll(a)[b] : document.querySelectorAll(a);
}
function rng(a) {
	return Math.floor(Math.random() * (a + 1));
}
class XY {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}
class Map2D {
	constructor(xSize, ySize) {
		this.xSize = xSize;
		this.ySize = ySize;
		this.data = new Uint32Array(xSize * ySize);
	}
	index(x, y) {
		return y * this.xSize + x;
	}
	reverseIndex(index) {
		return new XY(Math.floor(index / this.xSize), index % this.xSize);
	}
	get(x, y) {
		return this.data[this.index(x, y)];
	}
	set(x, y, value) {
		this.data[this.index(x, y)] = value;
	}
	loopAll(callback) {
		for(let i = 0; i < this.data.length; ++i) {
			callback(Math.floor(i / this.xSize), i % this.xSize);
		}
	}
	loop(xMin, yMin, xMax, yMax, callback) {
		if(xMin < 0) {
			xMin = 0;
		}
		if(yMin < 0) {
			yMin = 0;
		}
		if(xMax > this.xSize) {
			xMax = this.xSize;
		}
		if(yMax > this.ySize) {
			yMax = this.ySize;
		}
		for(let x = xMin; x < xMax; ++x) {
			for(let y = yMin; y < yMax; ++y) {
				if(callback(x, y) === false) {
					return false;
				}
			}
		}
		return true;
	}
}
class Block extends XY {
	static TYPE_BLUE = 0;
	static TYPE_ORANGE = 1;
	static TYPE_WHITE = 2;
	static random(move, value) {
		const options = [];
		game.blockMap.loopAll((x, y) => {
			if(game.blockMap.get(x, y) === 0) {
				options.push(new XY(x, y));
			}
		});
		if(options.length !== 0) {
			const position = options[rng(options.length - 1)];
			new Block(position.x, position.y, move, value);
		}
	}
	static moveLeft() {
		for(let y = 0; y < game.blockMap.ySize; ++y) {
			for(let x = 0; x < game.blockMap.xSize; ++x) {
				const id = game.blockMap.get(x, y);
				if(id !== 0) {
					const block = game.blocks[id];
					if(block.type === Block.TYPE_ORANGE) {
						continue;
					}
					let dx = x;
					while(game.blockMap.get(dx - 1, y) === 0 && dx - 1 >= 0) {
						dx -= 1;
					}
					block.moveTo(dx, y);
				}
			}
		}
		Block.checkForInstruction();
	}
	static moveRight() {
		for(let y = 0; y < game.blockMap.ySize; ++y) {
			for(let x = game.blockMap.xSize - 1; x >= 0; --x) {
				const id = game.blockMap.get(x, y);
				if(id !== 0) {
					const block = game.blocks[id];
					if(block.type === Block.TYPE_ORANGE) {
						continue;
					}
					let dx = x;
					while(game.blockMap.get(dx + 1, y) === 0 && dx + 1 < game.blockMap.xSize) {
						dx += 1;
					}
					block.moveTo(dx, y);
				}
			}
		}
		Block.checkForInstruction();
	}
	static moveUp() {
		for(let x = 0; x < game.blockMap.xSize; ++x) {
			for(let y = 0; y < game.blockMap.ySize; ++y) {
				const id = game.blockMap.get(x, y);
				if(id !== 0) {
					const block = game.blocks[id];
					if(block.type === Block.TYPE_ORANGE) {
						continue;
					}
					let dy = y;
					while(game.blockMap.get(x, dy - 1) === 0 && dy - 1 >= 0) {
						dy -= 1;
					}
					block.moveTo(x, dy);
				}
			}
		}
		Block.checkForInstruction();
	}
	static moveDown() {
		for(let x = 0; x < game.blockMap.xSize; ++x) {
			for(let y = game.blockMap.ySize - 1; y >= 0; --y) {
				const id = game.blockMap.get(x, y);
				if(id !== 0) {
					const block = game.blocks[id];
					if(block.type === Block.TYPE_ORANGE) {
						continue;
					}
					let dy = y;
					while(game.blockMap.get(x, dy + 1) === 0 && dy + 1 < game.blockMap.ySize) {
						dy += 1;
					}
					block.moveTo(x, dy);
				}
			}
		}
		Block.checkForInstruction();
	}
	static checkForInstruction() {
		let instruction = game.instruction.toString(2);
		while(instruction.length < game.size) {
			instruction = '0' + instruction;
		}
		for(let y = 0; y < game.blockMap.ySize; ++y) {
			let bin = '';
			for(let x = 0; x < game.blockMap.xSize; ++x) {
				const id = game.blockMap.get(x, y);
				if(id === 0) {
					break;
				}
				else {
					bin += game.blocks[id].value;
				}
			}
			if(bin === instruction) {
				console.log('win');
			}
		}
		for(let x = 0; x < game.blockMap.xSize; ++x) {
			let bin = '';
			for(let y = 0; y < game.blockMap.xSize; ++y) {
				const id = game.blockMap.get(x, y);
				if(id === 0) {
					break;
				}
				else {
					bin += game.blocks[id].value;
				}
			}
			if(bin === instruction) {
				console.log('win');
			}
		}
	}
	static destroyAll() {
		for(const id in game.blocks) {
			game.blocks[id].destroy();
		}
	}
	constructor(x, y, type, value) {
		super(x, y);
		this.xDraw = x;
		this.yDraw = y;
		this.type = type;
		this.value = value;
		do {
			this.id = rng(999999) + 1;
		}
		while(game.blocks[this.id] !== undefined);
		game.blocks[this.id] = this;
		game.blockMap.set(x, y, this.id);
	}
	animate(dt) {
		this.xDraw += (this.x - this.xDraw) * 10 * dt;
		this.yDraw += (this.y - this.yDraw) * 10 * dt;
	}
	moveTo(x, y) {
		game.blockMap.set(this.x, this.y, 0);
		this.x = x;
		this.y = y;
		game.blockMap.set(x, y, this.id);
	}
	destroy() {
		game.blockMap.set(this.x, this.y, 0);
		delete game.blocks[this.id];
	}
}
const game = {
	instruction: null,
	size: 0,
	blockMap: null,
	blocks: null,
	init: gameSize => {
		game.size = gameSize;
		game.blockMap = new Map2D(gameSize, gameSize);
		game.blocks = {};
		for(let y = 0; y < gameSize; y += 2) {
			new Block(rng(gameSize - 1), y, Block.TYPE_ORANGE, '');
		}
		Block.random(Block.TYPE_WHITE, '');
		for(let i = 0; i < 12; ++i) {
			Block.random(Block.TYPE_BLUE, i % 2);
		}
		game.newInstruction();
	},
	newInstruction: () => {
		game.instruction = rng((1 << game.size) - 1);
		$('#instruction', 0).innerText = 'Make ' + game.instruction;
	}
},
input = {
	map: null,
	init: keys => {
		input.map = {};
		for(let i = 0; i < keys.length; ++i) {
			input.map[keys[i]] = 0;
		}
		window.addEventListener('keydown', input.keyEvent);
		window.addEventListener('keyup', input.keyEvent);
	},
	check: key => {
		const mapValue = input.map[key];
		if(mapValue === 1) {
			input.map[key] = 2;
			return true;
		}
		return false;
	},
	keyEvent: e => {
		const mapValue = input.map[e.key];
		if(mapValue !== undefined) {
			if(e.type === 'keydown') {
				if(mapValue === 0) {
					input.map[e.key] = 1;
				}
			}
			else {
				input.map[e.key] = 0;
			}
		}
	}
},
render = {
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	blockSize: 128,
	canvas: null,
	ctx: null,
	init: () => {
		render.canvas = $('#display', 0);
		render.ctx = render.canvas.getContext('2d');
		render.resize();
		window.addEventListener('resize', render.resize);
	},
	resize: () => {
		render.width = window.innerWidth;
		render.height = window.innerHeight;
		render.canvas.width = render.width;
		render.canvas.height = render.height;
		render.x = (game.blockMap.xSize * render.blockSize - render.width) / 2;
		render.y = (game.blockMap.ySize * render.blockSize - render.height) / 2;
	},
	drawAll: () => {
		render.ctx.clearRect(0, 0, render.width, render.height);
		render.ctx.strokeStyle = '#fff';
		render.ctx.lineWidth = 2;
		render.ctx.strokeRect(-2 - render.x, -2 - render.y, game.blockMap.xSize * render.blockSize + 4, game.blockMap.ySize * render.blockSize + 4);
		render.ctx.font = '48px sans-serif';
		render.ctx.textBaseline = 'middle';
		render.ctx.textAlign = 'center';
		game.blockMap.loopAll((x, y) => {
			const id = game.blockMap.get(x, y);
			if(id !== 0) {
				const block = game.blocks[id];
				render.ctx.fillStyle = ['#06c', '#f63', '#c3c3c3'][block.type];
				render.ctx.fillRect(block.xDraw * render.blockSize - render.x, block.yDraw * render.blockSize - render.y, render.blockSize, render.blockSize);
				render.ctx.fillStyle = '#efefef';
				render.ctx.fillText(block.value, (block.xDraw + 0.5) * render.blockSize - render.x, (block.yDraw + 0.5) * render.blockSize - render.y);
			}
		});
	}
},
client = {
	requestAnimationFrameID: -1,
	_fps: 60,
	tsFpsInterval: 1000 / 60,
	tsCurrentFrame: 0,
	tsLastFrame: 0,
	init: () => {
		input.init(['w', 'a', 's', 'd']);
		client.start();
	},
	start: () => {
		game.init(5);
		render.init();
		client.requestAnimationFrameID = window.requestAnimationFrame(client.gameLoop);
	},
	stop: () => {
		window.cancelAnimationFrame(client.requestAnimationFrameID);
	},
	gameLoop: ts => {
		client.tsCurrentFrame = ts;
		const tsElapsed = ts - client.tsLastFrame;
		if(tsElapsed > client.tsFpsInterval) {
			client.tsLastFrame = ts - (tsElapsed % client.tsFpsInterval);
			const dt = Math.min(tsElapsed * 0.001, 0.05);
			if(input.check('w')) {
				Block.moveUp();
			}
			if(input.check('s')) {
				Block.moveDown();
			}
			if(input.check('a')) {
				Block.moveLeft();
			}
			if(input.check('d')) {
				Block.moveRight();
			}
			for(const id in game.blocks) {
				game.blocks[id].animate(dt);
			}
			render.drawAll(dt);
		}
		client.requestAnimationFrameID = window.requestAnimationFrame(client.gameLoop);
	}
};
window.onload = client.init;