///////////////////////////////////////////////////////////////////////////////////////////////////
// Simple Delaunay Lib https://raw.githubusercontent.com/ironwallaby/delaunay/master/delaunay.js //
///////////////////////////////////////////////////////////////////////////////////////////////////

var Delaunay;

(function() {
  "use strict";

  var EPSILON = 1.0 / 1048576.0;

  function supertriangle(vertices) {
    var xmin = Number.POSITIVE_INFINITY,
        ymin = Number.POSITIVE_INFINITY,
        xmax = Number.NEGATIVE_INFINITY,
        ymax = Number.NEGATIVE_INFINITY,
        i, dx, dy, dmax, xmid, ymid;

    for(i = vertices.length; i--; ) {
      if(vertices[i][0] < xmin) xmin = vertices[i][0];
      if(vertices[i][0] > xmax) xmax = vertices[i][0];
      if(vertices[i][1] < ymin) ymin = vertices[i][1];
      if(vertices[i][1] > ymax) ymax = vertices[i][1];
    }

    dx = xmax - xmin;
    dy = ymax - ymin;
    dmax = Math.max(dx, dy);
    xmid = xmin + dx * 0.5;
    ymid = ymin + dy * 0.5;

    return [
      [xmid - 20 * dmax, ymid -      dmax],
      [xmid            , ymid + 20 * dmax],
      [xmid + 20 * dmax, ymid -      dmax]
    ];
  }

  function circumcircle(vertices, i, j, k) {
    var x1 = vertices[i][0],
        y1 = vertices[i][1],
        x2 = vertices[j][0],
        y2 = vertices[j][1],
        x3 = vertices[k][0],
        y3 = vertices[k][1],
        fabsy1y2 = Math.abs(y1 - y2),
        fabsy2y3 = Math.abs(y2 - y3),
        xc, yc, m1, m2, mx1, mx2, my1, my2, dx, dy;

    /* Check for coincident points */
    if(fabsy1y2 < EPSILON && fabsy2y3 < EPSILON)
      throw new Error("Eek! Coincident points!");

    if(fabsy1y2 < EPSILON) {
      m2  = -((x3 - x2) / (y3 - y2));
      mx2 = (x2 + x3) / 2.0;
      my2 = (y2 + y3) / 2.0;
      xc  = (x2 + x1) / 2.0;
      yc  = m2 * (xc - mx2) + my2;
    }

    else if(fabsy2y3 < EPSILON) {
      m1  = -((x2 - x1) / (y2 - y1));
      mx1 = (x1 + x2) / 2.0;
      my1 = (y1 + y2) / 2.0;
      xc  = (x3 + x2) / 2.0;
      yc  = m1 * (xc - mx1) + my1;
    }

    else {
      m1  = -((x2 - x1) / (y2 - y1));
      m2  = -((x3 - x2) / (y3 - y2));
      mx1 = (x1 + x2) / 2.0;
      mx2 = (x2 + x3) / 2.0;
      my1 = (y1 + y2) / 2.0;
      my2 = (y2 + y3) / 2.0;
      xc  = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
      yc  = (fabsy1y2 > fabsy2y3) ?
        m1 * (xc - mx1) + my1 :
        m2 * (xc - mx2) + my2;
    }

    dx = x2 - xc;
    dy = y2 - yc;
    return {i: i, j: j, k: k, x: xc, y: yc, r: dx * dx + dy * dy};
  }

  function dedup(edges) {
    var i, j, a, b, m, n;

    for(j = edges.length; j; ) {
      b = edges[--j];
      a = edges[--j];

      for(i = j; i; ) {
        n = edges[--i];
        m = edges[--i];

        if((a === m && b === n) || (a === n && b === m)) {
          edges.splice(j, 2);
          edges.splice(i, 2);
          break;
        }
      }
    }
  }

  Delaunay = {
    triangulate: function(vertices, key) {
      var n = vertices.length,
          i, j, indices, st, open, closed, edges, dx, dy, a, b, c;

      /* Bail if there aren't enough vertices to form any triangles. */
      if(n < 3)
        return [];

      /* Slice out the actual vertices from the passed objects. (Duplicate the
       * array even if we don't, though, since we need to make a supertriangle
       * later on!) */
      vertices = vertices.slice(0);

      if(key)
        for(i = n; i--; )
          vertices[i] = vertices[i][key];

      /* Make an array of indices into the vertex array, sorted by the
       * vertices' x-position. */
      indices = new Array(n);

      for(i = n; i--; )
        indices[i] = i;

      indices.sort(function(i, j) {
        return vertices[j][0] - vertices[i][0];
      });

      /* Next, find the vertices of the supertriangle (which contains all other
       * triangles), and append them onto the end of a (copy of) the vertex
       * array. */
      st = supertriangle(vertices);
      vertices.push(st[0], st[1], st[2]);
      
      /* Initialize the open list (containing the supertriangle and nothing
       * else) and the closed list (which is empty since we havn't processed
       * any triangles yet). */
      open   = [circumcircle(vertices, n + 0, n + 1, n + 2)];
      closed = [];
      edges  = [];

      /* Incrementally add each vertex to the mesh. */
      for(i = indices.length; i--; edges.length = 0) {
        c = indices[i];

        /* For each open triangle, check to see if the current point is
         * inside it's circumcircle. If it is, remove the triangle and add
         * it's edges to an edge list. */
        for(j = open.length; j--; ) {
          /* If this point is to the right of this triangle's circumcircle,
           * then this triangle should never get checked again. Remove it
           * from the open list, add it to the closed list, and skip. */
          dx = vertices[c][0] - open[j].x;
          if(dx > 0.0 && dx * dx > open[j].r) {
            closed.push(open[j]);
            open.splice(j, 1);
            continue;
          }

          /* If we're outside the circumcircle, skip this triangle. */
          dy = vertices[c][1] - open[j].y;
          if(dx * dx + dy * dy - open[j].r > EPSILON)
            continue;

          /* Remove the triangle and add it's edges to the edge list. */
          edges.push(
            open[j].i, open[j].j,
            open[j].j, open[j].k,
            open[j].k, open[j].i
          );
          open.splice(j, 1);
        }

        /* Remove any doubled edges. */
        dedup(edges);

        /* Add a new triangle for each edge. */
        for(j = edges.length; j; ) {
          b = edges[--j];
          a = edges[--j];
          open.push(circumcircle(vertices, a, b, c));
        }
      }

      /* Copy any remaining open triangles to the closed list, and then
       * remove any triangles that share a vertex with the supertriangle,
       * building a list of triplets that represent triangles. */
      for(i = open.length; i--; )
        closed.push(open[i]);
      open.length = 0;

      for(i = closed.length; i--; )
        if(closed[i].i < n && closed[i].j < n && closed[i].k < n)
          open.push(closed[i].i, closed[i].j, closed[i].k);

      /* Yay, we're done! */
      return open;
    },
    contains: function(tri, p) {
      /* Bounding box test first, for quick rejections. */
      if((p[0] < tri[0][0] && p[0] < tri[1][0] && p[0] < tri[2][0]) ||
         (p[0] > tri[0][0] && p[0] > tri[1][0] && p[0] > tri[2][0]) ||
         (p[1] < tri[0][1] && p[1] < tri[1][1] && p[1] < tri[2][1]) ||
         (p[1] > tri[0][1] && p[1] > tri[1][1] && p[1] > tri[2][1]))
        return null;

      var a = tri[1][0] - tri[0][0],
          b = tri[2][0] - tri[0][0],
          c = tri[1][1] - tri[0][1],
          d = tri[2][1] - tri[0][1],
          i = a * d - b * c;

      /* Degenerate tri. */
      if(i === 0.0)
        return null;

      var u = (d * (p[0] - tri[0][0]) - b * (p[1] - tri[0][1])) / i,
          v = (a * (p[1] - tri[0][1]) - c * (p[0] - tri[0][0])) / i;

      /* If we're outside the tri, fail. */
      if(u < 0.0 || v < 0.0 || (u + v) > 1.0)
        return null;

      return [u, v];
    }
  };

  if(typeof module !== "undefined")
    module.exports = Delaunay;
})();

