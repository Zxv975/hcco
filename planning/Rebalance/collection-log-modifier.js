// Old version, not used anymore
// coDrops = new Set( // Using a set to elimnate duplicates, then converting back to an array
//     [
//         ...game.monsters.allObjects.filter(x =>  // Get bones first
//             x.bones != undefined // Remove monsters that don't drop bones
//         ).map(x =>
//             x.bones.item.id // Populate with all bones dropped
//         ),
//         ...game.monsters.allObjects.map(x =>
//             x.lootTable.drops.map(y => y.item.id) // Next we get standard loots
//         ).reduce((prev, curr) => prev.concat(curr)), // Reduce to flatten ragged array
//         ...game.dungeons.allObjects.filter(x => // Dungeon rewards
//             x.rewards.length == 1
//         ).map(x =>
//             x.rewards[0].id
//         ),
//         ...game.dungeons.allObjects.filter(x =>
//             x.rewards.length > 1
//         ).map(x =>
//             x.rewards[1].id
//         ),
//         ...
//         game.items.allObjects.filter(x => x.type == "Herb")
//     ]
// )


getCOItemList = () =>  {
    // Get standard drops first
    let coDrops = new Set( // Using a set to elimnate duplicates
        [
            ...game.monsters.allObjects.filter(x =>  // Get bones first
                x.bones != undefined // Remove monsters that don't drop bones
            ).map(x =>
                x.bones.item.id // Populate with all bones dropped
            ),
            ...game.monsters.allObjects.map(x =>
                x.lootTable.drops.map(y => y.item.id) // Next we get standard loots
            ).reduce((prev, curr) => prev.concat(curr)), // Reduce to flatten ragged array
            ...game.dungeons.allObjects.map(x => // Dungeon rewards
                x.rewards // Remap to rewards as that's all we care about
            ).filter(x =>
                x.length > 0 // Remove dungeons that don't reward anything
            ).flat().map(x =>
                x.dropTable != undefined ? // dropTable is for openable chests
                    x.dropTable.drops.map(y => y.item.id) : // Iterate through chest items and collect ids
                    x.id // Other dungeon rewards that aren't chests, e.g. fire cape, infernal core, etc
            ).flat(),
            ...game.items.allObjects.filter(x => x.type == "Herb").map(x => x.id) // Add all herbs as they can be obtained from Lucky Herb potion from Rancora
        ]
    )
    // Add upgrades to the list
    let currentLength = -1
    while (currentLength != coDrops.size) { // We loop to check upgrade paths that require several steps, e.g. DFS requiring 3 builds
        currentLength = coDrops.size
        upgradeItems = game.bank.itemUpgrades; // Grab all upgradeable items in the game
        upgradeItems2 = []
        upgradeItems.forEach(x => {
            if (x[0].rootItems.every(y => coDrops.has(y.id))) // Check if the root items for the upgrade are CO items
                upgradeItems2.push(x)
        })
        upgradeItems2 = upgradeItems2.map(x => x[0].upgradedItem.id)
        coDrops = new Set([...coDrops, ...upgradeItems2])
    }

    // Add shop items to the list
    // const bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.localID)
    // game.shop.purchases.allObjects.filter(shopItems =>
    //     shopItems.contains.items.length > 0 // Remove shop items that don't give a bank item
    // ).filter(shopItems =>
    //     shopItems.purchaseRequirements.length == 0 || // If no purchase requirements then include it
    //     shopItems.purchaseRequirements.every(reqs =>
    //         reqs.skill != undefined &&
    //         !bannedSkills.includes(reqs.skill._localID)
    //     )
    // )


    const bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)
    let shopItems = game.shop.purchases.allObjects.filter(shopItems =>
        shopItems.contains.items.length > 0 // Remove shop items that don't give a bank item
    ).filter(x => !x.category.isGolbinRaid).filter(x =>
        !x.purchaseRequirements.some(y => y.type == 'TownshipBuilding')
    ).filter(shopItems =>
        shopItems.purchaseRequirements.length == 0 || // If no purchase requirements then include it
        shopItems.purchaseRequirements.every(reqs =>
            !bannedSkills.includes(reqs?.skill?.id)
        )
    )

    // Remove shop items that cannot be purchased as a CO
    currentLength = -1
    while (currentLength != coDrops.size) { // Loop to make sure there aren't shop items that require other shop items to purchase
        currentLength = coDrops.size
        coDrops = new Set([...coDrops, ...shopItems.filter(x =>
            x.costs.items.every(y =>
                coDrops.has(y.item.id) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
            )
        ).map(x => x.contains.items).flat().map(x => x.item.id)])
       // ).map(x => x.id)])
    }

    return coDrops
}


// 1) Add new case to CompletionMap
// 2) Add extra case to CompletionProgress
// FOUND IT: Class Completion, function onload

ctx.patch(CompletionMap, getCompValue).replace((o, namespace) => {
    getCompValue(namespace) {
        switch (namespace) {
            case "melvorBaseGame":
                return this.getSumOfKeys(["melvorD", "melvorF"]);
            case "melvorTrue":
                return this.getSum();
            case "hcco":
                return this.get(namespace);
            default:
                return this.get(namespace);
        }
    }
}
)

game.bank.itemUpgrades.forEach(x => console.log(x[0].rootItems.every))


game.dungeons.allObjects.filter(x => // Dungeon rewards
    x.rewards.length > 0 // Remove dungeons that don't reward anything
).map(x =>
    x.rewards
).forEach(

.map(x =>
    x.dropTable != undefined ?
        x.dropTable.drops.map(y => y.item.id) :
        x.id
)
)
    .item.id

// SHOP WORKING!!!
bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.localID)
game.shop.purchases.allObjects.filter(shopItems =>
    shopItems.contains.items.length > 0 // Remove shop items that don't give a bank item
).filter(shopItems =>
    //    shopItems.contains.items.some(y => ) ||
    shopItems.purchaseRequirements.length == 0 || // If no purchase requirements then include it
    shopItems.purchaseRequirements.every(reqs =>
        reqs.skill != undefined &&
        !bannedSkills.includes(reqs.skill._localID)
    )
)