if (window.xxx_iv_)clearInterval(xxx_iv_);

function main()
{
	if (!snake) 
		return;
  	
  	var dirHeadX = Math.cos(snake.ang);
  	var dirHeadY = Math.sin(snake.ang);

  	var dodge = false;

  	//console.log(dirHeadX + " " + dirHeadY);
  	//console.log(xm + " " + ym);

	for(other of snakes) // Iterate over other snakes
	{
		if(other == snake || other == undefined || other == null)
			continue;

		var closestPt = [];
		closestPt._dist = 123456789;

		for(pt of other.pts) // Iterate over points of other snake
		{
			var dist = getDistance(snake.xx, snake.yy, pt.xx, pt.yy);

			if(snake.wmd)
				dist /= 2;

			if(dist <= Math.max(snake.tl * 2.5, 200))
			{
				var dirX = pt.xx - snake.xx; // Vector from head of your snake to the point of the other snake
				var dirY = pt.yy - snake.yy; 

				var cosAngle = (dirX * dirHeadX + dirY * dirHeadY) / (Math.hypot(dirX, dirY) * Math.hypot(dirHeadX, dirHeadY));

				if(cosAngle >= 0.9)
				{
					dodge = true;
					snake.wmd = false;
				}
				else
				{
					if(dist < closestPt._dist)
					{
						closestPt = pt;
						closestPt._dist = dist;
					}
				}
			}
		}
	}

	if(dodge)
	{
		var dot = dirHeadX * (closestPt.xx - snake.xx) + dirHeadY * (closestPt.yy - snake.yy);
		//console.log(dot);
		if(dot >= 0)
		{
			xm = dirHeadY * 100;
			ym = -dirHeadX * 100;
		}
		else
		{
			xm = -dirHeadY * 100;
			ym = dirHeadX * 100;
		}
	}
	else
	{

		var food = getClosestFood();
		var prey = getClosestPrey();
		if(prey && getDistance(snake.xx, snake.yy, prey[0], prey[1]) < 1500 && (snake.tl > 6 || (snake.tl > 3 && snake.wmd)))
		{
			xm = prey[0];
			ym = prey[1];
			snake.wmd = true;
		}
		else
		{
			xm = food[0];
			ym = food[1];
			snake.wmd = false;
		}
	}

}

function getDistance(x1, y1, x2, y2)
{
    return Math.hypot(x2 - x1, y2 - y1);
}

function getClosestFood(position = 0)
{
	var temp;
	var sortedFoods = foods;

	sortedFoods = sortedFoods.filter(food => food); // remove null elements

	sortedFoods = sortedFoods.map(food => (temp = [food.xx - snake.xx, food.yy - snake.yy, 0, 0], 
		temp[2] = Math.hypot(temp[0], temp[1]), temp[3] = food.rad /*FoodSize*/, temp)); //Write Data in sortedFoods

	sortedFoods = sortedFoods.filter(food => {
		if(Math.hypot(food[0], food[1] - 20 + snake.tl * 1.1) < Math.max(snake.tl, 25) + 30)
			return false;
		return true;
	}); // Filter food which is behind the head of the snake

	sortedFoods = sortedFoods.sort((food1, food2) => food1[2] / food1[3] - food2[2] - food2[3]); //Finally sort food, depending on its distance and size

	return sortedFoods[position];
}

function getClosestPrey(position = 0)
{
	var temp;
	var sortedPreys = preys;

	sortedPreys = sortedPreys.filter(prey => prey); // remove null elements

	sortedPreys = sortedPreys.map(prey => (temp = [prey.xx - snake.xx, prey.yy - snake.yy, 0], 
		temp[2] = Math.hypot(temp[0], temp[1]), temp)); //Write Data in sortedPreys

	sortedPreys = sortedPreys.filter(prey => {
		if(Math.hypot(prey[0], prey[1] - 20 + snake.tl * 1.1) < Math.max(snake.tl, 25) + 30)
			return false;
		return true;
	}); // Filter prey which is behind the head of the snake

	sortedPreys = sortedPreys.sort((prey1, prey2) => prey1[2] - prey2[2]); //Finally sort prey, depending on its distance

	return sortedPreys[position];
}

xxx_iv_ = setInterval(main, 100);