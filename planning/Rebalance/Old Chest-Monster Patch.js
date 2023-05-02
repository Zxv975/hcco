const patchChestDropTable = (chestID, itemsToReduce, itemsToAdd) => {
    game.items.getObjectByID(chestID).dropTable.drops.forEach(x => {
        if (itemsToReduce.map(x => x.item.id).includes(x.item.id))
            x.weight -= itemsToReduce.filter(y => y.item.id == x.item.id)[0].weight
    })
    game.items.getObjectByID(chestID).dropTable.drops = [...game.items.getObjectByID(chestID).dropTable.drops, ...itemsToAdd]
}
const unpatchChestDropTable = (chestID, itemsToUnpatch, itemsToRemove) => {
    game.items.getObjectByID(chestID).dropTable.drops.forEach(x => {
        if (itemsToUnpatch.map(x => x.item.id).includes(x.item.id))
            x.weight += itemsToUnpatch.filter(y => y.item.id == x.item.id)[0].weight
    })
    game.items.getObjectByID(chestID).dropTable.drops = game.items.getObjectByID(chestID).dropTable.drops.filter(x => !itemsToRemove.map(x => x.item.id).includes(x.item.id))
}
const patchMonsterLootTable = (monsterID, itemsToReduce, itemsToAdd) => {
    game.monsters.getObjectByID(monsterID).lootTable.drops.forEach(x => {
        if (itemsToReduce.map(y => y.item.id).includes(x.item.id))
            x.weight -= itemsToReduce.filter(y => y.item.id == x.item.id)[0].weight
    })
    game.monsters.getObjectByID(monsterID).lootTable.drops = [...game.monsters.getObjectByID(monsterID).lootTable.drops, ...itemsToAdd]
}
const unpatchMonsterLootTable = (monsterID, itemsToUnpatch, itemsToRemove) => {
    game.monsters.getObjectByID(monsterID).lootTable.drops.forEach(x => {
        if (itemsToUnpatch.map(y => y.item.id).includes(x.item.id))
            x.weight += itemsToUnpatch.filter(y => y.item.id == x.item.id)[0].weight
    })
    game.monsters.getObjectByID(monsterID).lootTable.drops = game.monsters.getObjectByID(monsterID).lootTable.drops.filter(x => !itemsToRemove.map(x => x.item.id).includes(x.item.id))
}

const patchChestDropTable = (baseItemsToModify, newItemsToInclude, chestOrMonster, lootDropperID, patchFlag) => {
    if (chestOrMonster == 'chest') {
        let lootDropperKey = 'chest'
        let tableKey = 'dropTable'
    } else if (chestOrMonster == 'monster') {
        let lootDropperKey = 'monsters'
        let tableKey = 'lootTable'
    } else {
        throw new Error('Parameter 3 must be either `chest` or `monster`')
    }

    game[lootDropperKey].getObjectByID(lootDropperID)[tableKey].drops.forEach(x => {
        if (baseItemsToModify.map(x => x.item.id).includes(x.item.id))
            x.weight = x.weight + Math.pow(-1, patchFlag) * baseItemsToModify.filter(y => y.item.id == x.item.id)[0].weight
    })
    if (patchFlag) game[lootDropperKey].getObjectByID(lootDropperID)[tableKey].drops = [...game[lootDropperKey].getObjectByID(lootDropperID)[tableKey].drops, ...newItemsToInclude]
    else game[lootDropperKey].getObjectByID(lootDropperID)[tableKey].drops = game[lootDropperKey].getObjectByID(lootDropperID)[tableKey].drops.filter(x => !newItemsToInclude.map(x => x.item.id).includes(x.item.id))
}