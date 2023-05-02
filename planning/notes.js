// This is in 

if (this.renderQueue.totalProgressModsHCCO) {
	if (this.visibleCompletion === "modsHCCO" && sideBarItem.asideEl !== undefined) // visibleCompletion is important
		sideBarItem.asideEl.textContent = parseProgress(this.totalProgressModsHCCO);
	$('.comp-log-percent-mods-HCCO').text(parseProgress(this.totalProgressModsHCCO));
	$('.comp-log-percent-progress-mods-HCCO').css('width', `${this.totalProgressModsHCCO}%`);
	if (this.totalProgressModsHCCO >= 100) {
		$('.comp-log-comp-percent-toth').addClass('text-success');
		$('.comp-log-comp-percent-toth').addClass('font-w600');
	}
	this.renderQueue.totalProgressModsHCCO = false;
}

// Inside completionLog.js
updateTotalProgress() {
	const previousProgress = this.totalProgressMap.get("melvorTrue");
	const previousProgressFullGame = this.totalProgressMap.get("melvorBaseGame");
	const previousProgressTotH = this.totalProgressMap.get("melvorTotH");
	this.totalProgressMap.set("melvorTrue", this.computeTotalProgressPercent("melvorTrue"));
	this.totalProgressMap.set("melvorBaseGame", this.computeTotalProgressPercent("melvorBaseGame"));
	this.game.registeredNamespaces.forEach((dataNamespace)=>{
		const namespace = dataNamespace.name;
		const totalProgress = this.computeTotalProgressPercent(namespace);
		this.totalProgressMap.set(namespace, totalProgress);
	}
	);
	if (previousProgressFullGame >= 0 && previousProgressFullGame < 100 && this.totalProgressBaseGame >= 100) {
		notifyCompletionYay();
		sendDiscordEvent(3);
	}
	if (cloudManager.hasTotHEntitlement && previousProgressTotH >= 0 && previousProgressTotH < 100 && this.totalProgressTotH >= 100) {
		notifyCompletionTotH();
	}
	
	if (cloudManager.hasTotHEntitlement && previousProgress >= 0 && previousProgress < 100 && this.totalProgressTrue >= 100) {
		notifyCompletionEverything();
	}
	
	this.renderQueue.totalProgressTrue = true;
	this.renderQueue.totalProgressBaseGame = true;
	this.renderQueue.totalProgressTotH = true;
	// NEED TO ADD 	this.renderQueue.totalProgressModsHCCO = true;
	this.game.queueRequirementRenders();
}

// Need to modify Completion class, specifically need to add totalProgressMods() {
//	return this.totalProgressMap.get("hcco");
//}
// Need to modify CompletionMap, add a function "getModded"

ctx.patch(CompletionMap) {
    getCompValue(namespace) {
        switch (namespace) {
        case "melvorBaseGame":
            return this.getSumOfKeys(["melvorD", "melvorF"]);
        case "melvorTrue":
            return this.getSum();
			case "melvorTotH": 
        default:
            return this.get(namespace);
        }
    }
}

// game.completion.visibleCompletion is the variable which tracks what completion type is rendered
// skill.getMaxTotalMasteryLevels(game.completion.visibleCompletion) gets the mastery total for a given skill
// skill.getTotalCurrentMasteryLevels(game.completion.visibleCompletion) gets the current mastery level for a given skill
// MasteryCompletionElement.updateProgress(skill) is going to be useful for hiding the Mastery Tab

Need to add:
     get totalProgressTotH() {
        return this.totalProgressMap.get("melvorTotH");
    }
	to 
	
// Functions to update: filterItemLog, buildCompletionProgress, buildSkillsLog, buildMasteryLog, buildItemLog, buildMonsterLog, buildPetLog, renderQueue
// Classes to update: CompletionMap, CompletionProgress, Completion

arrayToSearch = [1, 2, 3, 4]
valToFind = 3

obj1 = [{
	key1: "a",
	key2: "b",
	key3: [7, 1, 9, obj2 = {key11: "aa", key22: [1, 4, 6]}]
}, {key4: "test"}
]

obj1.filter(elem => arrayToSearch.some(elem.key3.key22))

if (items.filter(x => x.type === 'Seeds' && x.tier === 'Herb').map(x => x["grownItemID"]).includes(id)) return true; // Lucky Herb potion: seeds give their herbs


arr1 = [6, 87, 1, 3]

Array inside object inside array inside object
Want to check if element inside inner array in inside
{[{[]}]}


// buildMonsterLog has to be updated because I don't think we can access monsters in Foggy lake, ever
game.shop.purchases.allObjects.filter(shopItems => shopItems.contains.items.length > 0).filter(combatSkillItem => combatSkillItem.purchaseRequirements ?  combatSkillItem.purchaseRequirements.some(elem => elem.skill.localID == "Defence") : )

