if (window.xxx_iv_)clearInterval(xxx_iv_);
xxx_iv_=setInterval(function()
{
  if (!snake) return;
  
  var fx=Math.cos(snake.ang);
  var fy=Math.sin(snake.ang);
  var a, lookahead=0;
	var vectors = foods
    .filter(x=>x)
		.map(x=>(a=[x.xx-snake.xx, x.yy-snake.yy, 0, 0], a[2] = Math.hypot(a[0],a[1]), a[3] = x.rad, a))
    .filter(x=>
    {
      if (Math.hypot(x[0], x[1]-20+snake.tl*1.1) < Math.max(snake.tl, 25) + 30)
      {
        return false;
      }
      return true;
    })
    .sort((a,b)=>a[2]/a[3] - b[2]/b[3])
    ;
  
	var vectors2 = preys
    .filter(x=>x)
		.map(x=>(a=[x.xx-snake.xx,x.yy-snake.yy,0],a[2]=Math.hypot(a[0],a[1]),a))
    .filter(x=>{
      if (Math.hypot(x[0], x[1]-20+snake.tl*1.1) < 30+snake.tl)
      {
        return false;
      }
      return true;
    })
    .sort((a,b)=>a[2]-b[2])
    ;
  
  xm = 0;
  ym = 0;
  weight = 0.1;
  
  var vmoving = vectors2.filter(x=>x[2]<800);
  if (vmoving.length && (snake.tl > 6 || (snake.tl > 3 && snake.wmd)) && (snake.tl <= 70 || vmoving[0][2] < 150))
  {
    var target = vmoving[0];
    
    weight += 10;
    xm = target[0]*10;
    ym = target[1]*10;
    snake.wmd = true;
    snake._hunt = true;
  }
  else if (vectors.length > lookahead)
  {
    var best = vectors[lookahead];
    
    weight += 150;
    xm = best[0]*150;
    ym = best[1]*150;
    lookahead = 0;
    snake.wmd = false;
    snake._hunt = false;
  }
  else
  {
    snake.wmd = false;
    snake._hunt = false;
  }

  var cDx = 1234567;
  var cDy = 1234567;
  var cPx = 1234567;
  var cPy = 1234567;
  var cPr = 1234567;
  var cR = 1234567;
  var cWMD = false;

  snakes.forEach(other=>
  {
    if(snake==other)return;

    /*var pt = other;
    var dx = pt.xx-snake.xx, dy=pt.yy-snake.yy;
    //Kopf ausweichen
    var r = -Math.hypot(dx, dy) - other.tl - snake.tl * 1.5;
    
    var maxdist = 130 + other.tl
    if (r < maxdist)
    {
      
      xm = dx;
      ym = dy;
    }*/
    
    other.pts
    .map((pt,i,a)=>
    {
      var dx = pt.xx-snake.xx, dy=pt.yy-snake.yy;
      var r = Math.hypot(dx, dy);
      
      pt._dx = dx;
      pt._dy = dy;
      pt._r = r;

      var p1, p2;
      

      if(i == a.length-1)
      {
        p1 = a[i - 1];
        p2 = a[i];
      }
      else
      {
        p1 = a[i];
        p2 = a[i + 1];
      }
      pt._px = p1.xx-p2.xx;
      pt._py = p1.yy-p2.yy;
      pt._pr = Math.hypot(pt._px, pt._py);

      /*if (r < Math.max(snake.tl*2, 200) && snake.wmd)
      {
        snake.wmd = false;
      }*/

      if(pt._r < cR)
      {
        cDx = pt._dx;
        cDy = pt._dy;
        cPx = pt._px;
        cPy = pt._py;
        cPr = pt._pr;
        cR = pt._r, cR;
        cWMD = other.tsp > other.fsp;
      }
      
      return pt;
    })/*
    .sort((a, b)=>{
      return a._r - b._r;
    })
    .filter(x=>x)
    .slice(0, 1)
    .forEach((pt,i,a)=>{
      
      var r = pt._r;
      //r -= other.tl;
      if (snake.wmd)
      {
        r += snake.tl;
      }

      var safeDistance = Math.max(snake.tl * 2.3, 300);
      if (r < safeDistance)
      {
        var dx = pt._dx;
        var dy = pt._dy;
        
        var f1 = 0;
        var f2 = 5000;

        if(r < Math.max(other.tl*2.5, 150))
        {
          f1 = -5000;
          f2 = 0;
        }

        var reldot = (pt._px*fx + pt._py*fy) / pt._pr;
        if (reldot < 0)
        {
          f2 = -f2;
        }

        dx = pt._dx * f1 + pt._px * f2;
        dy = pt._dy * f1 + pt._py * f2;

        //r = Math.hypot(dx, dy);
        
        //var w = Math.pow((snake.tl + safeDistance - r), 3) * 1.5;
          
        xm += dx;//*w;
        ym += dy;//*w;
        //weight += w;*/
        
        /*if (r < 2000 && !snake.wmd)
        {
          var w = Math.pow((2000 - r) * 0.001, 1);
          
          xm -= dx*w;
          ym -= dy*w;
          weight += w;
        }
      }
    });*/
  });      

  var r = cR;
  //r -= other.tl;
  if (snake.wmd)
  {
    r -= snake.tl/2;
  }

  var safeDistance = Math.max(snake.tl * 3, 300);
  safeDistance *= snake.wmd ? 3 : 1;
  safeDistance /= snake._hunt ? 2 : 1;
  if (r < safeDistance)
  {
    snake._hunt = false;
    var dx = cDx;
    var dy = cDy;
    var direction = 1;

    var reldot = (cPx*fx + cPy*fy) / cPr;
    if (reldot < 0)
    {
      direction = -1;
    }
    
    var f1 = -0.3;
    var f2 = 1 * direction;

    if(cWMD && r > Math.max(50, snake.tl * 2))
    {
      f1 = -0;
      f2 = 1 * direction;
      if(direction)
        snake.wmd = true;
      else
        snake.wmd = true;
    }
    else
      snake.wmd = false;

    dx = cDx * f1 + cPx * f2;
    dy = cDy * f1 + cPy * f2;

    //r = Math.hypot(dx, dy);
    
    //var w = Math.pow((snake.tl + safeDistance - r), 3) * 1.5;
      
    xm = dx;//*w;
    ym = dy;//*w;
  }
  
}, 100);