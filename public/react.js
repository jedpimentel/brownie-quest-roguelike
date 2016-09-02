'use strict';

/**
* raw map data is meant to be represented as characters.
* 
* STAT DEFINITION
* speed: in battle, used to calculate if either player or enemy hits first (not used)
* vitality: max health, though might be better off not using health caps
* offense: more offense means each hit given is more effective
* defense: more defense means each hit recieved removes smaller chunks of your health (use player level)
* 
* map generation rules:
* 	must be bordered by walls
*
* ENEMIES
* Normal enemies don't really have health.
* Instead, on each attack a chance roll is made, if it passes they die. 
* This system will make enemies seem to have different amounts of health.
* Enemy "strength" will depend solely on their level
* The final boss does have health.
*
* LEVELS
* You start at level 1, killing an enemy increases your level by one
* Each level affects probaility rolls one percent in your favor
*
* Weapons
* One weapon upgrade per level, each upgrade increases probabilities ten percen in your favor
* 
* The game is only really "hard" if you don't play perfectly. 
* To play "perfectly" you need to pick up all the health/weapon bonuses before attacking the enemies.
* 
*
*/

// these bindings are not currently used

var _gameImg;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var keyboardBindings = {
	moveLeft: 37,
	moveUp: 38,
	moveRight: 39,
	moveDown: 40
};

// legend entries must be single characters
var mapLegend = {
	wall: 'w',
	fence: '◙',
	space: ' ',
	player: 'p',
	enemy: 'e',
	potion: '♥',
	weapon: '#',
	portal: '↨',
	boss: '☼'
};
var gameImg = (_gameImg = {}, _defineProperty(_gameImg, mapLegend.weapon, "img/sword-hi.png"), _defineProperty(_gameImg, mapLegend.potion, "img/potion-hi.png"), _defineProperty(_gameImg, mapLegend.player, "img/player-hi.png"), _defineProperty(_gameImg, mapLegend.enemy, "img/enemy-hi.png"), _defineProperty(_gameImg, mapLegend.boss, "img/boss-hi.png"), _defineProperty(_gameImg, mapLegend.portal, "img/door-hi.png"), _gameImg);
// this is meant to be set to "true" for codepen hosting
if (true) {
	var _gameImg2;

	gameImg = (_gameImg2 = {}, _defineProperty(_gameImg2, mapLegend.weapon, "https://www.dropbox.com/s/2cecxxjlokco3yp/sword-hi.png?dl=1"), _defineProperty(_gameImg2, mapLegend.potion, "https://www.dropbox.com/s/woy9svdovsf07p8/potion-hi.png?dl=1"), _defineProperty(_gameImg2, mapLegend.player, "https://www.dropbox.com/s/uoli1a57tbfc44d/player-hi.png?dl=1"), _defineProperty(_gameImg2, mapLegend.enemy, "https://www.dropbox.com/s/4tv0yxsadgza5gh/enemy-hi.png?dl=1"), _defineProperty(_gameImg2, mapLegend.boss, "https://www.dropbox.com/s/bxdm9iiqu4fuef6/boss-hi.png?dl=1"), _defineProperty(_gameImg2, mapLegend.portal, "https://www.dropbox.com/s/7gzgkly6lh07kyn/door-hi.png?dl=1"), _gameImg2);
}
var gameDefaults = {
	mapHeight: 20,
	mapWidth: 20,
	gameLevels: 5,
	simpleMode: false, /* small map, no walls */
	playerStartingHealth: 100,
	playerMaxHealth: 150,
	enemiesPerLevel: 5,
	enemyHealth: 100,
	bossHealth: 300,
	medianEnemyDamage: 10,
	playerBaseDamage: 50,
	potionsPerLevel: 2,
	medianPotionHealth: 50,
	expPerPlayerLevel: 100,
	medianExpPerKill: 100 / 5
};
if (gameDefaults.simpleMode) {
	var simpleModeSize = 10;
	gameDefaults.mapHeight = simpleModeSize;
	gameDefaults.mapWidth = simpleModeSize;
}