////////////////////////////////
// End of Simple Delaunay Lib //
////////////////////////////////

this.getMoney = function(){
    var targets = this.findItems();
    var money = {
        bronze: [],
        silver: [],
        gold: [],
        gems: []
    };
    for(var i = 0; i < targets.length; i++){
        if (String(targets[i]).includes('Gem')) {
            money.gems.push(targets[i]);
        }
        if (String(targets[i]).includes('Gold Coin')) {
            money.gold.push(targets[i]);
        }
        if (String(targets[i]).includes('Silver Coin')) {
            money.silver.push(targets[i]);
        }
        if (String(targets[i]).includes('Bronze Coin')) {
            money.bronze.push(targets[i]);
        }
    }
    return money;
};

function connectionMap(items, triangles){
  this.items = items;
  this.triangles = triangles;
  this.getConnectionsFrom()
}

this.getItemMesh(){
  var items = this.findItems();
  var itemVerts = [];
  for (var i = 0; i < items.length; i++) {
    itemVerts.push([items[i].pos.x,items[i].pos.y]);
  }

  var triangles = Delaunay.triangulate(vertices);

  for (var i = 0; i < triangles.length; i++) {
    items[i]
  };
  
  for(var i = triangles.length; i >= 0; ) {
    ctx.beginPath();
    --i;
    ctx.moveTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
    --i;
    ctx.lineTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
    --i;
    ctx.lineTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
    ctx.closePath();
    ctx.stroke();
  }
}

