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
    
    min(v)
    {
      this.x = Math.min(this.x, v.x);
      this.y = Math.min(this.y, v.y);
      return this;
    }
    
    max(v)
    {
      this.x = Math.max(this.x, v.x);
      this.y = Math.max(this.y, v.y);
      return this;
    }

    right(v)
    {
      var x = this.x;
      var y = this.y;

      this.x = y;
      this.y = -x;
      return this;
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
  v2.zero = new v2();
  
  class ProbePoint
  {
    constructor(position)
    {
      this.position = position;
      this.parents = [];
      
      this.reset();
    }
    
    addParent(probe)
    {
      this.parents.push(probe);
    }
    
    reset()
    {
      this.weight = 0;
      this.blocked = false;
      this.needsRacing = false;
      
      this.sum = 0;
      this.parent = null;
      this.bestNode = null;
    }
    
    addFood(food)
    {
      var dist = Math.hypot(window.snake.xx - food.x, window.snake.yy - food.y);
      this.weight += (food.size * 100) / dist;
      //if(this.weight >= 40)
      //  this.needsRacing = true;
      //this.weight += food.size - 2;
    }

    addPrey(prey)
    {
      var dist = Math.hypot(window.snake.xx - prey.x, window.snake.yy - prey.y);
      this.weight += (prey.size * 5 * 100) / dist;
      this.needsRacing = true;
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
          this.sum = score + this.weight;
        }
        else
        {
          this.blocked = true;
        }
      }
    }
    
    traceBack()
    {
      if (this.parent && !this.blocked)
      {
        if(this.sum > this.parent.sum)
        {
          this.parent.sum = this.sum;
          this.parent.bestNode = this.bestNode || this;
          if (this.needsRacing)
          {
            this.parent.needsRacing = this.needsRacing;
          }
        }
      }
    }
  }
  
  class Probe
  {
    constructor(layers, radius, placingDensity, startDensity)
    {
      this.layerCount = layers;
      this.radius = radius;
      
      this.layers = [];
      
      this.center = new v2();
      this.angle = 0;
      this.heading = new v2(1, 0);
      
      var prevradius = 0;
      for (var i=0 ; i<layers ; i++)
      {
        var layer = [];
        
        var lradius = radius * (i+1-0.6);
        var density = Math.ceil((i+1-0.6+startDensity) * placingDensity);
        
        var angle = 2*Math.PI / density;
        var offset = 0;//(i%2) ? angle/2 : 0;
        
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
            var [layerid, pointid] = this.getNearestPoint(point.position.dup().mul(prevradius / lradius));
            
            var parentLayer = this.layers[layerid];
            if (parentLayer)
            {
              point.addParent(parentLayer[pointid]);
              point.addParent(parentLayer[(pointid+1) % parentLayer.length]);
              point.addParent(parentLayer[(pointid+parentLayer.length-1) % parentLayer.length]);
              point.addParent(parentLayer[(pointid+parentLayer.length-2) % parentLayer.length]);
              point.addParent(parentLayer[(pointid+2) % parentLayer.length]);
            }
          }
        }
        
        prevradius = lradius;
        this.layers.push(layer);
      }
    }
    
    get right()
    {
      return new v2(-this.heading.y, this.heading.x);
    }
    
    getGlobalPosition(position)
    {
      return this.right
        .mul(position.y)
        .mad(this.heading, position.x)
        .mad(this.center, 1);
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
            if ((j + layer.length / 4) % layer.length < layer.length / 2)
            {
              point.parent = point;
            }
            var back = Math.abs(j - layer.length/2);
            if (back > 2 && back < 3)
            {
              point.parent = point;
            }
          }
        });
      });
    }
    
    getNearestPoint(point)
    {
      var offset = point.dup().mad(this.center, -1);
      var distance = offset.length();
      
      var layerid = Math.floor(distance / this.radius - 0.5 + 0.6);
      var layer = this.layers[layerid];
      
      if (layer)
      {
        var angle = -Math.atan2(offset.cross(this.heading), offset.dot(this.heading));
        
        var pointid = (layer.length + (Math.floor(angle / (Math.PI*2) * layer.length + 0.5) % layer.length)) % layer.length;
        
        return [layerid, pointid];
      }
      
      return [-1, -1];
    }
    
    addFood(food)
    {
      var [layerid, pointid] = this.getNearestPoint(food);
      
      var layer = this.layers[layerid];
      if (layer)
      {
        var point = layer[pointid];
        
        point.addFood(food);
      }
    }
    
    addPrey(food)
    {
      var [layerid, pointid] = this.getNearestPoint(food);
      
      var layer = this.layers[layerid];
      if (layer)
      {
        var point = layer[pointid];
        
        point.addPrey(food);
      }
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
    
    traceBack()
    {
      for (var i=this.layers.length-1 ; i>0 ; i--)
      {
        var layer = this.layers[i];
        
        if (i > 0)
        {
          layer.forEach((point) =>
          {
            point.traceBack();
          });
        }
      }
      
      var self = this;
      self.bestNode = null;
      return this.layers[0]
        .slice()
        .sort((a,b) => b.sum-a.sum)
        .map((point) =>
        {
          if(!self.bestNode)
          {
            self.bestNode = point.bestNode;
          }
          return self.getGlobalPosition(point.position);
        });
    }
    
    *iter()
    {
      for (var layer of this.layers)
      {
        yield* layer;
      }
    }
    
    draw(g)
    {
      g.save();
      
      g.translate(this.center.x, this.center.y);
      g.rotate(this.angle);
      
      g.strokeStyle = "red";
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(this.radius * this.layers.length, 0);
      g.stroke();

      var best = this.bestNode || 1;


      this.layers.forEach((layer) =>
      {
        layer.forEach((point) =>
        {
          if(point.bestNode == best || !window.__state.show_only_best_probe)
          {

            g.strokeStyle = point.blocked ? "red" : (point.bestNode == best ? "white" : "green");
            
            var size = 1 + point.weight;
            g.strokeRect(point.position.x-size, point.position.y-size, size*2+1, size*2+1);
            
            //g.beginPath();
            //point.parents.forEach((parent)=>
            //{
            //  g.moveTo(parent.position.x, parent.position.y);
            //  g.lineTo(point.position.x, point.position.y);
            //});
            //g.stroke();
            
            if (point.parent)
            {
              g.beginPath();
              g.moveTo(point.parent.position.x, point.parent.position.y);
              g.lineTo(point.position.x, point.position.y);
              g.stroke();
              
              if (point.sum > point.weight)
              {
                var size = 1 + point.sum;
                g.strokeRect(point.position.x-size, point.position.y-size, size*2+1, size*2+1);
              }
            }
          }
        });
      });
      
      g.restore();
    }
  }
  
  class BoundingBox
  {
    constructor()
    {
      this.min = new v2(Infinity, Infinity);
      this.max = new v2(-Infinity, -Infinity);
      this.children = [];
    }
    
    addPoint(point)
    {
      this.min.min(point);
      this.max.max(point);
    }
    
    addBoundingBox(box)
    {
      this.min.min(box.min);
      this.max.max(box.max);
      
      this.children.push(box);
    }
    
    contains(point)
    {
      if (this.min.x<point.x && this.min.y<point.y && this.max.x>point.x && this.max.y>point.y)
      {
        if (!this.children.length)
        {
          return true;
        }
        else
        {
          for (var child of this.children)
          {
            if (child.contains(point))
            {
              return true;
            }
          }
        }
      }
      
      return false;
    }
    
    get size()
    {
      return this.max.dup().mad(this.min, -1).max(v2.zero);
    }
    
    draw(g)
    {
      g.strokeRect(this.min.x, this.min.y, this.max.x-this.min.x, this.max.y-this.min.y);
      
      this.children.forEach((child) =>
      {
        child.draw(g);
      });
    }
  }
  
  class BoundingSphere
  {
    constructor(center, radius)
    {
      this.center = center;
      this.radius = radius;
      this.children = [];
    }

    mergeSpheres(sphere1, sphere2)
    {
      var dir = sphere1.center.dup().mad(sphere2.center, -1);
      var dirLen = dir.length();
      this.radius = (dirLen + sphere1.radius + sphere2.radius) / 2;
      this.center = sphere2.center.dup().mad(dir, (this.radius - sphere2.radius) / dirLen);

      this.children.push(sphere1);
      this.children.push(sphere2);
    }
    
    contains(point)
    {
      var dist = point.dup().mad(this.center, -1).length();
      if (dist < this.radius)
      {
        if (!this.children.length)
        {
          return true;
        }
        else
        {
          for (var child of this.children)
          {
            if (child.contains(point))
            {
              return true;
            }
          }
        }
      }
      
      return false;
    }
    
    get size()
    {
      return this.max.dup().mad(this.min, -1).max(v2.zero);
    }
    
    draw(g)
    {
      g.beginPath();
      g.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, false);
      g.stroke();
      
      this.children.forEach((child) =>
      {
        child.draw(g);
      });
    }
  }
  
  class Snake
  {
    constructor(snake)
    {
      this.id = snake.id;
      this.size = snake.tl;

      this.speed = snake.sp * 32;
      this.racing = snake.tsp > snake.fsp;

      this.angle = snake.ang;
      this.heading = new v2(
        Math.cos(this.angle),
        Math.sin(this.angle)
      );

      this.head = new v2(snake.xx, snake.yy);
      this.tail = snake.pts
      .filter((point)=>
      {
        return !point.dying;
      })
      .map((point, i, a)=>
      {
        var out = new v2(point.xx, point.yy);
        
        var last = a[i-1] || point;
        var next = a[i+1] || point;
        
        out.tangent = new v2(last.xx - next.xx, last.yy - next.yy).unit();
        
        return out;
      });
      
      this.speed = snake.sp * 32;
      this.angle = snake.ang;
      this.heading = new v2(
        Math.cos(this.angle),
        Math.sin(this.angle)
      );
      
      this.racing = snake.tsp > snake.fsp;

      if(__state.use_boxes)
      {
        this.bounds = new BoundingBox();
        this.createBoundsBox();
      }
      else
      {
        this.bounds = new BoundingSphere(v2.zero, Infinity);
        this.createBoundsSphere();
      }
    }
    
    createBoundsBox()
    {
      var parts = [];
      
      var region = new v2(80, 80);
      
      var box = null;
      this.tail.forEach((point, i) =>
      {
        if ((i%5) == 0)
        {
          box = new BoundingBox();
          parts.push(box);
        }
        
        point = point.dup();
        
        box.addPoint(point.mad(region, -1));
        box.addPoint(point.mad(region, 2));
      });

      var head = this.head.dup();
      var heading = this.heading.dup();
      var right = heading.dup().right();
      //var front = head.dup().mad(heading.dup(), 200 + (this.racing ? 100 : 0) + window.snake.tl / 1.5);
      var maxFront = 200 + (this.racing ? 100 : 0) + window.snake.tl / 1.5;
      var oldHead = head.dup();

      for(var i = 1; i <= 5; i++)
      {

        var box = new BoundingBox();
        parts.push(box);
        var front = head.dup().mad(heading, maxFront / 5 * i);

        box.addPoint(oldHead.dup().mad(right, 40));
        box.addPoint(oldHead.dup().mad(right, -40));
        box.addPoint(front.dup().mad(right, 40));
        box.addPoint(front.dup().mad(right, -40));
        oldHead = front.dup();
      }
      
      while (parts.length > 1)
      {
        var box = new BoundingBox();
        box.addBoundingBox(parts.shift());
        box.addBoundingBox(parts.shift());
        
        parts.push(box);
      }
      
      if (parts[0])
      {
        this.bounds = parts[0];
      }
    }

    createBoundsSphere()
    {
      var parts = [];

      var sphere = new BoundingSphere(this.head.dup(), 60);
      parts.push(sphere);
      
      this.tail.forEach((point, i) =>
      {
        if(i % 4 == 0)
          {
            var sphere = new BoundingSphere(point.dup(), 60);
            parts.push(sphere);
          }
      });

      var head = this.head;
      var heading = this.heading;
      var maxFront = 200 + (this.racing ? 100 : 0) + window.snake.tl / 1.5;

      for(var i = 0; i < 5; i++)
      {
        var front = head.dup().mad(heading, maxFront / 5 * i);
        var sphere = new BoundingSphere(front, maxFront / 10);
        parts.push(sphere);
      }
      
      while (parts.length > 1)
      {
        var sphere = new BoundingSphere();
        sphere.mergeSpheres(parts.shift(), parts.shift());
        parts.push(sphere);
      }
      
      if (parts[0])
      {
        this.bounds = parts[0];
      }
    }

    draw(g)
    {
      g.beginPath();
      g.arc(this.head.x, this.head.y, this.size, 0, Math.PI * 2, false);
      g.stroke();
    }
  }
    
    
  
  var __state =
  {
    //probe: new Probe(7, 50, 4, 6),
    probe: new Probe(16, 50, 6, 8),
    snakes: [],
    pos: new v2(),
    speed: 0,
    racing: true,
    probeRacing: true,
    doRacing: false,
    show_only_best_probe: true,
    show_bounds: true,
    use_boxes: true,
  };
  window.__state = __state;
  
  hj_objects.length = 0;
  hj_objects.push(__state.probe);

  if (__state.show_bounds)
  {
    hj_objects.push(
    {
      draw: function(g)
      {
        g.strokeStyle="#f0f";
        __state.snakes.forEach((snake) =>
        {
          snake.bounds.draw(g);
          snake.draw(g);
        });
      },
    });
  }
  
  window.xxx_iv_=setInterval(function()
  {
    if (!window.snake) return;

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
      var out = new Snake(snake);
      
      objects.set(out.id, out);
      
      return out;
    });

    var preys = window.preys
    .filter((food)=>food)
    .map((food)=>
    {
      var out = new v2(food.xx, food.yy);
      
      out.id = food.id;
      out.size = food.sz;
      
      objects.set(out.id, out);
      
      return out;
    });

    if (window.snake.tl < 9)
    {
      preys.length = 0;
    }
    
    __state.snakes = snakes;
    
    var me = objects.get(window.snake.id);
    if (!me)
    {
      return;
    }


    __state.preys = preys;

    var newProbe = new Probe(16, Math.max(50, window.snake.tl), 6, 8);
    hj_objects[hj_objects.indexOf(__state.probe)] = newProbe;
    __state.probe = newProbe;
    __state.probe.center.set(me.head);
    __state.probe.angle = me.angle;
    __state.probe.heading = me.heading;
    

    __state.probe.reset();
    for (var point of __state.probe.iter())
    {
      var position = __state.probe.getGlobalPosition(point.position);
      
      for (var _snake of snakes)
      {
        if (_snake != me && _snake.bounds.contains(position))
        {
          point.blocked = true;
          break;
        }
      }
    }
    foods.forEach((food) =>
    {
      __state.probe.addFood(food);
    });
    preys.forEach((prey) =>
    {
      __state.probe.addPrey(prey);
    });
    __state.probe.trace();


    var best = __state.probe.traceBack();
    
    if (best[0])
    {
      var offset = best[0].mad(me.head, -1).mul(10);
      
      xm = offset.x;
      ym = offset.y;
    }

    var longEnough = true; // TODO: minimum snake length for racing
    var lastDoRacing = __state.doRacing;
    __state.doRacing = false;

    if(__state.racing)
    {
      var nearbyRacingSnake = snakes.reduce((out, other) =>
      {
        if(other == me || out)
          return out;

        if(me.head.dup().mad(other.head, -1).length() < 150 && other.racing)
          return true;

        return false;
      }, false);

      if (nearbyRacingSnake)
      {
        __state.doRacing = true;
      }
    }

    if (__state.probeRacing)
    {
      if (__state.probe.bestNode && __state.probe.bestNode.needsRacing)
      {
        __state.doRacing = true;
      }
    }

    if (!longEnough)
    {
      __state.doRacing = false;
    }

    if (lastDoRacing != __state.doRacing)
    {
      snake.wmd = __state.doRacing;
    }
    
    var delta = me.head.dup().mad(__state.pos, -1);
    if (delta.length() < 100)
    {
      __state.speed = __state.speed * 0.95 + delta.length() * 0.05 / 0.1;
    }
    __state.pos = me.head;
  }, 10);

})();