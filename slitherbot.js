if (window.xxx_iv_)clearInterval(window.xxx_iv_);

(function()
{
  class v2
  {
    constructor(x, y)
    {
      if (x !== undefined && isNaN(x))
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
  
  class ProbePoint
  {
    constructor(position)
    {
      this.position = position;
      
      this.weight = 0;
      this.blocked = false;
      
      this.sum = 0;
      this.parent = null;
      
      this.parents = [];
    }
    
    addParent(probe)
    {
      this.parents.push(probe);
    }
    
    reset()
    {
      this.weight = 0;
      this.blocked = false;
      
      this.sum = 0;
      this.parent = null;
    }
    
    trace()
    {
      if (!this.blocked)
      {
        var bestParent = null;
        var score = -1;
        
        this.parents.forEach((parent) =>
        {
          if (parent.parent && parent.sum > score)
          {
            bestParent = parent;
            score = parent.sum;
          }
        });
        
        this.parent = bestParent;
        if (bestParent)
        {
          this.sum += this.weight;
        }
        else
        {
          this.blocked = true;
        }
      }
    }
  }
  
  class Probe
  {
    constructor(layers, radius, density)
    {
      this.layerCount = layers;
      this.radius = radius;
      
      this.layers = [];
      
      this.center = new v2();
      this.heading = 0;
      
      for (var i=0 ; i<layers ; i++)
      {
        var layer = [];
        this.layers.push(layer);
        
        var angle = 2*Math.PI / density;
        var offset = 0;//(i%2) ? angle/2 : 0;
        
        var lradius = radius * (i+1);
        
        for (var j=0 ; j<density ; j++)
        {
          var point = new ProbePoint(
            new v2(
              Math.cos(offset + j*angle)*lradius,
              Math.sin(offset + j*angle)*lradius
            )
          );
          layer.push(point);
          
          if (i>0)
          {
            point.addParent(this.layers[i-1][j]);
            point.addParent(this.layers[i-1][(j+density-1) % density]);
            point.addParent(this.layers[i-1][(j+1) % density]);
          }
        }
      }
    }
    
    reset()
    {
      this.layers.forEach((layer, i) =>
      {
        layer.forEach((point, j) =>
        {
          point.reset();
          
          if (i == 0)
          {
            if ((j + layer.length / 6) % layer.length < layer.length / 3)
            {
              point.parent = point;
            }
          }
        });
      });
    }
    
    trace()
    {
      this.layers.forEach((layer, i) =>
      {
        if (i > 0)
        {
          layer.forEach((point) =>
          {
            point.trace();
          });
        }
      });
    }
    
    draw(g)
    {
      g.save();
      g.translate(this.center.x, this.center.y);
      g.rotate(this.heading);
      
      g.strokeStyle = "red";
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(this.radius * this.layers.length, 0);
      g.stroke();
      
      this.layers.forEach((layer) =>
      {
        layer.forEach((point) =>
        {
          g.fillStyle = point.blocked ? "red" : "green";
          g.fillRect(point.position.x-1, point.position.y-1, 3, 3);
          
          if (point.parent)
          {
            g.beginPath();
            g.moveTo(point.parent.position.x, point.parent.position.y);
            g.lineTo(point.position.x, point.position.y);
            g.stroke();
          }
        });
      });
      
      g.restore();
    }
  }
  
  var __state =
  {
    probe: new Probe(7, 40, 16),
    pos: new v2(),
    speed: 0,
  };
  
  hj_objects.length = 0;
  hj_objects.push(__state.probe);
  
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
      
      out.speed = snake.sp * 32;
      out.angle = snake.ang;
      out.heading = new v2(
        Math.cos(out.angle),
        Math.sin(out.angle)
      );
      
      objects.set(out.id, out);
      
      return out;
    });
    
    var me = objects.get(snake.id);
    if (!me)
    {
      return;
    }
    
    __state.probe.center.set(me.head);
    __state.probe.heading = me.angle;
    
    __state.probe.reset();
    __state.probe.trace();
    
    var delta = me.head.dup().mad(__state.pos, -1);
    if (delta.length() < 100)
    {
      __state.speed = __state.speed * 0.95 + delta.length() * 0.05 / 0.1;
    }
    __state.pos = me.head;
    
    document.title = me.speed + " " + __state.speed;
    
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