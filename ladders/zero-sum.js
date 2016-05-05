this.getMoney = function(){
    var targets = this.findItems();
    var money = {
        bronze: [],
        silver: [],
        gold: [],
        gems: [],
        all: [],
        total: 0
    };
    for(var i = 0; i < targets.length; i++){
        targets[i].moneyValue=targets[i].bountyGold?targets[i].bountyGold:targets[i].value
        money.total+=targets[i].moneyValue
        if (String(targets[i]).includes('Gem')) {
            targets[i].moneyType="gem"
            money.gems.push(targets[i]);
        }
        if (String(targets[i]).includes('Gold Coin')) {
            targets[i].moneyType="gold"
            money.gold.push(targets[i]);
        }
        if (String(targets[i]).includes('Silver Coin')) {
            targets[i].moneyType="silver"
            money.silver.push(targets[i]);
        }
        if (String(targets[i]).includes('Bronze Coin')) {
            targets[i].moneyType="bronze"
            money.bronze.push(targets[i]);
        }
        money.all.push(targets[i])
    }
    return money;
};

this.getPathToMoney = function(target){
    //Get Items
    var items = this.findItems();

    //calculate H values
    for (var i = items.length - 1; i >= 0; i--) {
        items[i].astar = {h:items[i].distanceTo(target)/this.maxSpeed()};
    }


};


// 82 x 74

// quadtree fun
function quadtree(plevel, pbounds){
    if(!pbounds) pbounds = {w:82, h:74};
    this.level = 0;
    this.objects = [];
    this.bounds = pbounds;
    this.nodes = [];
};

this.calculateDistanceCost = function(source, target, goal){
    if(goal){ // 2 way calculation
        return (source.distanceTo(target) + target.distanceTo(goal)) / (target.moneyValue + goal.moneyValue);
    } else { // 1 way
        return source.distanceTo(target) / target.moneyValue;
    }
};

this.getMostProfitableDirectMoney = function(money){
    var closestBronze = this.findNearest(money.bronze);
    var closestBronzeDist = this.distanceTo(closestBronze);
    var BronzeScore = closestBronze.moneyValue / closestBronzeDist;
    var closestSilver = this.findNearest(money.silver);
    var closestSilverDist = this.distanceTo(closestSilver);
    var SilverScore = closestSilver.moneyValue / closestSilverDist;
    var closestGold = this.findNearest(money.gold);
    var closestGoldDist = this.distanceTo(closestGold);
    var GoldScore = closestGold.moneyValue / closestGoldDist;
    var closestGem = this.findNearest(money.gems);
    var closestGemDist = this.distanceTo(closestGem);
    var GemScore = closestGem.moneyValue / closestGemDist;

    if(BronzeScore > BronzeScore && BronzeScore > SilverScore && BronzeScore > GoldScore && BronzeScore > GemScore) return closestBronze;
    if(SilverScore > BronzeScore && SilverScore > SilverScore && SilverScore > GoldScore && SilverScore > GemScore) return closestSilver;
    if(GoldScore > BronzeScore && GoldScore > SilverScore && GoldScore > GoldScore && GoldScore > GemScore) return closestGold;
    if(GemScore > BronzeScore && GemScore > SilverScore && GemScore > GoldScore && GemScore > GemScore) return closestGem;
};

this.getSums = function(money){
    /*
    var money = {
        bronze: [],
        silver: [],
        gold: [],
        gems: []
    };
    */
    //var oneCoinWeight = this.distanceTo(this.findNearest(money.))

    for (var i = money.all.length - 1; i >= 0; i--) {
        money.all[i].others = {};
        for (var ii = money.all.length - 1; ii >= 0; ii--) {
            if(ii!=i)
                money.all[i].others.distance += money.all[i].distanceTo(money.all[ii]);
        }
        money.all[i].others.score = money.all[i].others.distance / money.total;
        money.all[i].weight =  this.distanceTo(money.all[i]) / money.all[i].others.score;
        money.all[i].score = this.distanceTo(money.all[i]) / money.all[i].moneyValue;
        this.say("v: "+money.all[i].moneyValue+" d: "+this.distanceTo(money.all[i])+"os: "+money.all[i].others.score+" w: "+money.all[i].weight+" s: "+money.all[i].score)
        //money.all[i].others.score = this.calculateDistanceCost(money.all[i],money.all[ii])
    }
    return money;
};