function generateMap(level, playerStartPos) {

	var height = gameDefaults.mapHeight;
	var width = gameDefaults.mapWidth;
	var level = level || 1; /* not used, maybe only needs to be checked in order to spawn the boss */
	var playerStartPos = playerStartPos || Math.floor(Math.random() * height * width);
	var enemies = gameDefaults.enemiesPerLevel;
	var newMap = new Array();
	// simpleMode is used to debug the difficulty curve
	if (gameDefaults.simpleMode === true) {
		// TODO: something to deactivate the walls and make room small
	}
	for (var i = 0; i < height * width; i++) {
		if (i < width || i % width === 0 || i % width === width - 1 || i > width * (height - 1)) {
			// edge of map
			newMap.push(mapLegend.wall);
		} else {
			newMap.push(mapLegend.space);
		}
	}
	// unoptimized, returns valid index containing entry
	function randomCellOf(legendEntry) {
		var validCells = findAllIndexes(newMap, legendEntry);
		if (validCells.length < 1) {
			return -1;
		}
		var randomNumber = Math.floor(Math.random() * validCells.length);
		return validCells[randomNumber];
	}

	// not 100% sure if this works as expected
	// takes 1d map posision and offset direction, returns the offsetted position
	function cellPlusVector(originCell, xVector, yVector) {
		var originalX = originCell % width;
		var originalY = Math.floor(originCell / width);
		var newX = originalX + xVector;
		var newY = originalY + yVector;
		if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
			return false;
		}
		var newCell = newX + newY * width;
		return newCell;
	}

	/*  R O O M   G E N E R A T O R
 *
 *
 */

	// TODO something to avoid having room seeds spawn next to each other or on the edges


	var numberOfRooms = 5;
	var roomArr = new Array();
	while (numberOfRooms--) {
		var newRoom = new Object();
		newRoom.position = randomCellOf(mapLegend.space);
		if (numberOfRooms === 0) {
			newRoom.position = playerStartPos;
		}
		// the directions are how many cells the room extend out from their origin
		newRoom.up = 0;
		newRoom.right = 0;
		newRoom.down = 0;
		newRoom.left = 0;
		newRoom.validDirections = ['up', 'right', 'down', 'left'];
		if (newRoom.position === -1) {
			break;
		}
		roomArr.push(newRoom);

		// DEBUG: this is a debug line to see the room centers
		//newMap[newRoom.position] = roomArr.length + 1;

		// TODO: place walls around the newly generated room seed (newRoom.position)
		// in order to avoid two seeds being placed next to each other
		// OR, use a better seeding algorithm
	}

	roomArr.map(function (cell) {
		// TODO: convert generator from generating wall blocks to generating space blocks
		// TODO: after prev line is implemented, convert everything into walls
		return;
	});

	var iteration = 0;
	while (roomArr.length > 0) {
		for (var i = 0; i < roomArr.length; i++) {
			var thisRoom = roomArr[i];
			var validDirections = thisRoom.validDirections;
			if (validDirections.length <= 0) {
				//console.log(roomArr);
				roomArr.splice(i, 1);
				continue;
			}
			var randomDirectionIndex = Math.floor(Math.random() * validDirections.length);
			var randomDirection = validDirections[randomDirectionIndex];
			// (x, y) vector of room's new cell/row
			var x, y;
			if (randomDirection === 'up') {
				thisRoom.up++;
				x = 0;
				y = -thisRoom.up;
			} else if (randomDirection === 'right') {
				thisRoom.right++;
				x = +thisRoom.right;
				y = 0;
			} else if (randomDirection === 'down') {
				thisRoom.down++;
				x = 0;
				y = +thisRoom.down;
			} else if (randomDirection === 'left') {
				thisRoom.left++;
				x = -thisRoom.left;
				y = 0;
			}
			// tangent relative to rooms' seed cell. Seed plus (x,y) displacement
			var tangentCell = cellPlusVector(thisRoom.position, x, y);

			// new version
			var lineStart, lineEnd, cellGap;

			// line of new cells is horizontal
			if (randomDirection === 'up' || randomDirection === 'down') {
				lineStart = cellPlusVector(tangentCell, -thisRoom.left, 0);
				lineEnd = cellPlusVector(tangentCell, +thisRoom.right, 0);
				cellGap = 1;
			}
			// line of new cells is vertical
			else if (randomDirection === 'right' || randomDirection === 'left') {
					lineStart = cellPlusVector(tangentCell, 0, -thisRoom.up);
					lineEnd = cellPlusVector(tangentCell, 0, +thisRoom.down);
					cellGap = cellPlusVector(0, 0, 1);
				}
			//console.log(lineStart, lineEnd, cellGap, randomDirection);

			// array of new cells to be added to the room, they are a line
			var newRoomCellPositions = new Array();

			var selectionIsValid = true;
			for (var j = lineStart; j <= lineEnd; j += cellGap) {
				newRoomCellPositions.push(j);
				if (newMap[j] === mapLegend.wall) {
					selectionIsValid = false;
				}
			}

			if (selectionIsValid) {
				newRoomCellPositions.map(function (cellIndex) {
					newMap[cellIndex] = mapLegend.wall;
				});
			} else {

				//TODO: go back one line (to leave space between rooms)

				// TODO check if the offset code breaks if the direction value is zero
				if (true /*thisRoom[randomDirection] !== 0*/) {
						var offset = (thisRoom.position - tangentCell) / thisRoom[randomDirection];
						//console.log("OFFSET IS", offset, randomDirection)
						newRoomCellPositions.map(function (cellIndex) {

							// newMap[cellIndex + offset] =  mapLegend.space;
							// TODO: revert debug version to previous line
							newMap[cellIndex + offset] = mapLegend.fence;
						});
					}
				// remove that direction,
				thisRoom[randomDirection]--;
				roomArr[i].validDirections.splice(randomDirectionIndex, 1);
			}

			/* old verson
   var newWallPosition = cellPlusVector(roomArr[i].position, x, y);
   if (newMap[newWallPosition] === mapLegend.wall) {
   	// remove that direction
   	roomArr[i].validDirections.splice(randomDirectionIndex, 1);
   	//TODO: go back one line (to leave space between rooms)
   } else {
   	newMap[newWallPosition] = mapLegend.wall; 
   }
   */
		}
		if (++iteration >= 500) {
			break;
		}
	}

	// remove filler walls, leving only the "fences"
	// remove the room seeds
	newMap = newMap.map(function (val) {
		if (val === mapLegend.wall) {
			return mapLegend.space;
		}
		//if (typeof(val) === 'number') { return mapLegend.space; }
		return val;
	});

	// fill out any isolated areas within map

	/** 
 *
 *	A quick decision. The map generator was having an issue where the player wouldn't
 *	be able to walk everywhere, some areas would be fenced in. My first idea was to have the map thrown away
 *	and restart the generator, it could;ve probably been done by calling the generator function recursively 
 *	within itself, with the same parameters (while stopping the current iteration, of course). 
 *
 *	Then I thought, there is another option. Just fill those out. Make an algorithm to check how many "sections"
 *	there are, and make everything that in't part of the biggest segment one giant block. I think this solution
 *	is technically better, and a bit flashier.
 *
 *	It would be cool to have both those options. But I'm going to implement the second one only since I'd still
 *	have to make a room crawler algorith, and it's a bit less esoteric.
 *
 **/

	// a "chunk" would be the group of tiles connected by up/right/down/left directions 
	// in the case of floor tiles, this would be the tiles the player can walk to 
	// function returns array of positions that are part of same chunk

	function getTileChunk(firstTile) {
		var targetTileType = newMap[firstTile];
		var alreadySetToBeChecked = newMap.map(function () {
			return false;
		});

		var chunkMembers = [];
		var toCheck = [firstTile];

		function addNeighborsToCheck(tile) {
			// NOTE: cellPlusVector returns false for targets outside of map
			var newPos = [];
			newPos.push(cellPlusVector(tile, 1, 0));
			newPos.push(cellPlusVector(tile, 0, 1));
			newPos.push(cellPlusVector(tile, -1, 0));
			newPos.push(cellPlusVector(tile, 0, -1));
			while (newPos.length > 0) {
				var newValToCheck = newPos.pop();
				if (newValToCheck !== false && alreadySetToBeChecked[newValToCheck] === false) {
					toCheck.push(newValToCheck);
					alreadySetToBeChecked[newValToCheck] = true;
				}
			}
			return;
		}

		while (toCheck.length > 0) {
			var currentPos = toCheck.pop();
			if (newMap[currentPos] === targetTileType) {
				chunkMembers.push(currentPos);
				addNeighborsToCheck(currentPos);
			}
		}
		return chunkMembers;
	}

	/** - SHORTCUT TAKEN - 
 * TODO: Instead of checking which chunk is the biggest
 * I just used whatever the player start position is, to avoid bugs where the user 
 * wasn't inside of the alkable area.
 *
 *
 * 
 */

	console.log('map is', newMap);
	// force these tiles as space to avoid player spawning in a broom closet
	newMap[cellPlusVector(playerStartPos, -2, 0)] = mapLegend.space;
	newMap[cellPlusVector(playerStartPos, -1, 0)] = mapLegend.space;
	newMap[cellPlusVector(playerStartPos, 1, 0)] = mapLegend.space;
	newMap[cellPlusVector(playerStartPos, 2, 0)] = mapLegend.space;
	newMap[cellPlusVector(playerStartPos, 0, 0)] = mapLegend.space;
	newMap[cellPlusVector(playerStartPos, 0, -2)] = mapLegend.space;
	newMap[cellPlusVector(playerStartPos, 0, -1)] = mapLegend.space;
	newMap[cellPlusVector(playerStartPos, 0, 1)] = mapLegend.space;
	newMap[cellPlusVector(playerStartPos, 0, 2)] = mapLegend.space;

	var emptyTiles = getTileChunk(playerStartPos);

	newMap = newMap.map(function () {
		return mapLegend.fence;
	});
	emptyTiles.map(function (val) {
		newMap[val] = mapLegend.space;
	});

	//console.log(mapChunks);


	// START PLACING ENTITIES ONTO THE MAP 

	newMap[playerStartPos || randomCellOf(mapLegend.space)] = mapLegend.player;
	if (level < gameDefaults.gameLevels) {
		newMap[randomCellOf(mapLegend.space)] = mapLegend.portal;
	} else {
		newMap[randomCellOf(mapLegend.space)] = mapLegend.boss;
	}
	var enemies = enemies || 0;
	while (enemies--) {
		newMap[randomCellOf(mapLegend.space)] = mapLegend.enemy;
	}
	var potions = gameDefaults.potionsPerLevel || 0;
	while (potions--) {
		newMap[randomCellOf(mapLegend.space)] = mapLegend.potion;
	}
	var weapons = 1;
	while (weapons--) {
		newMap[randomCellOf(mapLegend.space)] = mapLegend.weapon;
	}
	return newMap;
}

