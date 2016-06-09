window.__redraw = window.__redraw || window.redraw;
window.redraw = function()
{
  window.__redraw();
  if (hj_draw)
  {
    try
    {
      hj_draw();
    }
    catch (e)
    {
      console.error(e);
    }
  }
};

function marker(g, x, y, col)
{
  g.save();
  g.translate(x, y);
  
  g.strokeStyle = col || "red";
  g.beginPath();
  g.moveTo(-10, -10)
  g.lineTo(10, 10);
  g.moveTo(-10, 10);
  g.lineTo(10, -10);
  g.stroke();
  
  g.restore();
}

function bigmarker(g, x, y, col)
{
  g.save();
  g.translate(x, y);
  
  g.strokeStyle = col || "red";
  g.beginPath();
  g.arc(0,0,12, 0,Math.PI*2, false);
  g.moveTo(-20,0)
  g.lineTo(20,0);
  g.moveTo(0,-20);
  g.lineTo(0,20);
  g.stroke();
  
  g.restore();
}

function showObject(g, obj)
{
  if (!obj)
  {
    return;
  }
  
  var x = obj.rx || obj.xx;
  var y = obj.ry || obj.yy
  
  marker(g, x, y);
  g.fillText(""+obj.sz, x, y);
}

function showSnake(g, obj, col)
{
  if (!obj || obj == snake)
  {
    return;
  }
  
  g.save();
  g.translate(obj.xx, obj.yy);
  
  var safe_radius = Math.max(100, Math.hypot(obj.xx-snake.xx, obj.yy-snake.yy) * obj.sp / (obj.sp + snake.sp));
  
  g.strokeStyle = col || "red";
  g.beginPath();
  g.arc(0,0,safe_radius, 0,Math.PI*2, false);
  g.moveTo(-10, -10)
  g.lineTo(10, 10);
  g.moveTo(-10, 10);
  g.lineTo(10, -10);
  g.stroke();
  
  g.restore();
}

var hj_objects = [];

function hj_draw()
{
  if (!snake)
  {
    return;
  }
  
  var c = window.mc;
  var g = c.getContext("2d");
  
  g.save();
  g.translate(c.width/2, c.height/2);
  g.scale(gsc, gsc);
  g.translate(-view_xx, -view_yy);
  
  marker(g, snake.xx, snake.yy);
  bigmarker(g, snake.xx + xm, snake.yy + ym);
  
  g.fillStyle = "lime";
  g.font = "20px sans";
  foods.forEach((food) => { showObject(g, food); });
  preys.forEach((prey) => { showObject(g, prey); });
  snakes.forEach((snake) => { if(snake) showSnake(g, snake); });
  
  for (var i=0 ; i<hj_objects.length ; i++)
  {
    hj_objects[i].draw();
  }
  
  g.restore();
}
