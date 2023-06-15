# Slitherbot

A little side project writing a bot for the game slither.io by reverse engineering the website. Please note that the code was written in 2017 and may not work anymore. As of this writing in 06/2023 however it is still working.

Project link with video: [Click](https://martin-wepner.de/javascript-slither-io-intelligent-bot/)

The goal of the game is to become the largest snake of the game by eating either the food that lies around or to eat other snakes (other players). If you touch another snake you will die and other snakes/player can consume your "points". 

Strengths of the bot:
- path planning to get the most available food
- chasing moving food by accelerating (0:40s in the video)
- preventing attacks by other players by accelerate when another player is nearby and starts an attack (1:42s in the video)

Weaknesses:
- The bot doesn't realize when it's "circled" by another snake. A human would escape this kind of attack quickly; the bot however will be circled and will die eventually
- While the bot tries to prevent to crash into other snakes (and therefore die), it is not aware of how steeply he is able to take a curve. As the snake grows it's ability to make steep curves decrease. So eventually the bot will die after a while because it "thinks" it will be able to prevent a snake while it is not able anymore because of the curve (see the end of the video). This can be improved by further analyze the websites code and reverse engineer the logic for the curve-angle to snake-size ratio.

 
