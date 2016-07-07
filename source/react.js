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
* 
* 
*
*/

// these bindings are not currently used
var keyboardBindings = {
	moveLeft : 37,
	moveUp   : 38,
	moveRight: 39,
	moveDown : 40,
};


var mapLegend = {
	wall  : 'w',
	space : ' ',
	player: 'p',
	enemy : 'e',
	potion: '+',
	weapon: '#',
	portal: '↨',
}
var gameDefaults = {
	mapHeight: 10,
	mapWidth : 10,
	playerStartingHealth: 100,
	enemiesPerLevel     : 5,
	medianEnemyDamage   : 10,
	potionsPerLevel     : 2,
	medianPotionHealth  : 50,
}
function generateMap() {
	var height = gameDefaults.mapHeight;
	var width = gameDefaults.mapWidth;
	var enemies = gameDefaults.enemiesPerLevel;
	var newMap = new Array;
	for (var i = 0; i < height * width; i++) {
		if ((i < width) || (i % width === 0) || (i % width === width - 1) || (i > width * (height - 1))) {
			newMap.push(mapLegend.wall);
		} else {
			newMap.push(mapLegend.space);
		}
	}
	// unoptimized, returns valid index containing entry
	function randomCellOf(legendEntry) {
		var validCells = findAllIndexes(newMap, legendEntry);
		if (validCells.length < 1) { return -1; }
		var randomNumber = Math.floor(Math.random() * validCells.length);
		return validCells[randomNumber];
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
	var portals = 1;
	while (portals--) {
		newMap[randomCellOf(mapLegend.space)] = mapLegend.portal;
	}
	newMap[randomCellOf(mapLegend.space)] = mapLegend.player;
	// turn into a 2d array as the react code expects this format (early design decision)
	return newMap;
	
}

// checks array for all entries equal to requested val, returns an array of those indexes
function findAllIndexes(arr, val) {
	var matches = new Array;
	for (var index = 0; index < arr.length; index++) {
		if (arr[index] === val) {
			matches.push(index);
		}
	}
	return matches;
}

var MapCell = React.createClass({
	render: function() {
		return (
			<div>{this.props.mapChar}</div>
		)
	}
});

// would be cool to have the state map be obscured at beginning and slowly upgare it from the prop map when valid.
var MainMap = React.createClass({
	getInitialState: function() {
		var mapHeight = gameDefaults.mapHeight;
		var mapWidth = gameDefaults.mapWidth;
		var levelMap = generateMap();
		// convert 2d arr to 1d arr no longer necessary
		// var flattenedMap = Array.prototype.concat.apply([], initialMap);
		var playerPos = levelMap.indexOf(mapLegend.player)
		
		return ({
			levelMap    : levelMap,
			mapWidth    : mapWidth,
			mapHeight   : mapHeight,
			playerPos   : playerPos,
			playerLevel : 0,
			playerHealth: gameDefaults.playerStartingHealth,
			weaponLevel : 0,
			gameLevel   : 0,
		});
	},
	componentDidMount: function() {
		window.addEventListener('keydown', this.handleKeyDown);
	},
	componentWillUnmount: function() {
		window.removeEventListener('keydown', this.handleKeyDown);
	},
	// ! ! ! S U P E R   I M P O R T A N T ! ! !
	// calc if an attack killed the enemy, used to balance the game
	killRoll: function() {
		// player gains a level for each kill, a weapon upgrade is worth ten player levels
		var userPower = 50 + this.state.playerLevel + 10 * this.state.weaponLevel;
		var maxPowerGainedPerLevel = gameDefaults.enemiesPerLevel + 10;
		var enemyPower = 50 + maxPowerGainedPerLevel * this.state.gameLevel;
		var roll = Math.random() * userPower > Math.random() * enemyPower;
		return roll;
	},
	// TODO: make held down movement smoother
	handleKeyDown: function(e) { 
		var keyCodeDirections = {
			37: 'left' ,
			38: 'up'   ,
			39: 'right',
			40: 'down' ,
		};
		if (keyCodeDirections.hasOwnProperty(e.keyCode)) {
			this.movePlayer(this.cellAt(keyCodeDirections[e.keyCode]));
		}
	},
	cellAt: function(direction) {
		//console.log(direction)
		var playerPos = this.state.playerPos;
		var cellAtDirection;
		if (direction === 'up'   ) {return playerPos - this.state.mapWidth;}
		if (direction === 'right') {return playerPos + 1;}
		if (direction === 'down' ) {return playerPos + this.state.mapWidth;}
		if (direction === 'left' ) {return playerPos - 1;}
		throw direction + ' is not a valid direction for cellAt';
	},
	movePlayer: function(targetSquare) {
		var oldPosition = this.state.playerPos;
		var oldMap      = this.state.levelMap;
		var newPlayerPos= this.state.playerPos;
		var newMap      = oldMap.slice();
		var playerHealth= this.state.playerHealth;
		var playerLevel = this.state.playerLevel;
		var weaponLevel = this.state.weaponLevel;
		
		if (newMap[targetSquare] === mapLegend.enemy) {
			if (this.killRoll()) {
				console.log('killed enemy')
				newMap[targetSquare] = mapLegend.space;
				playerLevel++;
			}
			var damageRoll = Math.floor((gameDefaults.medianEnemyDamage + 1) * ( 1 + Math.random()) / 2);
			playerHealth -= damageRoll;
		}
		
		if (newMap[targetSquare] === mapLegend.potion) {
			newMap[targetSquare] = mapLegend.space;
			var healRoll = Math.floor((gameDefaults.medianPotionHealth + 1) * ( 1 + Math.random()) / 2);
			playerHealth += healRoll;
		}
		
		if (newMap[targetSquare] === mapLegend.weapon) {
			newMap[targetSquare] = mapLegend.space;
			weaponLevel++;
		}
		
		if (newMap[targetSquare] === mapLegend.space) {
			newMap[oldPosition] = mapLegend.space;
			newMap[targetSquare] = mapLegend.player;
			newPlayerPos = targetSquare;
		}
		
		this.setState({
			playerPos   : newPlayerPos,
			levelMap    : newMap,
			playerHealth: playerHealth,
			playerLevel : playerLevel,
			weaponLevel : weaponLevel
		})
		
	},
	render: function() {
		var mapDisplay = new Array;
		for (var y = 0; y < this.state.mapHeight; y++) {
			for (var x = 0; x < this.state.mapWidth; x++) {
				var position = x + y * this.state.mapWidth;
				mapDisplay.push(<MapCell mapChar={this.state.levelMap[position]} />)
			}
			mapDisplay.push(<br />)
		}
		return (
			<div id='game-area' onKeyPress={this.handleKeyPress}>
				<div id='main-map'>
					{mapDisplay}
				</div>
				<div>health: {this.state.playerHealth}</div>
				<div>player-lvl: {this.state.playerLevel}</div>
				<div>weapon-lvl: {this.state.weaponLevel}</div>
				<div>game-lvl: {this.state.gameLevel}</div>
			</div>
		)
	}
});

ReactDOM.render(
	<MainMap />,
	document.getElementById('main')
)

// assumes a perfect rectangle matrix
function matrixWidth(arrArr) {
	return arrArr[0].length;
}
function matrixHeight(arrArr) {
	return arrArr.length
}
