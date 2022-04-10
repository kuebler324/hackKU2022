'use strict';
function $(a, b) {
	return typeof b === 'number' ? document.querySelectorAll(a)[b] : document.querySelectorAll(a);
}
function rng(a) {
	return Math.floor(Math.random() * (a + 1));
}
class Sound {
	static context = null;
	static data = {};
	static loadSounds(obj) {
		for(const name in obj) {
			Sound.load(name, obj[name]);
		}
	}
	static load(name, url) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = () => {
			if(xhr.status === 200) {
				Sound.data[name] = new Sound(xhr.response);
			}
			else {
				console.warn('Could not load sound: ' + name, xhr.status);
			}
		};
		xhr.send();
	}
	static init() {
		if(Sound.context === null) {
			try {
				Window.AudioContext = window.AudioContext || window.webkitAudioContext;
				Sound.context = new AudioContext();
				for(const name in Sound.data) {
					Sound.data[name].tryDecodeBuffer();
				}
			}
			catch(err) {
				console.warn('Web Audio API is not supported in this browser', err);
			}
		}
	}
	static play(name, gain) {
		const sound = Sound.data[name];
		if(sound instanceof Sound && sound.ready) {
			const source = Sound.context.createBufferSource();
			source.buffer = sound.buffer;
			source.connect(Sound.context.destination);
			const gainNode = Sound.context.createGain();
			source.connect(gainNode);
			gainNode.connect(Sound.context.destination);
			gainNode.gain.setValueAtTime(gain, Sound.context.currentTime);
			source.start(0);
			sound.tsLastPlayed = client.tsCurrentFrame;
		}
	}
	constructor(xhrResponse) {
		this.buffer = xhrResponse;
		this.decode = false;
		this.ready = false;
		this.tsLastPlayed = -Infinity;
		this.tryDecodeBuffer();
	}
	tryDecodeBuffer() {
		if(!this.decode && Sound.context !== null) {
			this.decode = true;
			Sound.context.decodeAudioData(this.buffer, buffer => {
				this.buffer = buffer;
				this.ready = true;
			});
		}
	}
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
		return new XY(index % this.xSize, Math.floor(index / this.xSize));
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
	static TYPE_GREEN = 3;
	static random(type, value) {
		const options = [];
		game.blockMap.loopAll((x, y) => {
			if(game.blockMap.get(x, y) === 0) {
				options.push(new XY(x, y));
			}
		});
		if(options.length !== 0) {
			const position = options[rng(options.length - 1)];
			new Block(position.x, position.y, type, value);
		}
	}
	static moveLeft(check) {
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
		if(check) {
			Block.checkForInstruction();
		}
	}
	static moveRight(check) {
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
		if(check) {
			Block.checkForInstruction();
		}
	}
	static moveUp(check) {
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
		if(check) {
			Block.checkForInstruction();
		}
	}
	static moveDown(check) {
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
		if(check) {
			Block.checkForInstruction();
		}
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
				for(const id in game.blocks) {
					const block = game.blocks[id];
					if(block.y === y) {
						block.type = Block.TYPE_GREEN;
					}
					else {
						block.y = Math.floor(render.height / render.blockSize);
					}
				}
				game.win();
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
				for(const id in game.blocks) {
					const block = game.blocks[id];
					if(block.x === x) {
						block.type = Block.TYPE_GREEN;
					}
					else {
						block.y = Math.floor(render.height / render.blockSize);
					}
				}
				game.win();
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
		this.xDraw = x * render.blockSize;
		this.yDraw = render.height * (1 + rng(9));
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
		this.xDraw += (this.x * render.blockSize - this.xDraw) * 10 * dt;
		this.yDraw += (this.y * render.blockSize - this.yDraw) * 10 * dt;
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
class TitleScreenBlock extends XY {
	static data = [];
	constructor() {
		const theta = rng(359) * Math.PI / 180;
		super(input.mouse.x + 2 * render.width * Math.cos(theta), input.mouse.y + 2 * render.height * Math.sin(theta));
		this.theta = theta;
		this.type = rng(4) !== 0 ? 0 : (rng(2) === 0 ? 2 : 1);
		this.value = this.type === 0 ? rng(1) : '';
		TitleScreenBlock.data.push(this);
	}
}
const game = {
	won: false,
	hint: 0,
	instruction: null,
	size: 0,
	blockMap: null,
	blocks: null,
	init: gameSize => {
		game.size = gameSize;
		game.blockMap = new Map2D(gameSize, gameSize);
		game.blocks = {};
	},
	newInstruction: instruction => {
		$('#reset', 0).classList.add('hide');
		game.hint = 0;
		$('#hint', 0).classList.remove('data-0');
		$('#hint', 0).classList.remove('data-1');
		game.won = false;
		game.instruction = instruction === undefined ? rng((1 << game.size) - 1) : instruction;
		$('#instruction', 0).innerText = 'Make ' + game.instruction;
		Block.destroyAll();
		for(let i = 0; i < game.blockMap.data.length; ++i) {
			game.blockMap.data[i] = 0;
		}
		const options = [];
		game.blockMap.loopAll((x, y) => {
			if(!((x === 0 ^ x === game.blockMap.xSize - 1) && (y === 0 ^ y === game.blockMap.ySize - 1))) {
				options.push(game.blockMap.index(x, y));
			}
		});
		// place orange blocks
		for(let i = 0; i < 2; ++i) {
			if(options.length === 0) {
				break;
			}
			const position = game.blockMap.reverseIndex(options[rng(options.length - 1)]);
			new Block(position.x, position.y, Block.TYPE_ORANGE, '');
			game.blockMap.loop(position.x - 1, position.y - 1, position.x + 2, position.y + 2, (x, y) => {
				const index = options.indexOf(game.blockMap.index(x, y));
				if(index !== -1) {
					options.splice(index, 1);
				}
			});
			for(let i = 0; i < game.blockMap.xSize; ++i) {
				let index = options.indexOf(game.blockMap.index(i, position.y));
				if(index !== -1) {
					options.splice(index, 1);
				}
				index = options.indexOf(game.blockMap.index(position.x, i));
				if(index !== -1) {
					options.splice(index, 1);
				}
			}
		}
		// place solution
		const horizontalSolutionOptions = [];
		for(let y = 0; y < game.blockMap.ySize; ++y) {
			let add = true;
			for(const id in game.blocks) {
				if(game.blocks[id].y === y) {
					add = false;
					break;
				}
			}
			if(add) {
				horizontalSolutionOptions.push(y);
			}
		}
		const verticalSolutionOptions = [];
		for(let x = 0; x < game.blockMap.xSize; ++x) {
			let add = true;
			for(const id in game.blocks) {
				if(game.blocks[id].x === x) {
					add = false;
					break;
				}
			}
			if(add) {
				verticalSolutionOptions.push(x);
			}
		}
		let solution = game.instruction.toString(2);
		while(solution.length !== game.size) {
			solution = '0' + solution;
		}
		const useHorizontal = rng(1) === 1;
		if(useHorizontal) {
			const y = horizontalSolutionOptions[rng(horizontalSolutionOptions.length - 1)];
			for(let x = 0; x < game.blockMap.xSize; ++x) {
				new Block(x, y, Block.TYPE_BLUE, solution.charAt(x));
			}
		}
		else {
			const x = verticalSolutionOptions[rng(verticalSolutionOptions.length - 1)];
			for(let y = 0; y < game.blockMap.ySize; ++y) {
				new Block(x, y, Block.TYPE_BLUE, solution.charAt(y));
			}
		}
		Block.random(Block.TYPE_WHITE, '');
		for(let i = 0; i < solution.length; ++i) {
			Block.random(Block.TYPE_BLUE, solution.charAt(i) === '1' ? 0 : 1);
		}
		const count1s = solution.split('1').length - 1;
		Block.random(Block.TYPE_BLUE, count1s === 2 ? rng(1) : (count1s > 2 ? '1' : '0'));
		const scramble = 40 + rng(60);
		for(let i = 0; i < scramble; ++i) {
			switch(rng(3)) {
				case 0:
					Block.moveUp(false);
				break;
				case 1:
					Block.moveDown(false);
				break;
				case 2:
					Block.moveLeft(false);
				break;
				case 3:
					Block.moveRight(false);
				break;
			}
		}
	},
	getHint: () => {
		$('#hint', 0).classList.remove('data-0');
		$('#hint', 0).classList.remove('data-1');
		let solution = game.instruction.toString(2);
		while(solution.length !== game.size) {
			solution = '0' + solution;
		}
		if(++game.hint === 1) {
			$('#hint', 0).classList.add('data-1');
			let text = '';
			for(let i = 0; i < solution.length; ++i) {
				text += solution.charAt(i) == '1' ? '2<sup>' + (solution.length - 1 - i) + '</sup> + ' : '0 + ';
			}
			$('#instruction', 0).innerHTML = 'Make ' + text.slice(0, text.length - 2);
		}
		else {
			$('#hint', 0).classList.add('data-0');
			$('#instruction', 0).innerText = 'Make ' + solution;
		}
	},
	win: () => {
		game.won = true;
		$('#reset', 0).classList.remove('hide');
		Sound.play('victory', 5);
	}
},
input = {
	map: null,
	mouse: new XY(0, 0),
	init: keys => {
		input.map = {};
		for(let i = 0; i < keys.length; ++i) {
			input.map[keys[i]] = 0;
		}
		window.addEventListener('keydown', input.keyEvent);
		window.addEventListener('keyup', input.keyEvent);
		window.addEventListener('mousemove', e => {
			input.mouse.x = e.pageX;
			input.mouse.y = e.pageY;
		});
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
		game.blockMap.loopAll((x, y) => {
			const id = game.blockMap.get(x, y);
			if(id !== 0) {
				const block = game.blocks[id];
				render.drawBlock(block.xDraw - render.x, block.yDraw - render.y, render.blockSize, block.type, block.value)
			}
		});
	},
	drawBlock: (x, y, size, colorIndex, value) => {
		render.ctx.font = Math.floor(size / 3) + 'px sans-serif';
		render.ctx.textBaseline = 'middle';
		render.ctx.textAlign = 'center';
		render.ctx.fillStyle = ['#06c', '#f63', '#c3c3c3', '#3f6'][colorIndex];
		render.ctx.fillRect(x, y, size, size);
		render.ctx.fillStyle = '#efefef';
		render.ctx.fillText(value, x + 0.5 * size, y + 0.5 * size);
	}
},
client = {
	requestAnimationFrameID: -1,
	_fps: 60,
	tsFpsInterval: 1000 / 60,
	tsCurrentFrame: 0,
	tsLastFrame: 0,
	titleScreen: true,
	init: () => {
		input.init(['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Enter']);
		game.init(4);
		render.init();
		Sound.loadSounds({
			'music': 'sounds/music.m4a',
			'victory': 'sounds/victory.mp3',
			'move': 'sounds/move.mp3'
		});
		client.start();
	},
	play: () => {
		client.titleScreen = false;
		Sound.init();
		$('#overlay', 0).classList.remove('hide');
		$('#titlescreen', 0).classList.add('hide');
		game.newInstruction();
	},
	start: () => {
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
			if(client.titleScreen) {
				if(input.check('Enter')) {
					client.play();
				}
				if(rng(Math.floor(dt * 500)) === 0) {
					new TitleScreenBlock();
				}
				render.ctx.clearRect(0, 0, render.width, render.height);
				for(let i = 0; i < TitleScreenBlock.data.length; ++i) {
					const block = TitleScreenBlock.data[i];
					if(((block.x - render.width / 2) ** 2) + ((block.y - render.height / 2) ** 2) > 5000000) {
						TitleScreenBlock.data.splice(i--, 1);
						continue;
					}
					block.x -= 300 * dt * Math.cos(block.theta);
					block.y -= 300 * dt * Math.sin(block.theta);
					render.drawBlock(block.x - render.x, block.y - render.y, 64, block.type, block.value);
				}
			}
			else {
				if(Sound.data['music'].tsLastPlayed + 17450 < client.tsCurrentFrame) {
					Sound.play('music', -0.75);
				}
				if(game.won) {
					if(input.check('Enter')) {
						game.newInstruction();
					}
				}
				else {
					if(input.check('w') || input.check('ArrowUp')) {
						Block.moveUp(true);
						Sound.play('move', -0.5);
					}
					if(input.check('s') || input.check('ArrowDown')) {
						Block.moveDown(true);
						Sound.play('move', -0.5);
					}
					if(input.check('a') || input.check('ArrowLeft')) {
						Block.moveLeft(true);
						Sound.play('move', -0.5);
					}
					if(input.check('d') || input.check('ArrowRight')) {
						Block.moveRight(true);
						Sound.play('move', -0.5);
					}
				}
				for(const id in game.blocks) {
					game.blocks[id].animate(dt);
				}
				render.drawAll(dt);
			}
		}
		client.requestAnimationFrameID = window.requestAnimationFrame(client.gameLoop);
	}
};
window.onload = client.init;