// checks array for all entries equal to requested val, returns an array of those indexes
function findAllIndexes(arr, val) {
	var matches = new Array();
	for (var index = 0; index < arr.length; index++) {
		if (arr[index] === val) {
			matches.push(index);
		}
	}
	return matches;
}

var MapCell = React.createClass({
	displayName: 'MapCell',

	render: function render() {
		if (gameImg[this.props.mapChar] !== undefined) {
			return React.createElement(
				'div',
				null,
				React.createElement('img', { src: gameImg[this.props.mapChar], alt: this.props.mapChar })
			);
		} else {
			return React.createElement(
				'div',
				null,
				this.props.mapChar
			);
		}
	}
});

// would be cool to have the state map be obscured at beginning and slowly upgare it from the prop map when valid.
var MainMap = React.createClass({
	displayName: 'MainMap',

	getInitialState: function getInitialState() {
		var mapHeight = gameDefaults.mapHeight;
		var mapWidth = gameDefaults.mapWidth;
		var levelMap = generateMap();
		var damageMap = levelMap.map(function () {
			return 0;
		});
		// convert 2d arr to 1d arr no longer necessary
		// var flattenedMap = Array.prototype.concat.apply([], initialMap);
		var playerPos = levelMap.indexOf(mapLegend.player);

		return {
			levelMap: levelMap,
			damageMap: damageMap, /* ??? delet dis*/
			mapWidth: mapWidth,
			mapHeight: mapHeight,
			playerPos: playerPos,
			playerLevel: 0,
			playerHealth: gameDefaults.playerStartingHealth,
			weaponLevel: 0,
			gameLevel: 1,
			experience: 0
		};
	},
	//delete the duplicate in getInitialState
	// IMPORTANT!!! There's  good chance that the damageMap data is being carried over between levels
	// damageMap needs to be implemented as a state, I've left it as-is, since it shouldn't affect the gameplay too much
	// unless someone it playing more than just a few rounds, in which case I'd rather they just get the 1-hit-ko
	// #FeatureNotABug
	damageMap: function () {
		var damageMap = [];
		for (var i = 0; i < gameDefaults.mapHeight * gameDefaults.mapWidth; i++) {
			damageMap.push(0);
		}
		return damageMap;
	}(),

	componentDidMount: function componentDidMount() {
		window.addEventListener('keydown', this.handleKeyDown);
	},
	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener('keydown', this.handleKeyDown);
	},
	// ! ! ! S U P E R   I M P O R T A N T ! ! !
	// calculates new damage state.array of enemies, used to balance the game
	// used to act as a "roll" of dice before a health system was added for enemies
	killRoll: function killRoll(enemyPos, isBoss) {
		var requiredDamage = isBoss ? gameDefaults.bossHealth : gameDefaults.enemyHealth;
		var basePlayerStrength = gameDefaults.playerBaseDamage;

		// player should on average gain a level for killing a room's worth of enemies
		// a weapon upgrade is worth a player level
		var powerStep = 25;
		var userPower = 50 + powerStep * (this.state.playerLevel + this.state.weaponLevel);
		var estPowerGainedPerLevel = powerStep * (1 + 1);
		var enemyPower = 50 + estPowerGainedPerLevel * this.state.gameLevel;
		var roll = 0.5 + userPower / enemyPower * Math.random();

		this.damageMap[enemyPos] += roll * basePlayerStrength;

		console.log("player pwr:", userPower);
		console.log(this.damageMap[enemyPos], roll, basePlayerStrength);

		if (this.damageMap[enemyPos] >= requiredDamage) {
			return true;
		}
		return false;
	},
	// TODO: make held down movement smoother 
	handleKeyDown: function handleKeyDown(e) {
		var keyCodeDirections = {
			37: 'left',
			38: 'up',
			39: 'right',
			40: 'down'
		};
		if (keyCodeDirections.hasOwnProperty(e.keyCode)) {
			this.movePlayer(this.cellAt(keyCodeDirections[e.keyCode]));
		}
	},
	cellAt: function cellAt(direction) {
		//console.log(direction)
		var playerPos = this.state.playerPos;
		var cellAtDirection;

		// check if player is trying to walk off a border
		if (direction === 'right' && (playerPos + 1) % this.state.mapWidth === 0) {
			return playerPos;
		}
		if (direction === 'left' && playerPos % this.state.mapWidth === 0) {
			return playerPos;
		}

		if (direction === 'up') {
			return playerPos - this.state.mapWidth;
		}
		if (direction === 'right') {
			return playerPos + 1;
		}
		if (direction === 'down') {
			return playerPos + this.state.mapWidth;
		}
		if (direction === 'left') {
			return playerPos - 1;
		}
		throw direction + ' is not a valid direction for cellAt';
	},
	movePlayer: function movePlayer(targetSquare) {
		var oldPosition = this.state.playerPos;
		var oldMap = this.state.levelMap;
		var newPlayerPos = this.state.playerPos;
		var newMap = oldMap.slice();
		var playerHealth = this.state.playerHealth;
		var playerLevel = this.state.playerLevel;
		var weaponLevel = this.state.weaponLevel;
		var gameLevel = this.state.gameLevel;
		var experience = this.state.experience;

		if (newMap[targetSquare] === mapLegend.enemy) {
			if (this.killRoll(targetSquare, false)) {
				console.log('killed enemy');
				newMap[targetSquare] = mapLegend.space;
				experience += Math.round(gameDefaults.medianExpPerKill * (0.5 + Math.random()));
				if (experience >= gameDefaults.expPerPlayerLevel * (playerLevel + 1)) {
					playerLevel++;
				}
			}
			var damageRoll = Math.floor((gameDefaults.medianEnemyDamage + 1) * (0.5 + Math.random()));
			playerHealth -= damageRoll;
		}

		if (newMap[targetSquare] === mapLegend.boss) {
			if (this.killRoll(targetSquare, true)) {
				console.log('killed the boss!!!!!!!\nYOU WIN!!!!!!');
				alert("You have defeated the despicable EvilBot™ and saved the ENTIRE WORLD! Congratulations brave savior!");
				newMap[targetSquare] = mapLegend.space;
				experience += Math.round(gameDefaults.medianExpPerKill * (2.5 + Math.random()));
				if (experience >= gameDefaults.expPerPlayerLevel * (playerLevel + 1)) {
					playerLevel++;
				}
			} else {
				var damageRoll = Math.floor((gameDefaults.medianEnemyDamage + 1) * (0.5 + Math.random()));
				playerHealth -= damageRoll;
			}
		}

		if (newMap[targetSquare] === mapLegend.potion) {
			newMap[targetSquare] = mapLegend.space;
			var healRoll = Math.floor((gameDefaults.medianPotionHealth + 1) * (1 + Math.random()) / 2);
			playerHealth = Math.min(playerHealth + healRoll, gameDefaults.playerMaxHealth);
		}

		if (newMap[targetSquare] === mapLegend.weapon) {
			newMap[targetSquare] = mapLegend.space;
			weaponLevel++;
		}

		if (newMap[targetSquare] === mapLegend.portal) {
			gameLevel++;
			newPlayerPos = targetSquare;
			newMap = generateMap(gameLevel, newPlayerPos);
		}

		if (newMap[targetSquare] === mapLegend.space) {
			newMap[oldPosition] = mapLegend.space;
			newMap[targetSquare] = mapLegend.player;
			newPlayerPos = targetSquare;
		}

		if (playerHealth <= 0) {
			console.log("YOU DIED!");
			//console.log(this.getInitialState())
			alert("You died :(");
			this.setState(this.getInitialState());
			return;
		}

		this.setState({
			playerPos: newPlayerPos,
			levelMap: newMap,
			playerHealth: playerHealth,
			playerLevel: playerLevel,
			weaponLevel: weaponLevel,
			gameLevel: gameLevel,
			experience: experience
		});
	},
	render: function render() {
		var mapDisplay = new Array();
		for (var y = 0; y < this.state.mapHeight; y++) {
			for (var x = 0; x < this.state.mapWidth; x++) {
				var position = x + y * this.state.mapWidth;
				mapDisplay.push(React.createElement(MapCell, { mapChar: this.state.levelMap[position] }));
			}
			mapDisplay.push(React.createElement('br', null));
		}
		return React.createElement(
			'div',
			{ id: 'game-area', onKeyPress: this.handleKeyPress },
			React.createElement(
				'h1',
				null,
				'BROWNIE QUEST!'
			),
			React.createElement(
				'p',
				null,
				'Move with arrow keys. Defeat the final boss!'
			),
			React.createElement(
				'div',
				{ id: 'main-map' },
				mapDisplay
			),
			React.createElement(
				'div',
				null,
				'Health: ',
				this.state.playerHealth
			),
			React.createElement(
				'div',
				null,
				'Dungeon: ',
				this.state.gameLevel
			),
			React.createElement(
				'div',
				null,
				'Level: ',
				this.state.playerLevel
			),
			React.createElement(
				'div',
				null,
				'Knifes: ',
				this.state.weaponLevel
			),
			React.createElement(
				'div',
				null,
				'Brownie Points: ',
				this.state.experience
			)
		);
	}
});

ReactDOM.render(React.createElement(MainMap, null), document.getElementById('main'));

// assumes a perfect rectangle matrix
function matrixWidth(arrArr) {
	return arrArr[0].length;
}
function matrixHeight(arrArr) {
	return arrArr.length;
}