shopPurchasesThatGiveItems = game.shop.purchases.allObjects.filter(shopItems => shopItems.contains.items.length > 0) // Array
for(let x in shopPurchasesThatGiveItems)
shopPurchasesThatGiveItems.forEach(
	x => {
		if(x.purchaseRequirements != undefined)
			if(x.purchaseRequirements.some(elem => elem.
	if(x

allowedSkills = 
bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.localID)

shopPurchasesThatGiveItems.filter(elem => elem.purchaseRequirements.skill != undefined && elem.purchaseRequirements.skill.localID == "Attack")
shopPurchasesThatGiveItems.filter(elem => elem.purchaseRequirements.some(x => x.skill != undefined && x.skill.localID == "Attack"))
shopPurchasesThatGiveItems.filter(elem => elem.purchaseRequirements === undefined)


bannedSkills = game.skills.allObjects.filter(x => !x.isCombat)


bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.localID)
game.shop.purchases.allObjects.filter(shopItems => 
	shopItems.contains.items.length > 0
).filter(elem => 
	elem.purchaseRequirements.length == 0 ||
	elem.purchaseRequirements.some(x => 
		x.skill != undefined && 
//		!bannedSkills.some(y => y.includes(x.skill.localID)) 
		!bannedSkills.includes(x.skill.localID)
		|| x.type != undefined 
		&& x.type != "AllSkillLevels") &&
	elem.category != "Township"
)

game.shop.purchases.allObjects.filter(shopItems => 
	shopItems.contains.items.length > 0 // Remove shop items that don't give a bank item
).map(x => 
	[x.id, x.purchaseRequirements] // Condense the object down to the only two properties we care about
).filter(x => 
	x[1].length == 0 || // If no purchase requirements then it's fine
	x[1].some(y => 
		y.skill != undefined &&
		!bannedSkills.includes(y.skill.localID)
	)
)




// SHOP WORKING!!!
bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.localID)
game.shop.purchases.allObjects.filter(shopItems => 
	shopItems.contains.items.length > 0 // Remove shop items that don't give a bank item
).filter(shopItems => 
	shopItems.contains.items.some(y => 
		
	)
	shopItems.purchaseRequirements.length == 0 || // If no purchase requirements then include it
	shopItems.purchaseRequirements.every(reqs => 
		reqs.skill != undefined && 
		!bannedSkills.includes(reqs.skill._localID)
	)
)


[...new Set(
	[
		...game.monsters.allObjects.filter(x => 
	    x.bones != undefined
		).map(x =>
		    x.bones.item.id
		),
		...game.monsters.allObjects.map(x =>
		    x.lootTable.drops.map(y => y.item.id)
		).reduce((prev, curr) => prev.concat(curr)),
		...game.dungeons.allObjects.filter(x =>
		    x.rewards.length == 1
		).map(x =>
		    x.rewards[0].id
		),
		...game.dungeons.allObjects.filter(x =>
		    x.rewards.length > 1
		).map(x =>
			x.rewards[1].id
		),
		...
		game.items.allObjects.filter(x => x.type == "Herb")
	]
)
]


// Bones WORKING
new Set(game.monsters.allObjects.filter(x => 
    x.bones != undefined
).map(x =>
    x.bones.item.id
))

// monster loot working
new Set(game.monsters.allObjects.map(x =>
    x.lootTable.drops.map(y => y.item.id)
).reduce((prev, curr) => prev.concat(curr)))

// Dungeons 
new Set(game.dungeons.allObjects.filter(x =>
    x.rewards.length == 1
).map(x =>
    x.rewards[0].id
))

//Dungeon secondaries
game.dungeons.allObjects.filter(x =>
    x.rewards.length > 1
).map(x =>
	x.rewards[1].id
)

// All herbs are obtainable
game.items.allObjects.filter(x => x.type == "Herb")

// Craftable items


if (game.items.filter(x => x.type === 'Seeds' && x.tier === 'Herb').map(x => x["grownItemID"]).includes(id)) return true; // Lucky Herb potion: seeds give their herbs


new Set(game.monsters.allObjects.map(x => 
	[x.lootTable.drops.map(drop => x.id), x.bones.item.id]
).map(item => )
.flat())
)
game.monsters.allObjects.map(x => 
	x.lootTable.drops
)
game.monsters.allObjects.map(x => x.drops
)


if (items.filter(x => x.type === 'Seeds' && x.tier === 'Herb').map(x => x["grownItemID"]).includes(id)) return true; // Lucky Herb potion: seeds give their herbs


function buildPetLog(game) {
    if (!petLogLoaded) {
        const container = document.getElementById('petlog-container');
        container.textContent = '';
        const baseGameContainer = createElement('div', {
            className: 'row',
            parent: container
        });
        const progressContainer = createElement('div', {
            className: 'col-12',
            parent: baseGameContainer
        });
        buildCompletionProgress(progressContainer, completionLogMenu.petProgress, 'LOG_PETS_DESC');
        const namespaceContainers = new Map();
        game.registeredNamespaces.forEach((namespace)=>{
            switch (namespace.name) {
            case "melvorD":
            case "melvorF":
                namespaceContainers.set(namespace.name, baseGameContainer);
                break;
            default:
                {
                    if (!game.pets.hasObjectInNamespace(namespace.name))
                        break;
                    const newContainer = createElement('div', {
                        className: 'row',
                        parent: container
                    });
                    newContainer.append(createElement('div', {
                        className: 'col-12',
                        children: [createElement('h5', {
                            className: 'mb-1 pt-3',
                            text: namespace.displayName
                        })],
                    }));
                    namespaceContainers.set(namespace.name, newContainer);
                }
            }
        }
        );
        game.pets.forEach((pet)=>{
            var _a;
            const petCompletion = new PetCompletionElement();
            petCompletion.className = 'monster-item no-bg btn-light pointer-enabled m-1 justify-vertical-center pet-log-img-0';
            (_a = namespaceContainers.get(pet.namespace)) === null || _a === void 0 ? void 0 : _a.append(petCompletion);
            petCompletion.updatePet(pet, game);
            completionLogMenu.pets.set(pet, petCompletion);
        }
        );
        petLogLoaded = true;
    }
}
