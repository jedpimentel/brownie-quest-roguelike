Testing SASS/React
Originally created as part of the freecodecamp.com curriculum.
https://www.freecodecamp.com/challenges/build-a-roguelike-dungeon-crawler-game

The task is to make a Rogulike dungeon crawler game using SASS and React.

I had to take some time off to think this over so I wouldn't bite offf more than I can chew. I'm trying my best to make this as simple as possible so it won't take me a month to develop. (I can always edit it in the future if needed).

I've decided to give the game a (vague) Free Code Camp theme, since I think "Brownie Quest" sounds fun. Brownie points are what's used to gamify freecodecamp, you get a point for every challenge you solve, or for receiving thanks in the FCC chatroom. You get a single point for everything, so getting thanked by someone you welcomed into the chat is worth as much brownie points as me finishing this game after a few days of design and development

For ease of tweaking the game logic, this project is meant to have as much game logic as possible outside of the React code.

To do:
	Meet all user stories in problem statement (check URL).
	Make a leveling system where player can gain experience.
	Simple weapon system, player can pick up better weapons.
	Fog-of-war system, with a "match" item that reveals the whole map.
	Confirmation text before exiting to the next level.
	implement stats: speed, vitality, offense, 

Nice to haves:
	Make enemies be the FCC users who've gotten the most brownie points in the past 30 days.
	Make enemies be the FCC users who've most recently intereacted in the official chatrom (or similar place).
	Make camperbot (the friendly FCC chatbot) the final boss.
	Frame the game's screen area with the FizzBuzz code similar to the FCC certificatees
	Flavor text describing important events (item pickup, battles)
	"pop-up" showing a detailed view of important events. (item pickup, won/lost to an enemy)
	Use icons/sprites instead of colored squares or characters.
	Icons could be oversized, taking half their neighboring spaces, to make sprites bigger.
	A "mini-map", so that main view can be more zoomed in and have more detailed sprites.



note to self: 

npm install babel-preset-es2015 babel-preset-react

start /b sass --watch source:public & ^
start /b babel --presets es2015,react --watch source/ --out-dir public/  & ^
start /b http-server ./