// Defeat the enemy hero in two minutes.
loop {
    var enemies = this.findEnemies();
    var nearestEnemy = this.findNearest(enemies);
    
    // Your hero can collect coins and summon troops.
    while (this.gold > this.costOf("soldier")) {
        this.summon("soldier");
    }

    if(hero.findCorpses().length>0 && hero.canCast("raise-dead", hero.findCorpses()[hero.findCorpses().length-1])){
        hero.cast("raise-dead", hero.findCorpses()[hero.findCorpses().length-1]);
    }

    // She also commands your allies in battle.
    var friends = this.findFriends();
    var enemeyTarget = null;
    var enemeyTargets = [];
    
    //Get Data
    for (var friendIndex = 0; friendIndex < friends.length; ++friendIndex) {
        enemeyTargets[friendIndex] = {};
        enemeyTargets[friendIndex].target = friends[friendIndex].findNearest(enemies);
        enemeyTargets[friendIndex].dist = friends[friendIndex].distanceTo(enemeyTargets[friendIndex].target);
        enemeyTargets[friendIndex].count = 0; //for use later
        enemeyTargets[friendIndex].amount = 1; //for use later
    }
    
    //Count same enemeyTargets
    for (var i = 0; i < enemeyTargets.length; i++) {
            for (var ii = 0; ii < enemeyTargets.length; ++ii) 
                if(enemeyTargets[ii].target == enemeyTargets[i].target)
                    enemeyTargets[ii].count++;
    }
    
    //collapse array to only have one of each target
    var colapsedTargets = [];
    for (var ci = 0; ci < enemeyTargets.length; ci++) {
        //check if in colapsed already
        var inArr = false;
        for(var cii = 0; cii < colapsedTargets.length; cii++)
            if (colapsedTargets[cii] == enemeyTargets[ci]){
                inArr = true;
                break;
            }
        
        if(!inArr){
            //add if not
            colapsedTargets.push(enemeyTargets[ci]);
        } else{
            //skip if so but use smallest distance
            if(colapsedTargets[cii].dist>enemeyTargets[ci].dist)
                colapsedTargets[cii].dist = enemeyTargets[ci].dist;
            colapsedTargets[cii].amount++;
        }
    }
    
    //pick target
    var highestAmount = 0;
    var entrysAtAmount = 0;
    
    for (var cha = 0; cha < colapsedTargets.length; cha++) {
        if(colapsedTargets[highestAmount].amount<colapsedTargets[cha]){
            highestAmount = cha;
            entrysAtAmount = 1;
            //target = colapsedTargets[cha];
        } else if(colapsedTargets[highestAmount].amount==colapsedTargets[cha]){
            entrysAtAmount++;
            highestAmount = cha;
            //target = colapsedTargets[cha];
        }
    }
    
    var closest = 0;
    if(entrysAtAmount>1){
        this.say("more");
        //check distance
        for (var cd = 0; cd < colapsedTargets.length; cd++) {
            if(colapsedTargets[cd].amount==highestAmount){
                if(colapsedTargets[cd].dist < colapsedTargets[closest].dist){
                    closest = cd;
                }
            }
        }
        enemeyTarget = colapsedTargets[closest].target;
    } else {
        //this.say("one");
        if(colapsedTargets[highestAmount]) enemeyTarget = colapsedTargets[highestAmount].target;
    }
    
    
    //everyone attack it
    for (var fi = 0; fi < friends.length; ++fi)
        this.command(friends[fi], "attack", enemeyTarget);
    
    // Use your hero's abilities to turn the tide.
    

    /*
    var targets = this.findItems();
    //this.say(targets[targets.length-1]);
    if(targets.length > 0){
        var target = targets[0];
        for(var it = 0; it < targets.length; it++){
            //this.say(String(targets[it])+"= "+targets[it].bountyGold);
            if(targets[it].bountyGold > target.bountyGold){
                target = targets[it];
            } else if(targets[it].bountyGold == target.bountyGold || this.distanceTo(target) > this.distanceTo(targets[it])){
                target = targets[it];
            }
        }
        this.moveXY(target.pos.x, target.pos.y);
    }
    */

    
    
    var money = this.getMoney();
    //this.say(targets[targets.length-1]);
    var moneyTarget = this.findNearest(money.gems);
    if(moneyTarget){
        this.moveXY(moneyTarget.pos.x, moneyTarget.pos.y);
    } else{
        moneyTarget = this.findNearest(money.gold);
        if(moneyTarget){
            this.moveXY(moneyTarget.pos.x, moneyTarget.pos.y);
        } else{
            moneyTarget = this.findNearest(money.silver);
            if(moneyTarget){
                this.moveXY(moneyTarget.pos.x, moneyTarget.pos.y);
            } else{
                moneyTarget = this.findNearest(money.bronze);
                if(moneyTarget){
                    this.moveXY(moneyTarget.pos.x, moneyTarget.pos.y);
                } else{
                    this.say("Can't Find Money");
                }
            }
        }
    }
}
