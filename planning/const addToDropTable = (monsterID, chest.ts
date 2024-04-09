const addToDropTable = (monsterID, chestOrMonster, patchFlag, newItems) => {
		const { lootDropperKey, tableKey } = chestOrMonsterChecker(chestOrMonster)
		// let dropTable = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops
		let emptyDrop = {}
		if (chestOrMonster === "monster")
			emptyDrop = dropTable.find(drop => drop.item.id === "melvorD:Empty_Equipment")
		else
			emptyDrop = { item: game.items.getObjectByID("melvorD:Empty_Equipment"), weight: 0, vanillaWeight: 0, minQuantity: 0, maxQuantity: 0 }

		newItems.forEach(item => {
			if (patchFlag) {
				if (dropTable.find(drop => drop.item.id === item.id))
					// if (dropTable.map(drop => drop.item.id).includes(newItems.map(drop => drop.id)))
					throw new Error(`The item ${item.id} already exists in drop table for ${monsterID}. Please use the modifyDropTable() function instead to modify existing drops.`)
				if (item.weight <= emptyDrop.weight)
					emptyDrop.weight -= item.weight // Transfer empty drop's weight to the new item
				else
					emptyDrop.weight = 0 // The new item takes up more weight than the empty drop, so remove empty drop entirely

				dropTable = [...dropTable, { item: game.items.getObjectByID(item.id), weight: item.weight, maxQuantity: item.maxQuantity, minQuantity: item.minQuantity }] // Add new item. If there were empty drops before, the new item takes up empty drop slots. If there were no empty drops, or empty drops have been fully used up already, then the addition of this item reduces the drop rate of all other items (by increasing the total weight in the next step).
				// monster.lootTable.drops = [...monster.lootTable.drops, { item: game.objects.getItemByID(newItem.id), maxQuantity: newItem.maxQuantity, minQuantity: newItem.minQuantity, weight: newItem.weight }] 
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight = dropTable.reduce((accumulated, current) => accumulated + current?.weight || 0, 0) // Recalculate totalWeight given that empty drop has been reduced and/or a new drop has been added.
			} else {
				const index = dropTable.map(drop => drop.item.id).indexOf(item.id)
				if (index === -1)
					throw new Error(`The item ${item.id} was not found in the drop table for ${monsterID}, so it cannot be removed. Please make sure the item exists for this monster.`)
				if (item.weight <= emptyDrop.vanillaWeight - emptyDrop.weight)
					emptyDrop.weight += item.weight // Transfer the item's weight back to the empty drop
				else
					emptyDrop.weight = emptyDrop.vanillaWeight
				dropTable = dropTable.toSpliced(index, 1) // Remove the item from the drop table.
				// lootTable = lootTable.filter(drop => drop.item.id === monsterID) // Remove the item from the drop table
			}
		})
	}

	const modifyDropTable = (monsterID, chestOrMonster, patchFlag, itemsToModify) => {
		const { lootDropperKey, tableKey } = chestOrMonsterChecker(chestOrMonster)
		const lootTable = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops

		itemsToModify.forEach(item => {
			let itemInLootTable = lootTable.find(drop => drop.item.id === item.id)
			if (itemInLootTable === undefined)
				throw new Error(`The item ${item.id} does not exist in the drop table for ${monsterID}. Please make sure this monster's drop table includes this item.`)
			if (patchFlag) {
				itemInLootTable.weight += item.weight
				itemInLootTable.minQuantity += item.minQuantity
				itemInLootTable.maxQuantity += item.maxQuantity
			} else {
				itemInLootTable.weight -= item.weight
				itemInLootTable.minQuantity -= item.minQuantity
				itemInLootTable.maxQuantity -= item.maxQuantity
			}
		})
	}