if (window.xxx_iv_)clearInterval(window.xxx_iv_);

(function()
{
  class v2
  {
    constructor(x, y)
    {
      if (isNaN(x))
      {
        this.set(x);
      }
      else
      {
        this.x = x || 0;
        this.y = y || 0;
      }
    }
    
    set(v)
    {
      this.x = v.x;
      this.y = v.y;
      return this;
    }
    
    dup()
    {
      return new this.constructor(this);
    }
    
    mad(v, f)
    {
      this.x += v.x * f;
      this.y += v.y * f;
      return this;
    }
    
    mul(f)
    {
      this.x *= f;
      this.y *= f;
      return this;
    }
    
    cross(v)
    {
      return this.x*v.y - this.y*v.x;
    }
    
    dot(v)
    {
      return this.x*v.x + this.y*v.y;
    }
    
    length()
    {
      return Math.hypot(this.x, this.y);
    }
    
    unit()
    {
      return this.mul(1/this.length());
    }
    
    *iter()
    {
      yield this.x;
      yield this.y;
    }
    
    toString()
    {
      return "<" + this.x + " " + this.y + ">";
    }
  }
  
  var __state =
  {
    probes: [],
  };
  
  window.xxx_iv_=setInterval(function()
  {
    if (!snake) return;
    
    var objects = new Map();
    
    var foods = window.foods
    .filter((food)=>food)
    .map((food)=>
    {
      var out = new v2(food.rx, food.ry);
      
      out.id = food.id;
      out.size = food.sz;
      
      objects.set(out.id, out);
      
      return out;
    });
    
    var snakes = window.snakes
    .filter((snake)=>snake)
    .map((snake)=>
    {
      var out = {};
      
      out.id = snake.id;
      out.head = new v2(snake.xx, snake.yy);
      out.tail = snake.pts.map((point, i, a)=>
      {
        var out = new v2(point.xx, point.yy);
        
        var last = a[i-1] || point;
        var next = a[i+1] || point;
        
        out.tangent = new v2(last.xx - next.xx, last.yy - next.yy).unit();
        
        return out;
      });
      
      out.speed = snake.sp;
      out.heading = new v2(
        Math.cos(snake.ang),
        Math.sin(snake.ang)
      );
      
      objects.set(out.id, out);
      
      return out;
    });
    
    var me = objects.get(snake.id);
    if (!me)
    {
      return;
    }
    
    var best = foods
    .filter((food)=>
    {
      var offset = food.dup().mad(me.head, -1);
      var distance = offset.length();
      
      var front = offset.dot(me.heading);
      var right = offset.cross(me.heading);
      
      var angle = Math.abs(Math.atan2(right, front));
      
      food.offset = offset;
      food.angle = angle;
      food.distance = distance;
      
      return distance < 300 && angle < Math.PI / 3;
    })
    .sort((a, b)=>((b.size-a.size) || (a.angle-b.angle)));
    
    if (best.length > 0)
    {
      xm = best[0].offset.x;
      ym = best[0].offset.y;
    }
  }, 100);
})();