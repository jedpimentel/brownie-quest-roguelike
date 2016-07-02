'use strict';

/**
* raw map data is meant to be represented as characters.
* 
* STAT DEFINITION
* speed: in battle, used to calculate if either player or enemy hits first 
* vitality: max health, though might be better off not using helth caps
* offense: more offense means each hit given removes bigger chunks of target's health
* defense: more defense means each hit recieved removes smaller chunks of your health
* 
* map generation rules:
* 	must be bordered by walls
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

var testMap = [
	['w', 'w', 'w', 'w', 'w', 'w', 'w'],
	['w', ' ', ' ', ' ', ' ', ' ', 'w'],
	['w', ' ', ' ', ' ', ' ', ' ', 'w'],
	['w', ' ', ' ', ' ', ' ', ' ', 'w'],
	['w', ' ', ' ', ' ', ' ', ' ', 'w'],
	['w', 'p', ' ', ' ', ' ', ' ', 'w'],
	['w', ' ', ' ', ' ', ' ', ' ', 'w'],
	['w', 'w', 'w', 'w', 'w', 'w', 'w'],
];

function generateMap(height, width) {
	if (arguments.length === 0) {
		var testMap = [
			['w', 'w', 'w', 'w', 'w', 'w', 'w'],
			['w', ' ', ' ', ' ', ' ', ' ', 'w'],
			['w', ' ', ' ', ' ', ' ', ' ', 'w'],
			['w', ' ', ' ', ' ', ' ', ' ', 'w'],
			['w', ' ', ' ', ' ', ' ', ' ', 'w'],
			['w', 'p', ' ', ' ', ' ', ' ', 'w'],
			['w', ' ', ' ', ' ', ' ', ' ', 'w'],
			['w', 'w', 'w', 'w', 'w', 'w', 'w'],
		];
		return testMap;
	}
}

var mapLegend = {
	wall  : 'w',
	space : ' ',
	player: 'p',
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
		var initialMap = generateMap();
		var mapWidth = matrixWidth(initialMap);
		var mapHeight = matrixHeight(initialMap);
		// convert 2d arr to 1d arr
		var flattenedMap = Array.prototype.concat.apply([], initialMap);
		var playerPos = flattenedMap.indexOf(mapLegend.player)
		
		return ({
			levelMap : flattenedMap,
			mapWidth : mapWidth,
			mapHeight: mapHeight,
			playerPos: playerPos,
		});
	},
	componentDidMount: function() {
		window.addEventListener('keydown', this.handleKeyDown);
	},
	componentWillUnmount: function() {
		window.removeEventListener('keydown', this.handleKeyDown);
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
		console.log(direction)
		var playerPos = this.state.playerPos;
		var cellAtDirection;
		if (direction === 'up'   ) {return playerPos - this.state.mapWidth;}
		if (direction === 'right') {return playerPos + 1;}
		if (direction === 'down' ) {return playerPos + this.state.mapWidth;}
		if (direction === 'left' ) {return playerPos - 1;}
		throw direction + ' is not a valid direction for cellAt';
	},
	movePlayer: function(newPosition) {
		var oldPosition = this.state.playerPos;
		var oldMap      = this.state.levelMap;
		var newMap      = oldMap.slice();
		if (oldMap[newPosition] === mapLegend.space) {
			newMap[oldPosition] = mapLegend.space;
			newMap[newPosition] = mapLegend.player;
			
			this.setState({
				playerPos: newPosition,
				levelMap: newMap,
			});
			return;
		}
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
			<div id='main-map' onKeyPress={this.handleKeyPress}>
				{mapDisplay}
				<div> test </div>
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
