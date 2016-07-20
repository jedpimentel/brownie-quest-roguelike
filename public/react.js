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

var keyboardBindings = {
	moveLeft: 37,
	moveUp: 38,
	moveRight: 39,
	moveDown: 40
};

// legend entries must be single characters
var mapLegend = {
	wall: 'w',
	space: ' ',
	player: 'p',
	enemy: 'e',
	potion: '♥',
	weapon: '#',
	portal: '↨',
	boss: '☼'
};
var gameDefaults = {
	mapHeight: 30,
	mapWidth: 40,
	gameLevels: 5,
	simpleMode: false, /* small map, no walls */
	playerStartingHealth: 100,
	playerMaxHealth: 150,
	enemiesPerLevel: 5,
	medianEnemyDamage: 10,
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
		// something to deactivate the walls
	}
	for (var i = 0; i < height * width; i++) {
		if (i < width || i % width === 0 || i % width === width - 1 || i > width * (height - 1)) {
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
		newMap[newRoom.position] = roomArr.length + 1;

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
				console.log(roomArr);
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
			console.log(lineStart, lineEnd, cellGap, randomDirection);

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
						console.log("OFFSET IS", offset, randomDirection);
						newRoomCellPositions.map(function (cellIndex) {

							// newMap[cellIndex + offset] =  mapLegend.space;
							// TODO: revert debug version to previous line
							newMap[cellIndex + offset] = '◙';
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
		if (++iteration == 300) {
			break;
		}
	}

	// START PLACING ENTITIES ONTO THE MAP

	newMap[playerStartPos || randomCellOf(mapLegend.space)] = mapLegend.player;
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
	if (level < gameDefaults.gameLevels) {
		newMap[randomCellOf(mapLegend.space)] = mapLegend.portal;
	} else {
		newMap[randomCellOf(mapLegend.space)] = mapLegend.boss;
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
		return React.createElement(
			'div',
			null,
			this.props.mapChar
		);
	}
});

// would be cool to have the state map be obscured at beginning and slowly upgare it from the prop map when valid.
var MainMap = React.createClass({
	displayName: 'MainMap',

	getInitialState: function getInitialState() {
		var mapHeight = gameDefaults.mapHeight;
		var mapWidth = gameDefaults.mapWidth;
		var levelMap = generateMap();
		// convert 2d arr to 1d arr no longer necessary
		// var flattenedMap = Array.prototype.concat.apply([], initialMap);
		var playerPos = levelMap.indexOf(mapLegend.player);

		return {
			levelMap: levelMap,
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
	componentDidMount: function componentDidMount() {
		window.addEventListener('keydown', this.handleKeyDown);
	},
	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener('keydown', this.handleKeyDown);
	},
	// ! ! ! S U P E R   I M P O R T A N T ! ! !
	// calc if an attack killed the enemy, used to balance the game
	killRoll: function killRoll() {
		// player gains a level for each kill, a weapon upgrade is worth ten player levels
		var powerStep = 10;
		var userPower = 50 + powerStep * (this.state.playerLevel + this.state.weaponLevel);
		var estPowerGainedPerLevel = powerStep * (1 + 1);
		var enemyPower = 50 + estPowerGainedPerLevel * this.state.gameLevel;
		var roll = 0.5 * (enemyPower / userPower) < Math.random();
		return roll;
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
			if (this.killRoll()) {
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
			if (this.killRoll() && this.killRoll()) {
				console.log('killed the boss!!!!!!!\nYOU WIN!!!!!!');
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
				'div',
				{ id: 'main-map' },
				mapDisplay
			),
			React.createElement(
				'div',
				null,
				'health: ',
				this.state.playerHealth
			),
			React.createElement(
				'div',
				null,
				'player-lvl: ',
				this.state.playerLevel
			),
			React.createElement(
				'div',
				null,
				'weapon-lvl: ',
				this.state.weaponLevel
			),
			React.createElement(
				'div',
				null,
				'game-lvl: ',
				this.state.gameLevel
			),
			React.createElement(
				'div',
				null,
				'experience: ',
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