//
//soldier
//  Cost: 20
//  DPS Pergold: 0.6
//  Health: 200
//  Attack: 6
//  Cool Down: 0.5s
//  Attack Range: 3m
//  Attack DPS: 12
//  Move: 6m/s
//  Acceleration: 100m/s^2
//  Move Type: Running
//archer
//  Cost: 25
//  DPS Pergold: 1.04
//  Health: 30
//  Move Type: Running
//  Move: 9 m/s
//  Acceleration: 100m/s^2
//  Attack: 13
//  Attack Range: 25m
//  Cool Down: 0.5s
//  Attack DPS: 26
//griffin-rider
//  Cost: 50
//  DPS Pergold: 0.8
//  Health: 160
//  Move Type: Flying
//  Move: 20m/s
//  Acceleration: 100m/s^2
//  Attack: 20
//  Attack Range: 20m
//  Cool Down: 0.5s
//  Attack DPS: 40
//peasant
//  Cost: 50
//  DPS Pergold: 
//  Health: 5.5
//  Move Type: running
//  Move: 8m/s
//  Acceleration: 100m/s^2
//  Attack:
//  Attack Range: m
//  Cool Down: s
//  Attack DPS: none
//  Can Build: fire-trap for free, decoy for 25g, and palisades for 15g
//paladin
//  Cost: 80
//  DPS Pergold: 0.625
//  Health: 600
//  Move Type: running
//  Move: 8m/s
//  Acceleration: 100m/s^2
//  Attack: 20
//  Attack Range: 3m
//  Cool Down: 5s
//  Attack DPS: 50
//  Can auto heal targets cooldown 0.5s 30m 150hp, HPS 250hp
//artillery
//  Cost: 75
//  DPS Pergold: 0.925866
//  Health: 100
//  Move Type: rolling
//  Move: 4m/s
//  Acceleration: 100m/s^2
//  Attack: 250
//  Attack Range: 65m
//  Cool Down: 3.6s
//  Attack DPS: 69.44


var summonRotation = ["soldier","soldier","soldier","soldier","soldier",
    "archer","archer", "griffin-rider","archer","archer","archer","archer","archer","archer",
    "griffin-rider", "paladin"]

this.summonStuff = function(stage, rotation){
    var nextSummon = rotation[stage % rotation.length];

    if(this.gold - 20 > this.costOf(nextSummon) * 5)
    while(this.gold - 20 > this.costOf(nextSummon)){
        this.summon(nextSummon);
        stage++;
        nextSummon = rotation[stage % rotation.length];
    }
    return stage;
}

var summons = 0;
// Defeat the enemy hero in two minutes.
loop {
    var enemies = this.findEnemies();
    var nearestEnemy = this.findNearest(enemies);
    

    // Your hero can collect coins and summon troops.
    summons = this.summonStuff(summons, summonRotation);
    /*
    while (this.gold - 20 > this.costOf("soldier")) {
        this.summon("soldier");
        summons++;
    }
    */
    
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

    
    
    //var money = this.getSums(this.getMoney());
    var money = this.getMoney();
    //this.say(targets[targets.length-1]);money.all[i].weight
    var moneyTarget = this.getMostProfitableDirectMoney(money);
    //this.say("M"+money.all.length);
    /*
    for (var mi = money.all.length - 1; mi >= 0; mi--) {
        if(moneyTarget === null || money.all[mi].score < moneyTarget.score){
            moneyTarget = money.all[mi];
        }
    }
    */
    if(moneyTarget === null){
        this.say("Can't Find Money");
    } else {
        this.moveXY(moneyTarget.pos.x, moneyTarget.pos.y);
    }

    /*
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
    */
}
