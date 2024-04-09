# Need to patch
    - getMonsterDropsHTML()
    - dropEnemyLoot()
    - let {item, quantity} = monster.lootTable.getDrop() // Don't need to modify this, already handled in dropEnemyLoot
    - vw = 1000
    - w = 500
    - try to add 750
    - vw - w = 500 so first thing fails, set w to vw
    - if try to add 400, then vw - w = and 400 <= 500 is true, so set w to be 500 + 400
    - Monster.constructor()
    - Modify all monster drop tables:        
        game.monsters.forEach(monster => { 
            const newWeight = monster.lootTable.weight * (100 - monster.lootChance)
            monster.lootTable.drops = monster. lootTable.drops * monster.lootChance // Modify all weights by their loot chance
            monster.lootTable.drops = [...monster.lootTable.drops, {item: game.items.getObjectByID("melvorD:Empty_Equipment"), maxQuantity: 0, minQuantity: 0, weight: newWeight}] // Add empty drop
            delete monster.lootChance // Delete lootChance so that Melvor crashes if something tries to read it (then go fix the crash).
            monster.lootTable.weight = monster.lootTable.drops.reduce((accumulated, current) => accumulated + current?.weight || 0, 0) 
        }
    w/T × n/100
    - Pull drop chance from empty drop table first, spillover just gets added regularly
        const emptyDrop = monster.lootTable.drops.find(drop => drop.id === "melvorD:Empty_Equipment")
        if(newItem.weight <= emptyDrop.weight) { // Transfer empty drop's weight to the new item
            emptyDrop.weight -= newItem.weight
        } else { // The new item takes up more weight than the empty drop, so remove empty drop entirely
            emptyDrop.weight = 0
        }
        monster.lootTable.drops = [...monster.lootTable.drops, {item: game.objects.getItemByID(newItem.id), maxQuantity: newItem.maxQuantity, minQuantity: newItem.minQuantity, weight: newItem.weight}] // Add new item. If there were empty drops before, the new item takes up empty drop slots. If there were no empty drops, or empty drops have been fully used up already, then the addition of this item reduces the drop rate of all other items (by increasing the total weight in the next step).
        monster.lootTable.weight = monster.lootTable.drops.reduce((accumulated, current) => accumulated + current?.weight || 0, 0) // Recalculate totalWeight given that empty drop has been reduced 

    dropEnemyLoot(monster) {
        if (!this.game.tutorial.complete)
            return;
        let {item, quantity} = monster.lootTable.getDrop();
        if(item === game.items.getObjectByID("melvorD:Empty_Equipment"))
            return;
        const herbItem = this.game.farming.getHerbFromSeed(item);
        if (herbItem !== undefined) {
            if (rollPercentage(this.player.modifiers.increasedChanceToConvertSeedDrops)) {
                item = herbItem;
                quantity += 3;
            }
        }
        if (rollPercentage(this.player.modifiers.combatLootDoubleChance))
            quantity *= 2;
        const autoLooted = this.player.modifiers.autoLooting && this.bank.addItem(item, quantity, false, true, false, true, `Monster.${monster.id}`);
        if (autoLooted) {
            this.addCombatStat(CombatStats.ItemsLooted, quantity);
        } else {
            let stack = false;
            if (this.player.modifiers.allowLootContainerStacking > 0)
                stack = true;
            this.loot.add(item, quantity, stack);
        }
        const event = new MonsterDropEvent(item,quantity,herbItem !== undefined);
        this._events.emit('monsterDrop', event);
        
    }

    get sortedDropsArray() {
        return [...this.drops.filter(drop => drop.id !== "melvorD:Empty_Equipment")].sort((a,b) => b.weight - a.weight);
    }

    getMonsterDropsHTML(monster, respectArea) {
        let drops = '';
        if (monster.lootTable.size > 1 && !(respectArea && this.areaType === CombatAreaType.Dungeon)) { // Modified "lootTable.size > 0" to be "lootTable.size > 1" because I'm adding an empty drop to every drop table
            drops = monster.lootTable.sortedDropsArray.map((drop)=>{
                let dropText = templateLangString('BANK_STRING_40', {
                    qty: `${drop.maxQuantity}`,
                    itemImage: `<img class="skill-icon-xs mr-2" src="${drop.item.media}">`,
                    itemName: drop.item.name,
                });
                if (DEBUGENABLED)
                    dropText += ` (${(drop.weight / monster.lootTable.weight).toFixed(2)}%) (1 in ${(1 / (drop.weight / monster.lootTable.weight / 100)).toFixed(1)})`;
                return dropText;
            }
            ).join('<br>');
        }
        let bones = '';
        const dropsBones = monster.bones !== undefined && !(respectArea && this.selectedArea instanceof Dungeon && !this.selectedArea.dropBones);
        const dropsBarrierDust = monster.hasBarrier;
        if (dropsBarrierDust || dropsBones) {
            bones = `${getLangString('MISC_STRING_7')}`;
            if (dropsBones && monster.bones !== undefined) {
                bones += `<br><img class="skill-icon-xs mr-2" src="${monster.bones.item.media}">${monster.bones.item.name}`;
            }
            if (dropsBarrierDust) {
                const barrierDustItem = this.game.items.getObjectByID("melvorAoD:Barrier_Dust");
                if (barrierDustItem !== undefined) {
                    bones += `<br><img class="skill-icon-xs mr-2" src="${barrierDustItem.media}">${barrierDustItem.name}`;
                }
            }
            bones += `<br><br>`;
        } else {
            bones = getLangString('COMBAT_MISC_107') + '<br><br>';
        }
        let html = `<span class="text-dark">${bones}<br>`;
        if (drops !== '') {
            html += `${getLangString('MISC_STRING_8')}<br><small>${getLangString('MISC_STRING_9')}</small><br>${drops}`;
        }
        html += '</span>';
        return html;
    }

T' = T + x
T = 60
n = 35 => 35/100
w = [30, 20, 10]
w' = [30, 20, 10, 420/13]
w''' = [390, 260, 130, 420]
x/T' = n/100
T' = T + x
x/(T+x) = (100-n)/100
100x = (100-n)(T+x)
100x = T(100-n) + x(100-n)
100x + x(n-100) = T(100-n)
nx = T(100-n)
x = T(100-n)/n ####################### Important

// 100x = Tn + nx
// x(100-n) = Tn
// x = Tn/(100 - n)

// w'' = (100-n)w = [(100-n)w1, (100-n)w2, ..., Tn] = [1950, 1300, 650, 2100]
// T'' = 6000
// w1''/T'' = 13/40

------------------
n = 40
w = [30, 20, 10]
w' = [30, 20, 10, 90]
T' = 60 + 90 = 150
30/150 = 30/60 × 40/100
1/5 == 1/5
✔️✔️✔️✔️✔️
------------------
n = 35
w = [30, 20, 10]
x = T(100-n)/n = 60 × 65 / 35 = 780 / 7
w' = [30, 20, 10, 780/7]
T' = 60 + 780/7 = 171 + 3/7
30/(171+3/7) = 30/60 × 35/100
7/40 = 7/40
✔️✔️✔️✔️✔️

I can either use the GCD algorithm to modify all loot weights