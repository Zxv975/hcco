export async function setup(ctx) {

	// ## Utility

	function flattenRaggedArray(items) {
		const flat = [];

		items.forEach(item => {
			if (Array.isArray(item)) {
				flat.push(...flattenRaggedArray(item));
			} else {
				flat.push(item);
			}
		});

		return flat;
	}

	function capitalise(s) {
		return s && s[0].toUpperCase() + s.slice(1);
	}


	// Helper patch functions
	ctx.onModsLoaded(ctx => {
		game.gamemodes.getObjectByID("hcco:hcco")["isCO"] = true
		game.gamemodes.getObjectByID("hcco:mcco")["isCO"] = true
		game.gamemodes.getObjectByID("hcco:arcomSpeedrun")["isCO"] = true
		game.gamemodes.getObjectByID("melvorF:HCCOSpeedrun")["isCO"] = true
		game.gamemodes.getObjectByID("melvorAoD:HCCOARSpeedrun")["isCO"] = true
	})

	const coGamemodeCheck = () => { // Check if the user is playing a CO game mode
		return game.currentGamemode.isCO === true
	}

	// const versionNumber = { major: 2, minor: 36 }
	let versionNumber = ctx.version.split(".")
	if (versionNumber === undefined) {
		versionNumber = ["", "", ""]
		console.warn("HCCO version number not set.")
	}

	const buttonNames = {
		rebalance: 'co-rebalance-button-value',
		rebalanceQoL: 'co-re-qol-button-value',
		summoning: 'co-summoning-button-value',
		township: 'co-township-button-value',
		marks: 'co-mark-button-value',
		rerollEnable: 'co-repeatslayer-button-value',
		reroll: 'repeat-slayer-task-checkbox-value',
		oldReroll: 'reroll-slayer-task',
		drops: 'dropsLayout'
	}

	const rebalanceButtonValue = () => ctx.characterStorage.getItem(buttonNames.rebalance) === true
	const rebalanceQoLButtonValue = () => ctx.characterStorage.getItem(buttonNames.rebalanceQoL) === true
	const summoningButtonValue = () => ctx.characterStorage.getItem(buttonNames.summoning) === true
	const townshipButtonValue = () => ctx.characterStorage.getItem(buttonNames.township) === true
	const markButtonValue = () => ctx.characterStorage.getItem(buttonNames.marks) === true
	const rerollEnableButtonValue = () => ctx.characterStorage.getItem(buttonNames.rerollEnable) === true
	const slayerRerollButtonValue = () => ctx.characterStorage.getItem(buttonNames.reroll) === true
	const dropsButtonValue = () => ctx.characterStorage.getItem(buttonNames.drops) === true

	const resetAllCharacterStorage = () => {
		Object.values(buttonNames).forEach(buttonID => ctx.characterStorage.setItem(buttonID, false))
		// ctx.characterStorage.setItem(buttonNames.rebalance, false)
		// ctx.characterStorage.setItem(buttonNames.rebalanceQoL, false)
		// ctx.characterStorage.setItem(buttonNames.summoning, false)
		// ctx.characterStorage.setItem(buttonNames.township, false)
		// ctx.characterStorage.setItem(buttonNames.marks, false)
		// ctx.characterStorage.setItem(buttonNames.rerollEnable, false)
		// ctx.characterStorage.setItem(buttonNames.reroll, false)
		// ctx.characterStorage.setItem(buttonNames.drops, false)
	}

	// const rebalanceButtonValue = () => ctx.settings.section("CO Rebalance").get(`${buttonNames.rebalance}-button`) === true
	// const rebalanceQoLButtonValue = () => ctx.settings.section("CO Rebalance").get(`${buttonNames.rebalanceQoL}-button`) === true
	// const summoningButtonValue = () => ctx.settings.section("CO Rebalance").get(`${buttonNames.summoning}-button`) === true
	// const townshipButtonValue = () => ctx.settings.section("CO Rebalance").get(`${buttonNames.township}-button`) === true
	// const markButtonValue = () => ctx.settings.section("CO Rebalance").get(`${buttonNames.marks}-button`) === true
	// const dropsButtonValue = () => ctx.settings.section("Layout").get(`${buttonNames.drops}-button`) === true

	const maxCapeJSONData = await ctx.loadData('data/mini_max_capes.json')
	const resupplyJSONData = await ctx.loadData('data/resupplies.json')
	const modifierJSONData = await ctx.loadData('data/modifiers.json')
	let dataRegistered = false

	let vanillaDrops = {}
	let vanillaBones = {}
	let modifications = {}
	const fullTaskMap = game.township.tasks.tasks.registeredObjects

	const registerItems = () => {
		if (dataRegistered) {
			console.warn("Data already registered")
			return
		}
		if (!coGamemodeCheck())
			return
		console.warn("Loading CO data packages")

		// User is playing a CO gamemode and the data hasn't already been registered.
		game.registerDataPackage(maxCapeJSONData)
		game.registerDataPackage(resupplyJSONData)
		game.registerDataPackage(modifierJSONData)
		dataRegistered = true
	}

	const chestOrMonsterChecker = (chestOrMonster) => {  // Chests and monsters behave the same but with different keys for whatever reason lol
		let lootDropperKey = ''
		let tableKey = ''
		if (chestOrMonster.toLowerCase() === 'chest') {
			lootDropperKey = 'items'
			tableKey = 'dropTable'
		} else if (chestOrMonster.toLowerCase() === 'monster') {
			lootDropperKey = 'monsters'
			tableKey = 'lootTable'
		} else {
			throw new Error(`${chestOrMonster} must be either 'chest' or 'monster'.`)
		}
		return [lootDropperKey, tableKey]
	}
	const addToDropTable = (monsterID, chestOrMonster, patchFlag, newItems) => {
		const [lootDropperKey, tableKey] = chestOrMonsterChecker(chestOrMonster)
		const totalWeight = game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight
		let emptyDrop = {}
		if (chestOrMonster === "monster")
			emptyDrop = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.find(drop => drop.item.id === "melvorD:Empty_Equipment")
		else
			emptyDrop = { item: game.items.getObjectByID("melvorD:Empty_Equipment"), weight: 0, vanillaWeight: 0, minQuantity: 0, maxQuantity: 0 }

		if (vanillaDrops[monsterID] === undefined) {
			let drops = []
			game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray.forEach(drop => drops.push({ item: drop.item, weight: drop.weight, minQuantity: drop.minQuantity, maxQuantity: drop.maxQuantity }))
			vanillaDrops[monsterID] = { 'drops': drops, 'totalWeight': totalWeight, 'chestOrMonster': chestOrMonster }
		}
		newItems.forEach(item => {
			if (patchFlag) {
				if (game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.find(drop => drop.item.id === item.id))
					// if (dropTable.map(drop => drop.item.id).includes(newItems.map(drop => drop.id)))
					throw new Error(`The item ${item.id} already exists in drop table for ${monsterID}. Please use the modifyDropTable() function instead to modify existing drops.`)
				if (item.weight <= emptyDrop.weight)
					emptyDrop.weight -= item.weight // Transfer empty drop's weight to the new item
				else
					emptyDrop.weight = 0 // The new item takes up more weight than the empty drop, so remove empty drop entirely

				game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops = [...game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops, { item: game.items.getObjectByID(item.id), maxQuantity: item.maxQuantity, minQuantity: item.minQuantity, weight: item.weight }] // Add new item. If there were empty drops before, the new item takes up empty drop slots. If there were no empty drops, or empty drops have been fully used up already, then the addition of this item reduces the drop rate of all other items (by increasing the total weight in the next step).
				// monster.lootTable.drops = [...monster.lootTable.drops, { item: game.objects.getItemByID(newItem.id), maxQuantity: newItem.maxQuantity, minQuantity: newItem.minQuantity, weight: newItem.weight }] 
			} else {
				const index = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.map(drop => drop.item.id).indexOf(item.id)
				if (index === -1)
					throw new Error(`The item ${item.id} was not found in the drop table for ${monsterID}, so it cannot be removed. Please make sure the item exists for this monster.`)
				if (item.weight <= emptyDrop.vanillaWeight - emptyDrop.weight)
					emptyDrop.weight += item.weight // Transfer the item's weight back to the empty drop
				else
					emptyDrop.weight = emptyDrop.vanillaWeight
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.toSpliced(index, 1) // Remove the item from the drop table.
				// lootTable = lootTable.filter(drop => drop.item.id === monsterID) // Remove the item from the drop table
			}
		})
		if (vanillaDrops[monsterID].drops.every((drop, i) => { // Check if all values have been reset to default values
			if (game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray.length !== vanillaDrops[monsterID].drops.length) return false
			return game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray[i].item.id === drop.item.id &&
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray[i].minQuantity === drop.minQuantity &&
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray[i].maxQuantity === drop.maxQuantity &&
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray[i].weight === drop.weight
		})) delete vanillaDrops[monsterID]
		game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.reduce((accumulated, current) => accumulated + current?.weight || 0, 0) // Recalculate totalWeight given that empty drop has been reduced and/or a new drop has been added.
	}

	const modifyDropTable = (monsterID, chestOrMonster, patchFlag, itemsToModify) => {
		const [lootDropperKey, tableKey] = chestOrMonsterChecker(chestOrMonster)
		// const lootTable = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops

		if (vanillaDrops[monsterID] === undefined) {
			let drops = []
			game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray.forEach(drop => drops.push({ item: drop.item, weight: drop.weight, minQuantity: drop.minQuantity, maxQuantity: drop.maxQuantity }))
			vanillaDrops[monsterID] = { 'drops': drops, 'totalWeight': game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight, 'chestOrMonster': chestOrMonster }
		}
		itemsToModify.forEach(item => {
			if (game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.find(drop => drop.item.id === item.id) === undefined)
				throw new Error(`The item ${item.id} does not exist in the drop table for ${monsterID}. Please make sure this monster's drop table includes this item.`)
			if (patchFlag) {
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.forEach(drop => {
					if (drop.item.id !== item.id)
						return
					drop.weight += item.weight
					drop.minQuantity += item.minQuantity
					drop.maxQuantity += item.maxQuantity
				})
			} else {
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.forEach(drop => {
					if (drop.item.id !== item.id)
						return
					drop.weight -= item.weight
					drop.minQuantity -= item.minQuantity
					drop.maxQuantity -= item.maxQuantity
				})
			}
		})

		if (vanillaDrops[monsterID].drops.every((drop, i) => { // Check if all values have been reset to default values
			if (game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray.length !== vanillaDrops[monsterID].drops.length) return false
			return game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray[i].item.id === drop.item.id &&
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray[i].minQuantity === drop.minQuantity &&
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray[i].maxQuantity === drop.maxQuantity &&
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray[i].weight === drop.weight
		})) delete vanillaDrops[monsterID]

		game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.reduce((accumulated, current) => accumulated + current?.weight || 0, 0) // Recalculate totalWeight given that empty drop has been reduced and/or a new drop has been added.
	}

	const patchBoneTable = (monsterToPatch, patchFlag, bonesToPatch) => {
		// bonesToPatch = {id, quantity} // This is a reference
		if (vanillaBones[monsterToPatch] === undefined) { // Check if monster is in database
			vanillaBones[monsterToPatch] = {}
		}
		if (vanillaBones[monsterToPatch].bones === undefined) // Check if item is in database
			vanillaBones[monsterToPatch].bones = {
				'vanillaBonesDrop': game.monsters.getObjectByID(monsterToPatch).bones.item,
				'vanillaQuantity': game.monsters.getObjectByID(monsterToPatch).bones.quantity
			}

		if (patchFlag) {
			game.monsters.getObjectByID(monsterToPatch).bones.item = game.items.getObjectByID(bonesToPatch.id)
			game.monsters.getObjectByID(monsterToPatch).bones.quantity = bonesToPatch.quantity
		} else {
			game.monsters.getObjectByID(monsterToPatch).bones.item = vanillaBones[monsterToPatch].bones.vanillaBonesDrop
			game.monsters.getObjectByID(monsterToPatch).bones.quantity = vanillaBones[monsterToPatch].bones.vanillaQuantity
		}
	}
	ctx.patch(Bank, "decode").before(function (reader, version) {
		registerItems()
	})

	// ## Rebalance
	const patchAutoSwapFood = (patchFlag) => {
		let autoSwapFood = [...[...shopMenu.tabs.values()][0].menu.items].filter(x => x[0]?.id === 'melvorD:AutoSwapFood')
		if (patchFlag) {
			game.shop.purchases.getObjectByID("melvorD:AutoSwapFood")._purchaseRequirements.set(game.currentGamemode, []);
			if (autoSwapFood.length > 0) // This is false when the item is already purchased
				autoSwapFood[0][1].item.mediaBody.childNodes[3].childNodes[0].classList.add('d-none')
		}
		else {
			game.shop.purchases.getObjectByID("melvorD:AutoSwapFood")._purchaseRequirements.set(game.currentGamemode, [{ "type": "SkillLevel", "skill": game.cooking, "level": 90 }]);
			if (autoSwapFood.length > 0)
				autoSwapFood[0][1].item.mediaBody.childNodes[3].childNodes[0].classList.remove('d-none')
		}
	}
	const patchMonsterDrops = (patchFlag) => {
		// Bones
		patchBoneTable("melvorTotH:RaZu", patchFlag, { "id": "melvorTotH:Lightning_Rune", "quantity": 1500 })

		// Chests
		// Add
		addToDropTable("melvorTotH:Ancient_Chest", "chest", patchFlag, [{ 'id': "melvorTotH:Linden_Logs", 'weight': 19, 'minQuantity': 155, 'maxQuantity': 365 }])
		addToDropTable("melvorTotH:Burning_Chest", "chest", patchFlag, [{ 'id': "melvorTotH:Palladium_Bar", 'weight': 22, 'minQuantity': 100, 'maxQuantity': 200 }])
		addToDropTable("melvorF:Miolite_Chest", "chest", patchFlag, [
			{ 'id': "melvorD:Mist_Rune", 'weight': 20, 'minQuantity': 300, 'maxQuantity': 600 },
			{ "id": "melvorD:Dust_Rune", "weight": 20, "minQuantity": 300, "maxQuantity": 600 },
			{ "id": "melvorF:Mud_Rune", "weight": 20, "minQuantity": 300, "maxQuantity": 600 },
			{ "id": "melvorD:Smoke_Rune", "weight": 10, "minQuantity": 300, "maxQuantity": 600 },
			{ "id": "melvorF:Steam_Rune", "weight": 10, "minQuantity": 300, "maxQuantity": 600 },
			{ "id": "melvorF:Lava_Rune", "weight": 10, "minQuantity": 300, "maxQuantity": 600 }
		])
		// Modify
		modifyDropTable('melvorD:Magic_Chest', 'chest', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 399, 'maxQuantity': 700, 'weight': 0 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 399, 'maxQuantity': 700, 'weight': 0 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 399, 'maxQuantity': 700, 'weight': 0 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 399, 'maxQuantity': 700, 'weight': 0 },
			{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 399, 'maxQuantity': 750, 'weight': 0 },
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 399, 'maxQuantity': 750, 'weight': 0 },
			{ 'id': "melvorD:Ancient_Rune", 'minQuantity': 499, 'maxQuantity': 1490, 'weight': 0 }
		])
		modifyDropTable('melvorF:Water_Chest', 'chest', patchFlag, [
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 499, 'maxQuantity': 0, 'weight': 0 },
			{ 'id': "melvorD:Blood_Rune", 'minQuantity': 499, 'maxQuantity': 0, 'weight': 0 },
			{ 'id': "melvorD:Ancient_Rune", 'minQuantity': 499, 'maxQuantity': 0, 'weight': 0 }
		])

		// Monsters
		// Add
		addToDropTable("melvorTotH:BurningSnake", "monster", patchFlag, [{ "id": "melvorTotH:Divine_Helmet", "weight": 200, "minQuantity": 1, "maxQuantity": 1 }])
		addToDropTable('melvorTotH:Manticore', 'monster', patchFlag, [{ "id": "melvorTotH:Divine_Platelegs", "weight": 100, "minQuantity": 1, "maxQuantity": 1 }])
		addToDropTable('melvorTotH:PoisonToad', 'monster', patchFlag, [{ "id": "melvorTotH:Poison_Rune", "weight": 210, "minQuantity": 20, "maxQuantity": 60 }])
		addToDropTable('melvorF:Valkyrie', 'monster', patchFlag, [{ "id": "melvorF:Absorbing_Shield", "weight": 5, "minQuantity": 1, "maxQuantity": 1 }])
		addToDropTable("melvorTotH:Phantom", "monster", patchFlag, [{ "id": "melvorTotH:Soul_Rune", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
		addToDropTable("melvorTotH:Spectre", "monster", patchFlag, [{ "id": "melvorTotH:Soul_Rune", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
		addToDropTable("melvorTotH:Banshee", "monster", patchFlag, [{ "id": "melvorTotH:Soul_Rune", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
		addToDropTable("melvorD:Golbin", "monster", patchFlag, [{ 'id': "melvorD:Shrimp", 'weight': 100, 'minQuantity': 1, 'maxQuantity': 1 }])
		addToDropTable('melvorF:Priest', 'monster', patchFlag, [{ 'id': "melvorF:Prayer_Scroll", 'minQuantity': 1000, 'maxQuantity': 1500, "weight": 500 }])
		addToDropTable('melvorD:DarkWizard', 'monster', patchFlag, [{ 'id': "melvorF:Wizards_Scroll", 'minQuantity': 1000, 'maxQuantity': 1500, "weight": 500 }])
		addToDropTable('melvorTotH:InfernalGolem', 'monster', patchFlag, [{ "id": "melvorTotH:Iridium_Bar", "minQuantity": 10, "maxQuantity": 25, "weight": 5000 }, { "id": "melvorTotH:Divine_Boots", "weight": 800, "minQuantity": 1, "maxQuantity": 1 }])
		addToDropTable('melvorTotH:MagicFireDemon', 'monster', patchFlag, [{ "id": "melvorTotH:Divine_Shield", "weight": 300, "minQuantity": 1, "maxQuantity": 1 }])
		addToDropTable('melvorTotH:GretYun', 'monster', patchFlag, [{ "id": "melvorTotH:Divine_Platebody", "weight": 100, "minQuantity": 1, "maxQuantity": 1 }])
		addToDropTable("melvorTotH:FrostGolem", "monster", patchFlag, [{ 'id': "melvorTotH:Archaic_Rune", 'weight': 4900, 'minQuantity': 40, 'maxQuantity': 110 }])

		// Modify
		modifyDropTable('melvorTotH:InfernalGolem', 'monster', patchFlag, [{ 'id': "melvorTotH:Infernal_Rune", 'minQuantity': 24, 'maxQuantity': 40, 'weight': 0 }])
		modifyDropTable('melvorTotH:MagicFireDemon', 'monster', patchFlag, [{ 'id': "melvorD:Fire_Rune", 'minQuantity': 9, 'maxQuantity': 20, "weight": 0 }, { 'id': "melvorF:Lava_Rune", 'minQuantity': 19, 'maxQuantity': 40, 'weight': 0 }])
		modifyDropTable('melvorTotH:GretYun', 'monster', patchFlag, [{ 'id': "melvorTotH:Infernal_Rune", 'minQuantity': 19, 'maxQuantity': 30, "weight": 0 }])
		modifyDropTable("melvorTotH:FrostGolem", "monster", patchFlag, [{ 'id': "melvorD:Water_Rune", "weight": 0, 'minQuantity': 34, 'maxQuantity': 60 }])
		modifyDropTable('melvorD:Wizard', 'monster', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 9, 'maxQuantity': 20, 'weight': 0 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 9, 'maxQuantity': 20, 'weight': 0 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 9, 'maxQuantity': 20, 'weight': 0 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 9, 'maxQuantity': 20, 'weight': 0 }
		])
		modifyDropTable('melvorF:Priest', 'monster', patchFlag, [{ 'id': "melvorD:Light_Rune", 'minQuantity': 9, 'maxQuantity': 20, "weight": 0 }])
		modifyDropTable('melvorD:DarkWizard', 'monster', patchFlag, [{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 14, 'maxQuantity': 30, "weight": 0 }, { 'id': "melvorD:Death_Rune", 'minQuantity': 14, 'maxQuantity': 30, "weight": 0 }])
		modifyDropTable('melvorD:MasterWizard', 'monster', patchFlag, [{ 'id': "melvorD:Mind_Rune", 'minQuantity': 4, 'maxQuantity': 0, "weight": 0 }])
		modifyDropTable('melvorTotH:IceHydra', 'monster', patchFlag, [{ 'id': "melvorTotH:Calamity_Rune", 'minQuantity': 99, 'maxQuantity': 180, "weight": 0 }])
		modifyDropTable('melvorTotH:Siren', 'monster', patchFlag, [{ 'id': "melvorTotH:Despair_Rune", 'minQuantity': 19, 'maxQuantity': 30, "weight": 0 }])
		modifyDropTable('melvorTotH:PolarBear', 'monster', patchFlag, [{ 'id': "melvorTotH:Frost_Crab", 'minQuantity': 49, 'maxQuantity': 77, "weight": 0 }, { 'id': "melvorTotH:Frozen_Manta_Ray", 'minQuantity': 149, 'maxQuantity': 297, "weight": 0 }])
		modifyDropTable('melvorTotH:Cockatrice', 'monster', patchFlag, [{ 'id': "melvorTotH:Decay_Bolts", 'minQuantity': 24, 'maxQuantity': 90, "weight": 0 }])
		modifyDropTable('melvorF:Shaman', 'monster', patchFlag, [{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 4, 'maxQuantity': 5, "weight": 0 }])
		modifyDropTable('melvorF:Necromancer', 'monster', patchFlag, [{ 'id': "melvorD:Death_Rune", 'minQuantity': 4, 'maxQuantity': 5, "weight": 0 }])
		modifyDropTable('melvorF:Elementalist', 'monster', patchFlag, [{ 'id': "melvorF:Havoc_Rune", 'minQuantity': 4, 'maxQuantity': 5, "weight": 0 }])
		modifyDropTable('melvorTotH:PlagueDoctor', 'monster', patchFlag, [
			{ 'id': "melvorF:Hinder_Potion_III", 'minQuantity': 0, 'maxQuantity': 4, "weight": 0 },
			{ 'id': "melvorF:Lethal_Toxins_Potion_III", 'minQuantity': 0, 'maxQuantity': 4, "weight": 0 },
			{ 'id': "melvorTotH:Area_Control_Potion_III", 'minQuantity': 0, 'maxQuantity': 4, "weight": 0 },
			{ 'id': "melvorTotH:Reaper_Potion_III", 'minQuantity': 0, 'maxQuantity': 4, "weight": 0 },
			{ 'id': "melvorF:Famished_Potion_III", 'minQuantity': 0, 'maxQuantity': 4, "weight": 0 },
			{ 'id': "melvorTotH:Penetration_Potion_III", 'minQuantity': 0, 'maxQuantity': 4, "weight": 0 }
		])
		modifyDropTable('melvorF:Vampire', 'monster', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 4, 'maxQuantity': 5, "weight": 0 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 4, 'maxQuantity': 5, "weight": 0 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 4, 'maxQuantity': 5, "weight": 0 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 4, 'maxQuantity': 5, "weight": 0 },
			{ 'id': "melvorD:Mind_Rune", 'minQuantity': 4, 'maxQuantity': 5, "weight": 0 },
			{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 2, 'maxQuantity': 3, "weight": 0 },
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 1, 'maxQuantity': 2, "weight": 0 }
		])

		// Secondary modifications to counteract items that were unintentionally nerfed a bit too hard
		modifyDropTable('melvorTotH:Burning_Chest', 'chest', patchFlag, [{ 'id': "melvorTotH:Blazing_Helmet", 'minQuantity': 0, 'maxQuantity': 0, 'weight': 2 }])
		modifyDropTable('melvorTotH:Burning_Chest', 'chest', patchFlag, [{ 'id': "melvorTotH:Heated_Fury_2H_Hammer", 'minQuantity': 0, 'maxQuantity': 0, 'weight': 1 }])
		modifyDropTable("melvorTotH:Phantom", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Longbow", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
		modifyDropTable("melvorTotH:Spectre", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Greataxe", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
		modifyDropTable("melvorTotH:Banshee", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Staff", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
		modifyDropTable("melvorTotH:Siren", "monster", patchFlag, [{ "id": "melvorTotH:Allure_Amulet", "minQuantity": 0, "maxQuantity": 0, "weight": 50 }])
	}
	const patchUnavailableShopItems = (patchFlag) => {
		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { y.container.classList.remove('d-none') }))
		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (y.item.purchase.namespace === "hcco") y.container.classList.add('d-none') })) // Hide CO items by default, reveal them later

		let exceptionItems = []
		if (rebalanceButtonValue())
			exceptionItems = [...exceptionItems, `${ctx.namespace}:Combat_Max_Skillcape`, `${ctx.namespace}:Combat_Superior_Max_Skillcape`, `${ctx.namespace}:Apprentice_Runepack`, `${ctx.namespace}:Adept_Runepack`, `${ctx.namespace}:Master_Runepack`, `${ctx.namespace}:Archmage_Runepack`]
		if (summoningButtonValue())
			exceptionItems = [...exceptionItems, `${ctx.namespace}:Critter_Pack`, `${ctx.namespace}:Companion_Pack`, `${ctx.namespace}:Familiar_Pack`, `${ctx.namespace}:Beast_Pack`]

		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (exceptionItems.includes(y.item.purchase.id)) y.container.classList.remove('d-none') }))

		if (!patchFlag) {
			return
		}
		const bannedSkills = game.skills.filter(x => !x.isCombat).map(x => x.id)
		//let shopItems = game.shop.purchases.allObjects.filter(x => !x.category.isGolbinRaid).filter(x =>
		let shopItems = game.shop.purchases.filter(x =>
			!x.purchaseRequirements.some(y => y.type === 'TownshipBuilding')
		).filter(shopItems =>
			shopItems.purchaseRequirements.length === 0 || // If no purchase requirements then include it
			shopItems.purchaseRequirements.every(reqs =>
				!bannedSkills.includes(reqs?.skill?.id)
			)
		).map(x => x.id)
		let bannedItems = ["melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire", "melvorD:Weird_Gloop", "melvorTotH:Slayer_Torch", "melvorTotH:Mystic_Lantern", "mini_max_cape:Combat_Superior_Max_Skillcape", "mini_max_cape:Combat_Max_Skillcape", "mini_max_cape:Skilling_Superior_Max_Skillcape", "mini_max_cape:Skilling_Max_Skillcape", "melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control", "melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar", "melvorF:Cape_of_Completion", "melvorTotH:Superior_Cape_Of_Completion", "melvorF:Max_Skillcape", "melvorTotH:Superior_Max_Skillcape"]

		shopItems = shopItems.filter(x => !bannedItems.includes(x))
		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (!shopItems.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
	}

	const patchCapes = (patchFlag) => {
		const patchedCapeValue = 25
		const patchedSuperiorCapeValue = 35
		const unpatchedCapeValue = 50
		const unpatchedSuperiorCapeValue = 75

		// const shopPrayerCapeItem = Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).find(x => x[0]?.id === 'melvorF:Prayer_Skillcape')
		// const shopSuperiorPrayerCapeItem = Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).find(x => x[0]?.id === 'melvorTotH:Superior_Prayer_Skillcape')
		const shopPrayerCapeItem = shopMenu.tabs.get(game.shop.categories.getObjectByID("melvorD:Skillcapes")).menu.items.get(game.shop.purchases.getObjectByID("melvorF:Prayer_Skillcape")).item
		const shopSuperiorPrayerCapeItem = shopMenu.tabs.get(game.shop.categories.getObjectByID("melvorTotH:SuperiorSkillcapes")).menu.items.get(game.shop.purchases.getObjectByID("melvorTotH:Superior_Prayer_Skillcape")).item

		if (patchFlag) {
			game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).modifiers.decreasedPrayerCost = patchedCapeValue
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.decreasedPrayerCost = patchedSuperiorCapeValue
			game.items.getObjectByID("melvorF:Prayer_Skillcape").modifiers.decreasedPrayerCost = patchedCapeValue
			game.items.getObjectByID("melvorTotH:Superior_Prayer_Skillcape").modifiers.decreasedPrayerCost = patchedSuperiorCapeValue

			shopPrayerCapeItem.description.innerHTML = `-${patchedCapeValue}% Prayer Point Cost for Prayers`
			shopSuperiorPrayerCapeItem.description.innerHTML = `-${patchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
			// shopPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${patchedCapeValue}% Prayer Point Cost for Prayers`
			// shopSuperiorPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${patchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
		} else {
			game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).modifiers.decreasedPrayerCost = unpatchedCapeValue
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.decreasedPrayerCost = unpatchedSuperiorCapeValue
			game.items.getObjectByID("melvorF:Prayer_Skillcape").modifiers.decreasedPrayerCost = unpatchedCapeValue
			game.items.getObjectByID("melvorTotH:Superior_Prayer_Skillcape").modifiers.decreasedPrayerCost = unpatchedSuperiorCapeValue

			shopPrayerCapeItem.description.innerHTML = `-${unpatchedCapeValue}% Prayer Point Cost for Prayers`
			shopSuperiorPrayerCapeItem.description.innerHTML = `-${unpatchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
			// shopPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${unpatchedCapeValue}% Prayer Point Cost for Prayers`
			// shopSuperiorPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${unpatchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
		}
	}
	const patchLevelCap = () => { // Cap HP to 99 until after 10000 DW kills
		game.hitpoints._level = Math.min(game.hitpoints.level, game.hitpoints.levelCap)
		game.combat.player.computeAllStats()
		// game.combat.player.levels.Hitpoints = Math.min(game.hitpoints.level, game.hitpoints.levelCap)
		// game.combat.player.stats.maxHitpoints = Math.min(game.hitpoints.level, game.hitpoints.levelCap) * numberMultiplier
		// game.hitpoints.level = Math.min(game.hitpoints.level, game.hitpoints.levelCap)`
	}

	const patchLightRunesFromResupplies = (patchFlag) => {
		let resupplyShopItems = [...new Set([game.shop.purchases.getObjectByID("melvorF:Basic_Resupply"), game.shop.purchases.getObjectByID("melvorF:Standard_Resupply"), game.shop.purchases.getObjectByID("melvorF:Generous_Resupply"), game.shop.purchases.getObjectByID("melvorTotH:Plentiful_Resupply"), game.shop.purchases.getObjectByID("melvorTotH:Bountiful_Resupply")])]

		if (resupplyShopItems.length === 1)
			if (resupplyShopItems[0] === undefined)
				return

		if (patchFlag) {
			resupplyShopItems.forEach(x => x.contains.items = x.contains.items.filter(x => x.item.id !== "melvorD:Light_Rune")) // Remove light runes
			resupplyShopItems.forEach(x => Object.defineProperty(x, 'isModded', { get() { return true }, configurable: true })); // Set modded flag to be true so that the game reads the custom description
			resupplyShopItems[0]._customDescription = "+${qty1} Mithril Arrows, +${qty2} Topaz Bolts, +${qty3} Lobsters, +${qty4} Magic Bones"
			resupplyShopItems[1]._customDescription = "+${qty1} Adamant Arrows, +${qty2} Sapphire Bolts, +${qty3} Crabs, +${qty4} Magic Bones"
			resupplyShopItems[2]._customDescription = "+${qty1} Rune Arrows, +${qty2} Ruby Bolts, +${qty3} Sharks, +${qty4} Magic Bones"
			resupplyShopItems[3]._customDescription = "+${qty1} Dragon Arrows, +${qty2} Emerald Bolts, +${qty3} Magma Fish, +${qty4} Magic Bones"
			resupplyShopItems[4]._customDescription = "+${qty1} Ancient Arrows, +${qty2} Diamond Bolts, +${qty3} Static Jellyfish, +${qty4} Magic Bones"
		} else if (game.shop.purchases.getObjectByID("melvorF:Basic_Resupply").contains.items.filter(x => x.item.id === "melvorD:Light_Rune")[0]?.quantity !== 200) { // Check if resupplies have been modified yet
			game.shop.purchases.getObjectByID("melvorF:Basic_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 200 })
			game.shop.purchases.getObjectByID("melvorF:Standard_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 500 })
			game.shop.purchases.getObjectByID("melvorF:Generous_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 1000 })
			game.shop.purchases.getObjectByID("melvorTotH:Plentiful_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 4000 })
			game.shop.purchases.getObjectByID("melvorTotH:Bountiful_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 8500 })
			resupplyShopItems[0]._customDescription = "+${qty1} Mithril Arrows, +${qty2} Topaz Bolts, +${qty3} Lobsters, +${qty4} Magic Bones, +${qty5} Light Runes"
			resupplyShopItems[1]._customDescription = "+${qty1} Adamant Arrows, +${qty2} Sapphire Bolts, +${qty3} Crabs, +${qty4} Magic Bones, +${qty5} Light Runes"
			resupplyShopItems[2]._customDescription = "+${qty1} Rune Arrows, +${qty2} Ruby Bolts, +${qty3} Sharks, +${qty4} Magic Bones, +${qty5} Light Runes"
			resupplyShopItems[3]._customDescription = "+${qty1} Dragon Arrows, +${qty2} Emerald Bolts, +${qty3} Magma Fish, +${qty4} Magic Bones, +${qty5} Light Runes"
			resupplyShopItems[4]._customDescription = "+${qty1} Ancient Arrows, +${qty2} Diamond Bolts, +${qty3} Static Jellyfish, +${qty4} Magic Bones, +${qty5} Light Runes"
		}
	}

	const removeShopItems = (patchFlag) => {
		const coModdedItems = [`${ctx.namespace}:Combat_Max_Skillcape`, `${ctx.namespace}:Combat_Superior_Max_Skillcape`, `${ctx.namespace}:Apprentice_Runepack`, `${ctx.namespace}:Adept_Runepack`, `${ctx.namespace}:Master_Runepack`, `${ctx.namespace}:Archmage_Runepack`]
		shopMenu.tabs.forEach(x => {
			x.menu.items.forEach(y => {
				if (coModdedItems.includes(y.item.purchase.id))
					if (patchFlag)
						y.container.classList.remove('d-none')
					else
						y.container.classList.add('d-none')
			})
		})
	}

	const coRebalancePatch = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		patchMonsterDrops(patchFlag)
		// patchAutoSwapFood(patchFlag)
		patchLightRunesFromResupplies(patchFlag)
		patchCapes(patchFlag)
		patchCompletionLogItems(patchFlag)
		removeShopItems(patchFlag)
		// patchUnavailableShopItems(patchFlag) // Only false if both buttons are false
		// patchItemModifiers(patchFlag)
	}

	const coRebalanceQoLPatch = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		patchAutoSwapFood(patchFlag)
		patchUnavailableShopItems(patchFlag) // Only false if both buttons are false
	}


	// ## Skill Utility Functions 

	const unlockSkill = (patchFlag, skillID) => {
		const skillName = skillID.split(":")[1].toLowerCase()
		if (patchFlag) {
			game[skillName].setUnlock(true);
		} else {
			game[skillName].setUnlock(false)
			if (game.openPage === game.pages.getObjectByID(skillID))
				sidebar.category('Combat').items()[0].click() // If the person has the skill window open when they disable the skill, move them to the combat window
		}
	}
	const moveSkillSidebarToCategoryFromCategory = (patchFlag, skillID, categoryTo, categoryFrom) => { // Moves a skill from one category to another in the sidebar
		const skillName = capitalise(skillID.split(":")[1])
		if (patchFlag) {
			game.pages.getObjectByID(skillID).skillSidebarCategoryID = categoryTo
			// sidebar.categories().filter(x => x.id === categoryFrom)[0].items().filter(x => x.id === skillID)[0].itemEl.classList.remove('d-none')
			sidebar.categories().filter(x => x.id === categoryTo)[0].rootEl.appendChild(sidebar.categories().filter(x => x.id === categoryFrom)[0].items().filter(x => x.id === skillID)[0].itemEl)
			// sidebar.categories().filter(x => x.id === categoryFrom)[0].removeItem(skillID)
			// sidebar.categories().filter(x => x.id === categoryTo)[0].item(skillID)
			// sidebar.categories().filter(x => x.id === categoryFrom)[0].items().filter(x => x.id === skillID)
		} else {
			game.pages.getObjectByID(skillID).skillSidebarCategoryID = categoryFrom
			// sidebar.categories().filter(x => x.id === categoryFrom)[0].items().filter(x => x.id === skillID)[0].itemEl.classList.add('d-none')
			sidebar.categories().filter(x => x.id === categoryFrom)[0].rootEl.appendChild(sidebar.categories().filter(x => x.id === categoryTo)[0].items().filter(x => x.id === skillID)[0].itemEl)
			// sidebar.categories().filter(x => x.id === categoryTo)[0].removeItem(skillID)
			// sidebar.categories().filter(x => x.id === categoryFrom)[0].item(skillID)
		}
	}
	const hideSidebarSkillSubcategory = (patchFlag, skillID, category) => { // Moves a skill from one category to another in the sidebar
		if (patchFlag) {
			// sidebar.categories().filter(x => x.id === category)[0].items().filter(x => x.id === skillID)[0].itemEl.classList.remove("d-none")
			if (category === "Passive") sidebar.categories().filter(x => x.id === "Passive")[0].rootEl.appendChild(sidebar.categories().filter(x => x.id === category)[0].items().filter(x => x.id === skillID)[0].itemEl)
			else sidebar.categories().filter(x => x.id === "Combat")[0].rootEl.appendChild(sidebar.categories().filter(x => x.id === category)[0].items().filter(x => x.id === skillID)[0].itemEl)
		} else {
			if (category === "Passive") sidebar.categories().filter(x => x.id === "Passive")[0].rootEl.appendChild(sidebar.categories().filter(x => x.id === category)[0].items().filter(x => x.id === skillID)[0].itemEl)
			else sidebar.categories().filter(x => x.id === "Non-Combat")[0].rootEl.appendChild(sidebar.categories().filter(x => x.id === category)[0].items().filter(x => x.id === skillID)[0].itemEl)
		}
	}


	const patchSkill = (patchFlag, skillID, category) => {
		unlockSkill(patchFlag, skillID)
		hideSidebarSkillSubcategory(patchFlag, skillID, category)
		hideNonCombatCategory()
		getCOItemList() // Call this to refresh item list for stuff like completion log
	}

	const hideNonCombatCategory = () => {
		const categoriesToCheck = ["Non-Combat", "Passive"]
		const categoriesToAlwaysHide = ["Non-Combat"]
		sidebar.categories().filter(category => categoriesToCheck.includes(category.id)).forEach(category => {
			category.rootEl.classList.remove('d-none') // Reveal all first

			if (!category.items().some(skill => { // Check to see if a given category has at least one skill that's classified as a combat skill
				const skillName = skill.id.split(":")[1]?.toLowerCase();
				return game[skillName]?.isUnlocked
			}))
				category.rootEl.classList.add('d-none') // Hides categories that have no unlocked skills
			if (categoriesToAlwaysHide.includes(category.id))
				category.rootEl.classList.add('d-none')
		})
	}

	// ## Summoning
	const patchShopItemsForSummoning = (patchFlag) => {
		let shopMaxCapeItem = Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id === `${ctx.namespace}:Combat_Max_Skillcape`)
		let shopSuperiorMaxCapeItem = Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id === `${ctx.namespace}:Combat_Superior_Max_Skillcape`)
		let shopItemsToModify = [`${ctx.namespace}:Critter_Pack`, `${ctx.namespace}:Companion_Pack`, `${ctx.namespace}:Familiar_Pack`, `${ctx.namespace}:Beast_Pack`]
		if (patchFlag) {
			// Add summoning requirements
			if (!game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).purchaseRequirements.map(x => x.skill.id).includes('melvorD:Summoning')) {
				game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).purchaseRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 99 });
				game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).equipRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 99 });
			}
			if (!game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).purchaseRequirements.map(x => x.skill.id).includes('melvorD:Summoning')) {
				game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).purchaseRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 120 });
				game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).equipRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 120 });
			}
			// Modify cape stats
			game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).modifiers.increasedSummoningChargePreservation = 0
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.increasedSummoningChargePreservation = 0
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.increasedSummoningMaxHit = 0

			// Reveal shop requirements
			if (shopMaxCapeItem.length > 0) { // This is false if the item is not in the shop, which shouldn't happen...? But it's good practice I guess
				// Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.remove('d-none'); // Show skill requirement in shop front
				Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes)[shopMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.remove('d-none'); // Repeat of above function to not use .at()
				Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id === 'melvorF:Summoning_Skillcape')[0][1].container.classList.remove('d-none') // Reveal in shop
			}
			if (shopSuperiorMaxCapeItem.length > 0) { // This is false if the item is not in the shop, which shouldn't happen...? But it's good practice I guess
				// Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.remove('d-none');
				Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes)[shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.remove('d-none');// Repeat of above function to not use .at()
				Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id === 'melvorTotH:Superior_Summoning_Skillcape')[0][1].container.classList.remove('d-none')
			}
			// Reveal other shop items

			shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (shopItemsToModify.includes(y.item.purchase.id)) y.container.classList.remove('d-none') }))
		} else {
			// Add summoning requirements
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`)._purchaseRequirements.set(game.currentGamemode, game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).purchaseRequirements.filter(x => x.skill.id !== "melvorD:Summoning")); // Remove summoning req
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`)._purchaseRequirements.set(game.currentGamemode, game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).purchaseRequirements.filter(x => x.skill.id !== "melvorD:Summoning"));
			game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).equipRequirements = game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).equipRequirements.filter(x => x.skill.id !== "melvorD:Summoning"); // Remove summoning req
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).equipRequirements = game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).equipRequirements.filter(x => x.skill.id !== "melvorD:Summoning");

			// Modify cape stats
			game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).modifiers.increasedSummoningChargePreservation = 10
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.increasedSummoningChargePreservation = 15
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.increasedSummoningMaxHit = 10
			// Hide shop requirements
			if (shopMaxCapeItem.length > 0) {
				// Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.add('d-none'); // Hide skill req in shop front
				Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes)[shopMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.add('d-none'); // Repeat of above function to not use .at()
				Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id === 'melvorF:Summoning_Skillcape')[0][1].container.classList.add('d-none')
			}
			if (shopSuperiorMaxCapeItem.length > 0) {
				// Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.add('d-none');
				Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes)[shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.add('d-none'); // Repeat of above function to not use .at()
				Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id === 'melvorTotH:Superior_Summoning_Skillcape')[0][1].container.classList.add('d-none')
			}
			// Hide other shop items
			shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (shopItemsToModify.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
		}
	}
	const patchSummoningEquipRequirements = (patchFlag) => {
		if (patchFlag) {
			game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 1 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 5 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 15 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 25 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 35 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 55 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 65 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 80 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 90 })]
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 100 })]
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 105 })]
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 110 })]
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 115 })]
		} else {
			game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		}
	}
	const patchSummoningDrops = (patchFlag) => {
		// Bones
		game.dungeons.getObjectByID("melvorTotH:Lightning_Region").dropBones = patchFlag || rebalanceButtonValue()
		game.dungeons.getObjectByID("melvorTotH:Lair_of_the_Spider_Queen").dropBones = patchFlag
		game.dungeons.getObjectByID("melvorTotH:Necromancers_Palace").dropBones = patchFlag
		// Lightning spirit
		patchBoneTable("melvorTotH:LightningSpirit", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 50 })
		patchBoneTable("melvorTotH:LightningMonkey", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 55 })
		patchBoneTable("melvorTotH:LightningGolem", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 60 })
		// Spider familiar
		// patchBoneTable("melvorTotH:RandomSpiderLair", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
		patchBoneTable("melvorTotH:ScouterSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
		patchBoneTable("melvorTotH:TrapperSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
		patchBoneTable("melvorTotH:WickedSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
		patchBoneTable("melvorTotH:BasherSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
		patchBoneTable("melvorTotH:EnforcerSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
		patchBoneTable("melvorTotH:GuardianSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
		patchBoneTable("melvorTotH:SpiderQueen", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 350 })
		// Necromancer palace
		patchBoneTable("melvorTotH:CursedSkeletonWarrior", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 120 })
		patchBoneTable("melvorTotH:Beholder", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Siren", "quantity": 150 })
		patchBoneTable("melvorTotH:DarkKnight", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 200 })
		patchBoneTable("melvorTotH:Fiozor", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spectre", "quantity": 600 })

		// Monsters
		addToDropTable('melvorF:LotsofEyes', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Golbin_Thief", 'weight': 300, 'minQuantity': 10, 'maxQuantity': 50 }])
		addToDropTable('melvorF:ManyEyedMonster', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Occultist", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Wolf", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }])
		addToDropTable('melvorF:StrangeEyedMonster', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Minotaur", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Witch", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }])
		addToDropTable('melvorF:Eyes', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Centaur", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Cyclops", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }])
		addToDropTable('melvorF:SuperiorEyedMonster', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Yak", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Unicorn", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }])
		addToDropTable('melvorF:EyeOfFear', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Dragon", 'weight': 300, 'minQuantity': 10, 'maxQuantity': 50 }])
		addToDropTable('melvorTotH:Siren', 'monster', patchFlag, [{ 'id': "melvorTotH:Summoning_Familiar_Siren", 'weight': 13800, 'minQuantity': 15, 'maxQuantity': 75 }])
		addToDropTable('melvorTotH:Phantom', 'monster', patchFlag, [{ "id": "melvorTotH:Summoning_Familiar_Spectre", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
		addToDropTable('melvorTotH:Banshee', 'monster', patchFlag, [{ "id": "melvorTotH:Summoning_Familiar_Spectre", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
		addToDropTable('melvorTotH:Spectre', 'monster', patchFlag, [{ "id": "melvorTotH:Summoning_Familiar_Spectre", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
		// Cartography additions
		// Eye-conic cave -> Mucky Cave
		addToDropTable('melvorAoD:BlindWarrior', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 20 }])
		addToDropTable('melvorAoD:BlindArcher', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 16 }])
		addToDropTable('melvorAoD:BlindMage', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 16 }])
		addToDropTable('melvorAoD:BlindGhost', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 24 }])
		// Mucky Cave -> Tree Overgrowth
		addToDropTable('melvorAoD:SlimeShooter', 'monster', patchFlag, [{ "id": "melvorAoD:Old_Route_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 1780 }])
		// Tree Overgrowth -> Dark Quarry + Collapsed City
		addToDropTable('melvorAoD:AngryTeak', 'monster', patchFlag, [{ "id": "melvorAoD:Ancient_Stone_Tablet", "minQuantity": 1, "maxQuantity": 1, "weight": 2000 }])
		addToDropTable('melvorAoD:RagingMaple', 'monster', patchFlag, [{ "id": "melvorAoD:Dusty_Book_of_Knowledge", "minQuantity": 1, "maxQuantity": 1, "weight": 2000 }])
		// Dark Quarry -> Collapsed City
		addToDropTable('melvorAoD:MagicGolem', 'monster', patchFlag, [{ "id": "melvorAoD:Navigation_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 2000 }])
		// Collapsed city -> Lost Temple
		addToDropTable('melvorAoD:PoisonBloater', 'monster', patchFlag, [{ "id": "melvorAoD:Torn_Scrolls", "minQuantity": 1, "maxQuantity": 1, "weight": 100 }])
		// Lost Temple -> Ritual Site
		addToDropTable('melvorAoD:PossessedBarrel', 'monster', patchFlag, [{ "id": "melvorAoD:Lost_Cursed_Text", "minQuantity": 1, "maxQuantity": 1, "weight": 200 }])
		// Ritual Site -> Shipwreck Cove
		addToDropTable('melvorAoD:CultMonster', 'monster', patchFlag, [{ "id": "melvorAoD:Misty_Jewel", "minQuantity": 1, "maxQuantity": 1, "weight": 160 }])
		// Cult Grounds -> Underwater Ruins
		addToDropTable('melvorAoD:Ritual_Chest', 'chest', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_1", "minQuantity": 1, "maxQuantity": 1, "weight": 1 }])
		// Shipwreck Cove -> Underwater Ruins
		addToDropTable('melvorAoD:ShipwreckBeast', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_2", "minQuantity": 1, "maxQuantity": 1, "weight": 675 }])
		addToDropTable('melvorAoD:CursedPirateCaptain', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_3", "minQuantity": 1, "maxQuantity": 1, "weight": 150 }])
		// Crystal Depths -> Underwater Ruins
		addToDropTable('melvorAoD:CrystalBehemoth', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_4", "minQuantity": 1, "maxQuantity": 1, "weight": 10 }])
		//Summoning
		addToDropTable('melvorAoD:PoisonLeecher', 'monster', patchFlag, [{ "id": "melvorAoD:Summoning_Familiar_Barrier", "minQuantity": 10, "maxQuantity": 50, "weight": 2030 }])
		addToDropTable('melvorAoD:PoisonRoamer', 'monster', patchFlag, [{ "id": "melvorAoD:Summoning_Familiar_Barrier", "minQuantity": 10, "maxQuantity": 50, "weight": 1080 }])
		addToDropTable('melvorAoD:PoisonSlime', 'monster', patchFlag, [{ "id": "melvorAoD:Summoning_Familiar_Barrier", "minQuantity": 10, "maxQuantity": 50, "weight": 2550 }])
		addToDropTable('melvorAoD:PoisonBloater', 'monster', patchFlag, [{ "id": "melvorAoD:Summoning_Familiar_Barrier", "minQuantity": 10, "maxQuantity": 50, "weight": 2450 }])

		// Secondary modifications to counteract items that were unintentionally nerfed a bit too hard
		modifyDropTable("melvorTotH:Phantom", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Longbow", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
		modifyDropTable("melvorTotH:Spectre", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Greataxe", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
		modifyDropTable("melvorTotH:Banshee", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Staff", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
	}

	const patchCartographyEntryRequirements = (patchFlag) => {
		// 5 / 30 / 50 / 65 / 75 / 95 / 100 / 105
		if (patchFlag) {
			// Combat Areas
			game.combatAreas.getObjectByID("melvorAoD:EyeConicCave")._entryRequirements = [{ "level": 5, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }]
			game.combatAreas.getObjectByID("melvorAoD:MuckyCave")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:City_Map"), "type": "ItemFound" },
				{ "level": 30, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
			]
			game.combatAreas.getObjectByID("melvorAoD:TreeOvergrowth")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Old_Route_Chart"), "type": "ItemFound" },
				{ "level": 50, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
			]
			game.combatAreas.getObjectByID("melvorAoD:CollapsedCity")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Dusty_Book_of_Knowledge"), "type": "ItemFound" },
				{ "item": game.items.getObjectByID("melvorAoD:Navigation_Chart"), "type": "ItemFound" },
				{ "level": 65, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
			]
			game.combatAreas.getObjectByID("melvorAoD:LostTemple")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Torn_Scrolls"), "type": "ItemFound" },
				{ "level": 75, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
			]
			game.combatAreas.getObjectByID("melvorAoD:RitualSite")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Lost_Cursed_Text"), "type": "ItemFound" },
				{ "level": 95, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
			]
			game.combatAreas.getObjectByID("melvorAoD:ShipwreckCove")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Misty_Jewel"), "type": "ItemFound" },
				{ "level": 100, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
			]
			game.combatAreas.getObjectByID("melvorAoD:UnderwaterRuins")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_1"), "type": "ItemFound" },
				{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_2"), "type": "ItemFound" },
				{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_3"), "type": "ItemFound" },
				{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_4"), "type": "ItemFound" },
				{ "level": 110, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
			]

			// Slayer areas
			game.slayerAreas.getObjectByID("melvorAoD:CrystalCaves")._entryRequirements = [
				{ "level": 50, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" },
				{ "level": 40, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }
			]
			game.slayerAreas.getObjectByID("melvorAoD:DarkQuarry")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Ancient_Stone_Tablet"), "type": "ItemFound" },
				{ "level": 55, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" },
				{ "level": 45, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }
			]
			game.slayerAreas.getObjectByID("melvorAoD:CrystalDepths")._entryRequirements = [
				{ "level": 95, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" },
				{ "level": 85, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }
			]

			// Dungeons
			game.dungeons.getObjectByID("melvorAoD:Underwater_City")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_1"), "type": "ItemFound" },
				{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_2"), "type": "ItemFound" },
				{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_3"), "type": "ItemFound" },
				{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_4"), "type": "ItemFound" },
			]
		} else {
			game.combatAreas.getObjectByID("melvorAoD:EyeConicCave")._entryRequirements = [
				{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:EyeConicCave")], "type": "CartographyPOIDiscovery" }
			]
			game.combatAreas.getObjectByID("melvorAoD:MuckyCave")._entryRequirements = [
				{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:MuckyCave")], "type": "CartographyPOIDiscovery" }
			]
			game.combatAreas.getObjectByID("melvorAoD:TreeOvergrowth")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Old_Route_Chart"), "type": "ItemFound" },
			]
			game.combatAreas.getObjectByID("melvorAoD:CollapsedCity")._entryRequirements = [
				{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:GlaciaDungeonRuins")], "type": "CartographyPOIDiscovery" }
			]
			game.combatAreas.getObjectByID("melvorAoD:LostTemple")._entryRequirements = [{ "item": game.items.getObjectByID("melvorAoD:Torn_Scrolls"), "type": "ItemFound" }]
			game.combatAreas.getObjectByID("melvorAoD:RitualSite")._entryRequirements = [{ "item": game.items.getObjectByID("melvorAoD:Lost_Cursed_Text"), "type": "ItemFound" }]
			game.combatAreas.getObjectByID("melvorAoD:ShipwreckCove")._entryRequirements = [{ "item": game.items.getObjectByID("melvorAoD:Misty_Jewel"), "type": "ItemFound" }]
			game.combatAreas.getObjectByID("melvorAoD:UnderwaterRuins")._entryRequirements = [
				{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:Melantis")], "type": "CartographyPOIDiscovery" }
			]

			// Slayer areas
			game.slayerAreas.getObjectByID("melvorAoD:CrystalCaves")._entryRequirements = [{ "level": 40, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }]
			game.slayerAreas.getObjectByID("melvorAoD:DarkQuarry")._entryRequirements = [
				{ "item": game.items.getObjectByID("melvorAoD:Ancient_Stone_Tablet"), "type": "ItemFound" },
				{ "level": 45, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }
			]
			game.slayerAreas.getObjectByID("melvorAoD:CrystalDepths")._entryRequirements = [{ "level": 85, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }]

			// Dungeons
			game.dungeons.getObjectByID("melvorAoD:Underwater_City")._entryRequirements = [
				{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:Melantis")], "type": "CartographyPOIDiscovery" }
			]
		}
		Object.keys(areaMenus).forEach(areaID => areaMenus[areaID].updateRequirements())
	}

	const patchSummoningSkillProgress = (patchFlag) => {
		if (patchFlag) {
			document.getElementById("combat-menu-item-6").classList.remove("d-none") // summoning combat menu
			document.getElementById('summoning-row').classList.remove('d-none')
			// Level
			document.querySelector("#combat-skill-progress-menu > table > tbody:nth-child(10) > tr > td:nth-child(2)").appendChild(document.querySelector("#skill-progress-level-melvorD\\:Summoning"))
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList)
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(1) > span").classList.add('d-none')
			// Xp
			document.querySelector("#combat-skill-progress-menu > table > tbody:nth-child(10) > tr > td.font-w600.font-size-sm.d-none.d-sm-table-cell").appendChild(document.querySelector("#skill-progress-xp-melvorD\\:Summoning"))
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList)
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(2) > span.font-w600").classList.add('d-none')
			// Progress bar
			document.querySelector("#skill-progress-xp-tooltip-melvorD\\:Summoning").appendChild(document.querySelector("#skill-progress-bar-melvorD\\:Summoning"))

			// Adding these as additional steps well after the fact to not confuse myself lol
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML.replace("span", "small")
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML.replace("span", "small")
		} else {
			document.getElementById("combat-menu-item-6").classList.add("d-none") // summoning combat menu
			document.getElementById('summoning-row').classList.add('d-none')
			// Level
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(1)").appendChild(document.querySelector("#skill-progress-level-melvorD\\:Summoning"))
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList)
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.add('p-1', 'bg-success', 'rounded', 'font-w600')
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(1) > span").classList.remove('d-none')
			// Xp
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(2)").appendChild(document.querySelector("#skill-progress-xp-melvorD\\:Summoning"))
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList)
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.add('p-1', 'bg-info', 'rounded', 'font-w600')
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(2) > span.font-w600").classList.remove('d-none')
			//Progress bar
			document.querySelector("#skill-header-melvorD\\:Summoning > div.progress.active.mb-1.border.border-top.border-1x.border-dark").appendChild(document.querySelector("#skill-progress-bar-melvorD\\:Summoning"))

			// Adding these as additional steps well after the fact to not confuse me lol
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML.replace("small", "span")
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML.replace("small", "span")
		}
	}
	const patchSkillingFamiliars = (patchFlag) => {
		if (patchFlag) {
			// console.log(document.querySelector("#mark-discovery-elements").childNodes)
			const bannedSkills = game.skills.filter(x => !x.isCombat || x.id === 'melvorD:Summoning').map(x => x.id)
			markDiscoveryMenus.forEach((v, k) => {
				if (k.skills.some(y => bannedSkills.includes(y.id)))
					v.classList.add('d-none')
			})
		} else {
			document.querySelector("#mark-discovery-elements").childNodes.forEach(x => x?.classList?.remove('d-none'))
		}
	}

	ctx.patch(CombatManager, "getMonsterDropsHTML").replace(function (o, monster, respectArea) {
		if (!(coGamemodeCheck() && dropsButtonValue())) 
			return o(monster, respectArea)

		const simplify = (numerator, denominator) => {
			var gcd = function gcd(a, b) {
				return b ? gcd(b, a % b) : a;
			};
			gcd = gcd(numerator, denominator);
			return `${numerator / gcd}/${denominator / gcd}`;
		}

		let drops = '';
		const localeSettings = {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		};
		if (monster.lootTable.size > 1 && !(respectArea && this.areaType === CombatAreaType.Dungeon)) { // Modified "lootTable.size > 0" to be "lootTable.size > 1" because I'm adding an empty drop to every drop table, and removed lootChance
			drops = monster.lootTable.sortedDropsArray.map((drop) => {
				let dropText = ``
				if (drop.minQuantity === drop.maxQuantity) dropText += `${numberWithCommas(drop.maxQuantity)}`
				else dropText += `(${numberWithCommas(drop.minQuantity)} – ${numberWithCommas(drop.maxQuantity)})`
				dropText += ` × <img class="skill-icon-xs mr-2" src="${drop.item.media}">${drop.item.name}`
				dropText += ` <b style='color: rgb(255, 204, 0)'>[${(100 * drop.weight / monster.lootTable.weight).toLocaleString(undefined, localeSettings)}%]</b> <b style='color: rgb(255, 204, 0)'>[${simplify(drop.weight, monster.lootTable.weight)}]</b>`;
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
	})
	viewItemContents = function (item) {
		const dropsOrdered = item.dropTable.sortedDropsArray;
		const simplify = (numerator, denominator) => {
			var gcd = function gcd(a, b) {
				return b ? gcd(b, a % b) : a;
			};
			gcd = gcd(numerator, denominator);
			return `${numerator / gcd}/${denominator / gcd}`;
		}

		const localeSettings = {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		};
		let drops
		if (!(coGamemodeCheck() && dropsButtonValue())) { // Default functionality
			drops = dropsOrdered.map((drop) => {
				return templateString(getLangString('BANK_STRING_40'), {
					qty: `${numberWithCommas(drop.maxQuantity)}`,
					itemImage: `<img class="skill-icon-xs mr-2" src="${drop.item.media}">`,
					itemName: drop.item.name,
				});
			}).join('<br>');
			SwalLocale.fire({
				title: item.name,
				html: getLangString('BANK_STRING_39') + '<br><small>' + drops,
				imageUrl: item.media,
				imageWidth: 64,
				imageHeight: 64,
				imageAlt: item.name,
				showCancelButton: true
			})
		} else {
			drops = dropsOrdered.map((drop) => {
				let dropText = ``
				if (drop.minQuantity === drop.maxQuantity) dropText += `${numberWithCommas(drop.maxQuantity)}`
				else dropText += `(${numberWithCommas(drop.minQuantity)} – ${numberWithCommas(drop.maxQuantity)})`
				dropText += ` × <img class="skill-icon-xs mr-2" src="${drop.item.media}">${drop.item.name}`
				dropText += ` <b style='color: rgb(255, 204, 0)'>[${(100 * drop.weight / item.dropTable.weight).toLocaleString(undefined, localeSettings)}%]</b> <b style='color: rgb(255, 204, 0)'>[${simplify(drop.weight, item.dropTable.weight)}]</b>`;
				return dropText;
			}).join('<br>');
			SwalLocale.fire({
				title: item.name,
				html: getLangString('BANK_STRING_39') + '<br><small>' + drops,
				imageUrl: item.media,
				imageWidth: 64,
				imageHeight: 64,
				imageAlt: item.name,
			})
		}
	}

	const togglePetMarkUnlockRequirements = (patchFlag) => { game.pets.getObjectByID('melvorF:Mark').isCO = patchFlag }
	const coSummoningPatch = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		// Called in onCharacterLoaded
		patchSummoningDrops(patchFlag)
		patchShopItemsForSummoning(patchFlag)
		patchSummoningEquipRequirements(patchFlag)
		patchSkill(patchFlag, 'melvorD:Summoning', 'Non-Combat')

		// Called in onInterfaceReady
		patchSummoningSkillProgress(patchFlag)
		togglePetMarkUnlockRequirements(patchFlag)
		patchSkillingFamiliars(patchFlag)
		patchCartographyEntryRequirements(patchFlag)

		// patchSkill(patchFlag, 'melvorD:Summoning', 'Combat', 'Non-Combat')
		// unlockSkill(patchFlag, 'melvorD:Summoning', "Non-Combat")
		// makeSkillCombatOnly(patchFlag, 'melvorD:Summoning', 'Non-Combat')
		// moveSkillSidebarToCategoryFromCategory(patchFlag, 'melvorD:Summoning', 'Combat', 'Non-Combat')
		// patchSidebar(patchFlag, "melvorD:Summoning", "Non-Combat")
		// patchSynergySearch(patchFlag)
	}



	// ## Mark Rebalance
	const coMarkRebalance = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		setFamiliarLevelMap()
		resetAllowQuantity(patchFlag)
		// patchMarkMechanics()
	}
	const summoningSlots = ['Summon1', 'Summon2']
	let familiarLevelMap = new Map() // Maps familiars to their mark level
	const atMaxMarkLevel = (familiar) => { return familiarLevelMap.get(familiar) >= Summoning.markLevels.length }
	const setFamiliarLevelMap = () => { game.summoning.actions.forEach(x => familiarLevelMap.set(x.product, game.summoning.getMarkLevel(x))) }
	// const atMaxMarkLevel = (familiar) => { return game.summoning.getMarkLevel(familiar) >= Summoning.markLevels.length }
	const resetSummoningMarkLevels = () => { // Used for testing purposes only
		game.summoning.marksUnlocked.clear()
	}
	const resetAllowQuantity = (patchFlag) => {
		if (!patchFlag) {
			equipmentSlotData['Summon1'].allowQuantity = true
			equipmentSlotData['Summon2'].allowQuantity = true
		}
	}
	ctx.patch(Summoning, "getChanceForMark").replace(function (o, mark, skill, modifiedInterval) { // Only allow obtaining marks if summon equipped
		if (!(coGamemodeCheck() && markButtonValue()))
			return o(mark, skill, modifiedInterval)

		let equippedModifier = 2;
		if (game.combat.player.equipment.slots.Summon1.item !== mark.product && game.combat.player.equipment.slots.Summon2.item !== mark.product)
			equippedModifier = 0
		return (equippedModifier * modifiedInterval) / (2000 * Math.pow(mark.tier + 1, 2));
	})
	// ## Township
	const enableTown = patchFlag => {
		if (patchFlag) {
			townshipUI.currentPage = 2
			game.township.confirmTownCreation()
			townshipUI.loadTownshipUI()
		}
	}
	const coTownshipPatch = (patchFlag) => {
		if (!coGamemodeCheck())
			return
		patchSkill(patchFlag, "melvorD:Township", "Passive")
		enableTown(patchFlag)
		hideTownshipElements()
	}

	ctx.patch(Game, "createOfflineModal").after((html) => {
		if (!(coGamemodeCheck() && townshipButtonValue()))
			return html
		html = html.replace("<span class='text-danger'>Township Health: 100%</span>", "").replace("<h5 class='font-w600 mb-1'></h5>", "") // Remove Township health from the UI and do some cleanup on empty HTML if necessary
		return html
	})

	const hideTownshipElements = () => {
		if (!coGamemodeCheck())
			return
		const elements = [
			...Object.entries(townshipUI.defaultElements.btn).filter(x => x[0] !== "tasks").map(x => x[1].parentElement),
			...Object.entries(townshipUI.defaultElements.div).filter(x => x[0] !== "container" && x[0] !== "categoryMenu" && x[0] !== "tasks").map(x => x[1]),
			...Object.entries(townshipUI.defaultElements.icon).map(x => x[1]),
			...Object.entries(townshipUI.defaultElements.notifications.global).map(x => x[1]),
			...Object.entries(townshipUI.defaultElements.town).map(x => x[1]),
			...Object.entries(townshipUI.defaultElements.trader).map(x => x[1]),
			document.querySelector("#township-container > div.skill-info"),
			document.querySelector("#TOWNSHIP_ALERT_TUTORIAL"),
			document.querySelector("#TOWN_NO_FOOD_NOTIFICATION"),
			document.querySelector("#TOWN_LOSING_FOOD_NOTIFICATION"),
			document.querySelector("#TOWN_NO_STORAGE_NOTIFICATION"),
			document.querySelector("#TOWN_NO_PRIORITY_NOTIFICATION")
		]
		elements.forEach(x => x?.classList?.add('d-none'))
	}

	const getCOItemList = () => {
		const coRequirementChecker = (requirement, slayerLevelReq = 0) => { // Note that this isn't checking if the requirements are met, but rather whether the requirements are CO-friendly or not
			switch (requirement.type) {
				case 'SkillLevel':
					return game.skills.filter(x => x.isCombat).includes(requirement.skill) // Only CO available skills count
				case 'AllSkillLevels':
					return false // COs cannot unlock all skills
				case 'Completion':
					return false // COs cannot get full completion
				case 'DungeonCompletion':
					return game.dungeons.filter(x => x.isCO).includes(requirement.dungeon)
				case 'SlayerItem':
					const coItems = game.items.filter(x => x.isCO)
					const bypassItems120 = coItems.filter(item => item?.modifiers?.bypassAllSlayerItems > 0)
					const bypassItems99 = coItems.filter(item => item?.modifiers?.bypassSlayerItems > 0)
					if (coItems.includes(requirement.item)) return true
					if (slayerLevelReq <= 120 && bypassItems120.length > 0) return true
					if (slayerLevelReq <= 99 && bypassItems99.length > 0) return true
					return false
				case 'ItemFound':
					return game.items.filter(x => x.isCO).includes(requirement.item)
				case 'ShopPurchase':
					return game.shop.purchases.filter(x => x.isCO).includes(requirement.purchase)
				case 'SlayerTask':
					return SlayerTask.data.filter(x => x.isCO).map(x => x.id).includes(requirement.tier) // This is just for stuff like Mythical Slayer Gear
				case 'MonsterKilled':
					return game.monsters.filter(x => x.isCO).includes(requirement.monster)
				// CO do not have Township so auto-fail these
				case 'TownshipTask':
					return false
				case 'TownshipTutorialTask':
					return false
				case 'TownshipBuilding':
					return false
				case 'CartographyHexDiscovery':
					return false
				case 'CartographyPOIDiscovery':
					return false
			}
		}
		// Reset all: shop purchases, monsters, areas, dungeons, items, upgrades, slayer tasks
		const reset = () => {
			game.shop.purchases.forEach(x => x.isCO = false)
			game.monsters.forEach(x => x.isCO = false)
			game.items.forEach(x => x.isCO = false)
			game.bank.itemUpgrades.forEach((baseItem, upgradeItem) => upgradeItem.isCO = false)
			SlayerTask.data.forEach((taskTier, tierID) => { taskTier.id = tierID; taskTier.isCO = false }) // Make each slayer tier aware of its own tier ID
			game.township.tasks.tasks.registeredObjects = fullTaskMap // Reset to the full list of Township tasks, stored externally to this function
			game.township.tasks.tasks.forEach(task => task.isCO = false)

			game.combatAreas.forEach(x => x.isCO = false)
			game.slayerAreas.forEach(x => x.isCO = false)
			game.dungeons.forEach(x => x.isCO = false)
			// Monsters with no requirements are always accessible
			game.combatAreas.filter(x => !Array.isArray(x.entryRequirements)).forEach(x => x.monsters.forEach(y => y.isCO = true))
			game.slayerAreas.filter(x => !Array.isArray(x.entryRequirements)).forEach(x => x.monsters.forEach(y => y.isCO = true))
			game.dungeons.filter(x => !Array.isArray(x.entryRequirements)).forEach(x => x.monsters.forEach(y => y.isCO = true))
		}

		reset()


		// Misc additions / removals
		const bannedShopPurchases = ["melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire", "melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control", "melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar", "mini_max_cape:Combat_Superior_Max_Skillcape", "mini_max_cape:Combat_Max_Skillcape"].map(x => game.shop.purchases.getObjectByID(x))
		const bannedItems = ["mini_max_cape:Combat_Superior_Max_Skillcape", "mini_max_cape:Combat_Max_Skillcape"].map(x => game.items.getObjectByID(x)) // Universally banned items
		const bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)
		const allowedTaskMap = new Map()
		const coGloves = game.shop.purchases.filter(shopItems => shopItems.contains?.itemCharges !== undefined).map(x => x.contains.itemCharges.item.id) // All gloves
		const bonusItems = ["melvorD:Signet_Ring_Half_B", ...coGloves].map(x => game.items.getObjectByID(x)) // Misc items that don't fit into other categories
		game.items.filter(x => bonusItems.includes(x)).forEach(x => x.isCO = true)

		const itemCheck = () => {
			const coMonsters = game.monsters.filter(x => x.isCO)
			const boneDrops = coMonsters
				.filter(x => x.bones !== undefined) // Remove monsters that don't drop bones
				.map(x => x.bones.item)
			const standardLoots = coMonsters
				.map(x => x.lootTable.drops.map(y => y.item)) // Next we get standard loots
				.reduce((accumulator, current) => accumulator.concat(current), []) // Reduce to flatten ragged array
			const dungeonLoots = game.dungeons.filter(x => x.isCO)
				.map(x => x.rewards) // Remap to rewards as that's all we care about
				.filter(x => x.length > 0) // Remove dungeons that don't reward anything
				.flat()
				.map(x =>
					x.dropTable !== undefined ? // dropTable is for openable chests
						x.dropTable.drops.map(y => y.item) : // Iterate through chest items and collect ids
						x // Other dungeon rewards that aren't chests, e.g. fire cape, infernal core, etc
				).flat()
			const dungeonChests = game.dungeons.filter(x => x.isCO) // Need to add the actual chest items themselves too
				.map(x => x.rewards) // Remap to rewards as that's all we care about
				.filter(x => x.length > 0) // Remove dungeons that don't reward anything
				.flat()
			const eventLoot = game.dungeons.filter(x => x.isCO) // Events such as IDE
				.filter(x => x?.event !== undefined)
				.map(x => x.event.itemRewards).flat()
			const herbLoots = game.items.filter(x => game.farming.getHerbFromSeed(x)).filter(x => x.isCO).map(x => game.farming.getHerbFromSeed(x))
			let townshipDrops = []
			if (townshipButtonValue()) // Only include if Township is enabled
				townshipDrops = game.township.tasks.tasks.filter(task => task.isCO).map(task => task.rewards.items).flat().map(x => x.item)
			const allDrops = [...boneDrops, ...standardLoots, ...dungeonLoots, ...dungeonChests, ...eventLoot, ...herbLoots, ...townshipDrops]

			game.items.filter(x => allDrops.includes(x)).forEach(x => x.isCO = true) // Set all of these drops to be CO-friendly
		}

		const monsterCheck = () => {
			// Random exceptions that behave weirdly / uniquely
			const bannedAreas = ["melvorD:UnknownArea"].map(x => game.combatAreas.getObjectByID(x))
			const includedMonsters = ["melvorF:Bane", "melvorF:WanderingBard", ...game.combat.spiderLairMonsters.map(x => x.id)].map(x => game.monsters.getObjectByID(x))
			const bannedMonsters = ["melvorTotH:RandomSpiderLair"].map(x => game.monsters.getObjectByID(x))

			const areaList = [...game.combatAreas.allObjects, ...game.slayerAreas.allObjects, ...game.dungeons.allObjects].filter(x => !bannedAreas.includes(x))

			var coAreas = areaList.filter(area => area.entryRequirements.every(req => {
				if (req.type === 'SlayerItem') return coRequirementChecker(req, area.entryRequirements.filter(x => x.type === "SkillLevel")[0].level) // Also pass the area's level requirement along with the slayer item. This is for 99 slayer cape vs 120 slayer cape checking
				else return coRequirementChecker(req)
			}))
			coAreas = coAreas.filter(area => { if (area.hasBarrierMonsters) return summoningButtonValue(); else return true })

			const coMonsterList = new Set([...coAreas.map(area => area.monsters).flat(), ...includedMonsters].filter(x => !bannedMonsters.includes(x)))
			const coSlayerTaskList = new Set([...coMonsterList].filter(x => x.canSlayer).map(monster => SlayerTask.data.filter(tier => tier.minLevel <= monster.combatLevel && monster.combatLevel < tier.maxLevel)).flat())

			coAreas.forEach(x => x.isCO = true)
			coMonsterList.forEach(x => x.isCO = true)

			coSlayerTaskList.forEach(tier => {
				SlayerTask.data[tier.id].isCO = true
			})
		}

		const upgradeCheck = () => {
			const coDrops = new Set(game.items.filter(x => x.isCO))
			const upgradeItems = [...game.bank.itemUpgrades].filter(([baseItem, itemUpgrade]) =>
				!(baseItem instanceof PotionItem) && // Remove potion upgrades, as these require mastery
				itemUpgrade[0].rootItems.every(y => coDrops.has(y)) && // Check if the root items for the upgrade are CO items
				itemUpgrade[0].itemCosts.every(y => coDrops.has(y.item)) // Check if the item upgrade costs are also CO items
			).map(([baseItem, itemUpgrade]) => itemUpgrade[0].upgradedItem)

			game.items.filter(x => upgradeItems.includes(x)).forEach(x => x.isCO = true) // Set all new items to isCO
		}


		const shopCheck = () => {
			const coDrops = new Set(game.items.filter(x => x.isCO))

			const shopPurchases = game.shop.purchases // These are items that show up in the shop
				.filter(x => !bannedShopPurchases.includes(x)) // No banned shop items
				.filter(x => !x.category.isGolbinRaid) // No Golbin Raid items
				.filter(shopItem => shopItem.purchaseRequirements.every(reqs => coRequirementChecker(reqs))) // Check all purchase requirements, e.g. skill reqs, township reqs, etc...
				.filter(x => x.costs.items.every(y => coDrops.has(y.item))) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
			const shopItems = shopPurchases // These are the actual items that go into your bank
				.map(x => x.contains.items) // Map shop items to the items purchased (e.g. Standard Slayer Resupply => {Crabs, Light Runes, Sapphire Bolts, ...})
				.flat()
				.map(x => x.item)

			game.shop.purchases.filter(x => shopPurchases.includes(x)).forEach(x => x.isCO = true) // Set all new shop items to isCO
			game.items.filter(x => shopItems.includes(x)).forEach(x => x.isCO = true)
		}

		const chestCheck = () => {
			const coChests = game.items.filter(x => x.isCO).filter(x => x instanceof OpenableItem) // Get all chests, note some chests don't come from dungeons
			const coChestsItems = coChests.map(x => x?.dropTable?.drops?.map(y => y.item)).flat() // Get all chest contents
			const chestsAndChestItems = [...coChests, ...coChestsItems]

			game.items.filter(x => chestsAndChestItems.includes(x)).forEach(x => x.isCO = true) // Set all new chests and chest items to isCO
		}

		const townshipCheck = () => {
			if (!townshipButtonValue())
				return
			const allowedTasks = game.township.tasks.tasks.filter(task =>
				!task.goals.skillXP.some(skillTask => bannedSkills.includes(skillTask.skill.id)) // Ignore tasks that require a banned skill
				&& task.goals.items.every(itemTask => itemTask.item.isCO) // Include task if every item is a CO item
				&& task.goals.monsters.every(monsterTask => monsterTask.monster.isCO) // Include task if every monster is a CO monster
				&& (task.goals.items.length > 0 || task.goals.skillXP.length > 0 || task.goals.monsters.length > 0) // At least one of these categories cannot be trivial. Relevant to exclude AoD POI tasks.
			)
			allowedTasks.forEach(task => task.isCO = true)
			Array.from(game.township.tasks.tasks.registeredObjects.entries()).filter(([k, v]) => v.isCO).forEach(([k, v]) => allowedTaskMap.set(k, v))
		}

		let currentLength = -1
		// This loop iteratively checks if adding a shop item, an upgrade item or a new monster etc to the running list of CO-obtainable items makes new items accessible. It runs until a check of all the new items doesn't produce new items to check.
		while (currentLength !== game.items.filter(x => x.isCO).length) {
			currentLength = game.items.filter(x => x.isCO).length

			shopCheck()
			upgradeCheck()
			monsterCheck()
			chestCheck()
			itemCheck()
			townshipCheck()
		}

		game.township.tasks.tasks.registeredObjects = allowedTaskMap
		return game.items.filter(x => x.isCO).filter(x => !bannedItems.includes(x)).map(x => x.id)
	}


	const patchCompletionLogItems = (patchFlag) => {
		if (patchFlag) {
			game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).ignoreCompletion = false
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).ignoreCompletion = false
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Apprentice_Runepack`)?._purchaseRequirements?.set(game.currentGamemode, [])
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Adept_Runepack`)?._purchaseRequirements?.set(game.currentGamemode, [])
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Master_Runepack`)?._purchaseRequirements?.set(game.currentGamemode, [])
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Archmage_Runepack`)?._purchaseRequirements?.set(game.currentGamemode, [])
		} else {
			game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).ignoreCompletion = true
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).ignoreCompletion = true
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Apprentice_Runepack`)?._purchaseRequirements?.set(game.currentGamemode, [{ type: 'SkillLevel', skill: game.township, level: 120 }])
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Adept_Runepack`)?._purchaseRequirements?.set(game.currentGamemode, [{ type: 'SkillLevel', skill: game.township, level: 120 }])
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Master_Runepack`)?._purchaseRequirements?.set(game.currentGamemode, [{ type: 'SkillLevel', skill: game.township, level: 120 }])
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Archmage_Runepack`)?._purchaseRequirements?.set(game.currentGamemode, [{ type: 'SkillLevel', skill: game.township, level: 120 }])
		}
	}
	const setCOFlags = () => {
		getCOItemList() // Reset item list 
		game.pets.forEach(x => x['isCO'] = false) // Reset

		game.pets.filter(x =>
			game.petManager.unlocked.has(x) ||
			x?.skill?.isCombat ||
			x?._langHint?.id === "Combat" ||
			(x?._langHint?.category === "DUNGEON" && game.dungeons.filter(y => y.isCO).map(y => y.name).includes(x.acquiredBy)) || // If unlock requirement is a dungeon, check if the dungeon is a CO dungeon
			(x?._langHint?.category === "SLAYER_AREA" && game.slayerAreas.filter(y => y.isCO).map(y => y.name).includes(x.acquiredBy))
		).forEach(x => x['isCO'] = true)

		game.pets.getObjectByID('melvorF:TimTheWolf').isCO = false // This one still isn't obtainable
		game.pets.getObjectByID('melvorF:Mark').isCO = ctx.characterStorage.getItem('co-summoning-button-value') // This one will be available
	}

	const toggleUnavailableMasteries = (patchFlag) => {
		const collectionLogTabs = [...document.querySelector("#completionLog-container > div").childNodes].slice(3, 12).filter((v, k) => k % 2 === 0) // Get all collection log tabs
		if (patchFlag) {
			document.querySelector("#completionLog-container > div > div:nth-child(3)")?.classList?.add('d-none') // Literally hide masteries tab because CO doesn't have masteries
			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(12) > li.nav-main-item.open > ul > li:nth-child(2)").classList.add('d-none')
			sidebar.category("General").item("Completion Log").subitem("melvorD:CompletionLog:1").rootEl.classList.add('d-none')
			collectionLogTabs.forEach(x => { x.classList.remove('col-xl-20-perc'); x.classList.add('col-xl-25-perc') })
		} else {
			document.querySelector("#completionLog-container > div > div:nth-child(3)").classList.remove('d-none')
			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(12) > li.nav-main-item.open > ul > li:nth-child(2)").classList.remove('d-none')
			sidebar.category("General").item("Completion Log").subitem("melvorD:CompletionLog:1").rootEl.classList.remove('d-none')
			collectionLogTabs.forEach(x => { x.classList.add('col-xl-20-perc'); x.classList.remove('col-xl-25-perc') })
		}
	}
	const toggleUnavailableSkills = (patchFlag) => {
		const combatSkillsContainer = document.querySelector("#skillslog-container").childNodes[0]
		const nonCombatSkillsContainer = document.querySelector("#skillslog-container").childNodes[1]
		completionLogMenu.skills.forEach((value, key) => value.classList.remove('d-none')) // Reset
		if (patchFlag) {
			combatSkillsContainer.append(...nonCombatSkillsContainer.childNodes) // Move all skills to combat area
			completionLogMenu.skills.forEach((value, key) => { if (!key.isCombat) value.classList.add('d-none') })
		} else {
			completionLogMenu.skills.forEach((value, key) => { if (key.isCombat) combatSkillsContainer.append(value); else nonCombatSkillsContainer.append(value); })
		}
	}

	const toggleUnavailablePets = (patchFlag) => {
		setCOFlags(patchFlag)
		completionLogMenu.pets.forEach((value, key) => { if (!key.ignoreCompletion) value.classList.remove('d-none') }) // Reset
		if (patchFlag) {
			// game.pets.filter(x => x?.skill?.isCombat || x?._langHint?.category === "DUNGEON" || x?._langHint?.category === "SLAYER_AREA").forEach(x => x.isCO = true)
			completionLogMenu.pets.forEach((value, key) => { if (!key.isCO) value.classList.add('d-none') })
		}
	}
	const toggleUnavailableItems = (patchFlag) => {
		setCOFlags(patchFlag)
		completionLogMenu.items.forEach((value, key) => { if (!key.ignoreCompletion) value.classList.remove('d-none') }) // Reset

		if (patchFlag)
			completionLogMenu.items.forEach((value, key) => { if (!key.isCO) value.classList.add('d-none') })
	}
	const toggleUnavailableMonsters = (patchFlag) => {
		setCOFlags(patchFlag)
		completionLogMenu.monsters.forEach((value, key) => { if (!key.ignoreCompletion) value.classList.remove('d-none') }) // Reset

		if (patchFlag)
			completionLogMenu.monsters.forEach((value, key) => { if (!key.isCO) value.classList.add('d-none') })
	}

	const createSetVisibleButton = () => {
		let a = document.createElement("div");
		document.querySelector("#completionLog-container > div > div:nth-child(1) > div > div > div > div.media-body").appendChild(a)
		a.outerHTML =
			`<div class="expansion-1-show">
	<h5 class="font-w600 text-left text-muted mb-0"> Combat Only
	<small class="comp-log-percent-hcco">0%</small>
	<button class="btn btn-sm btn-outline-info ml-2 btn-visible-completion-hcco" onclick="game.completion.setVisibleCompletion('hcco');" id="hcco-visible-completion-button">Set Visible</button>
	</h5>
	<div class="font-size-sm mb-2">
	<div class="progress active mr-1 mt-2 ml-1" style="height:10px">
	<div class="comp-log-percent-progress-hcco progress-bar bg-co-progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
	</div>
	</div>
	</div>
	</div>`
	}

	// Completion.prototype.coNamespaceID = "combat_only"
	Completion.prototype.coNamespaceID = ctx.namespace
	Completion.prototype.totalProgressCO = 0

	Object.defineProperty(game.completion, 'totalProgressCO', {
		get() { return this.totalProgressMap.get(this.coNamespaceID); },
		configurable: true
	})

	const patchGame = () => {
		if (!coGamemodeCheck())
			return

		filterItemLog = (filter) => {
			$('#searchTextbox-items').val('');
			toggleUnavailableItems(game.completion.visibleCompletion === game.completion.coNamespaceID)
			let shouldShow;
			switch (filter) {
				case 0:
					shouldShow = (item, found) => found || !item.ignoreCompletion
					break;
				case 1:
					shouldShow = (_, found) => found
					break;
				case 2:
					shouldShow = (item, found) => !found && !item.ignoreCompletion
					break;
				case 3:
					shouldShow = (item, _) => (item.namespace === 'melvorD' || item.namespace === 'melvorF') && !item.ignoreCompletion
					break;
				case 4:
					shouldShow = (item, _) => item.namespace === 'melvorTotH' && !item.ignoreCompletion
					break;
				case 5:
					shouldShow = (item, _) => item.namespace === "melvorAoD" && !item.ignoreCompletion;
					break;
				case 6:
					shouldShow = (item, _) => item.ignoreCompletion
					break;
			}
			let itemList = game.items;
			if (game.completion.visibleCompletion === game.completion.coNamespaceID)
				itemList = game.items.filter(x => x.isCO || (filter === 5 ? x.ignoreCompletion : false))
			itemList.forEach((item) => {
				const element = completionLogMenu.items.get(item);
				if (element === undefined)
					return;
				const found = game.stats.itemFindCount(item) > 0;
				if (shouldShow(item, found))
					showElement(element);
				else
					hideElement(element);
			});
		}

		buildItemLog = (game) => {
			if (!itemLogLoaded) {
				const container = document.getElementById('itemlog-container');
				$(container).html(`<div class="col-12 text-center"><span class="spinner-border text-info skill-icon-md"></span></div>`);
				window.setTimeout(() => {
					container.textContent = '';
					const baseGameContainer = createElement('div', {
						className: 'row',
						parent: container
					});
					const progressContainer = createElement('div', {
						className: 'col-12 col-lg-6',
						parent: baseGameContainer
					});
					buildCompletionProgress(progressContainer, completionLogMenu.itemProgress, 'LOG_ITEMS_DESC');
					$(baseGameContainer).append(`
	<div class="col-12 col-md-6">
	  <div class="form-group col-12 mb-0">
		<div class="input-group">
		  <input type="text" class="form-control text-danger" id="searchTextbox-items" name="searchTextbox-items" placeholder="Search Item Log...">
		  <div class="input-group-append">
			<button type="button" class="btn btn-danger" onclick="clearItemLogSearch();">X</button>
		  </div>
		</div>
	  </div>
	</div>
	<div class="col-12">
	<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(0);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_0')}</button>
	<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(1);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_1')}</button>
	<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(2);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_2')}</button>
	${cloudManager.hasExpansionEntitlement ? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(3);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_3')}</button>` : ''}
	${cloudManager.hasTotHEntitlement ? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(4);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_4')}</button>` : ''}
	${cloudManager.hasAoDEntitlement ? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(5);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_AOD')}</button>` : ''}
	<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(6);">Show Ignored</button> 
	</div>`);
					const namespaceContainers = new Map();
					game.registeredNamespaces.forEach((namespace) => {
						switch (namespace.name) {
							case "melvorD":
							case "melvorF":
								namespaceContainers.set(namespace.name, baseGameContainer);
								break;
							default:
								{
									if (!game.items.hasObjectInNamespace(namespace.name))
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
					});
					game.items.forEach((item) => {
						var _a;
						const itemCompletion = new ItemCompletionElement();
						itemCompletion.className = 'bank-item no-bg btn-light pointer-enabled m-1 resize-48';
						(_a = namespaceContainers.get(item.namespace)) === null || _a === void 0 ? void 0 : _a.append(itemCompletion);
						itemCompletion.updateItem(item, game);
						if (item.ignoreCompletion)
							hideElement(itemCompletion);
						completionLogMenu.items.set(item, itemCompletion);
					});
					game.completion.updateItem(game.items.firstObject);
					$('#searchTextbox-items').click(function (e) { updateItemLogSearchArray(game); });
					$('#searchTextbox-items').keyup(function () {
						const search = $('#searchTextbox-items').val();
						updateItemLogSearch(search);
					});
					filterItemLog(0)
				}, 1000);
				itemLogLoaded = true;
			}
		}
	}
	function updateItemLogSearchArray(game) {
		let itemLog = game.items.allObjects;
		if (game.completion.visibleCompletion === game.completion.coNamespaceID)
			itemLog = itemLog.filter(x => x.isCO || x.ignoreCompletion)

		itemLogSearch = itemLog.map((item) => {
			return {
				item,
				name: item.name,
				category: item.category,
				description: item.description,
				type: item.type,
			};
		});
	}

	ctx.patch(ItemCompletionElement, "getItemTooltipHTML").after(function (result, item, game) {
		if (!coGamemodeCheck())
			return result
		// Modify ignored items to include their description
		if (!item.ignoreCompletion)
			return result

		const ignoreCompletion = `<br><span class='text-danger'>${getLangString('STATISTICS_MISC_0')}</span>`;
		const statDescription = getItemStatDescriptions(item, " <small class='text-warning'>", '<br>', '</small>');
		const itemTooltip = "<div class='text-center'>" + item.name + "<small class='text-info'> " + statDescription + ignoreCompletion + '</small></div>';

		return itemTooltip
	})

	// ## Rerolling
	const coRepeatSlayerTaskButton = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		if (patchFlag) {
			document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox").classList.add('d-none')
			document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox > div").classList.add('d-none')
			document.querySelector("#slayerRadioDiv").classList.remove('d-none')
		} else {
			document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox").classList.remove('d-none')
			document.querySelector("#combat-slayer-task-menu > div > div > settings-checkbox > div").classList.remove('d-none')
			document.querySelector("#slayerRadioDiv").classList.add('d-none')
		}
	}
	// ## Mod Patch Notes

	const generateLogFile = () => {
		let logfile = ''
		let generatedHtml = `<h5 class='font-w600 mb-1'><hr></hr></h5>`
		let checkedMonsters = new Set()
		const htmlDropTableGenerator = (drops, totalWeight) => {
			// const tdStyle = 'style="min-width:100px;border:1px solid red'
			// const thStyle = `style="min-width:150px;"`
			const tdStyle = ''
			const localeSettings = { minimumFractionDigits: 0, maximumFractionDigits: 2 }
			let htmlString = `<table border="1" style="margin:0 auto"><tr><th style="min-width:300px">Item</th><th style="min-width:150px">Quantity</th><th style="min-width:175px" colspan="2">Drop Rate</th></tr>`
			drops.forEach(drop => {
				htmlString += `<tr><td ${tdStyle}><img class="skill-icon-xs mr-2" src="${drop.item.media}">${drop.item.name}</td><td ${tdStyle}>`
				if (drop.minQuantity === drop.maxQuantity) htmlString += `${drop.maxQuantity}`
				else htmlString += `(${drop.minQuantity} – ${drop.maxQuantity})`
				htmlString += `<td>${(100 * drop.weight / totalWeight).toLocaleString(undefined, localeSettings)}%</td><td ${tdStyle}>${simplifyFraction(drop.weight, totalWeight)}</td></tr>`
			})
			htmlString += `</table>`
			return htmlString
		}
		const simplifyFraction = (numerator, denominator) => {
			var gcd = function gcd(a, b) {
				return b ? gcd(b, a % b) : a;
			};
			gcd = gcd(numerator, denominator);
			return `${numerator / gcd}/${denominator / gcd}`;
		}
		// Sorting template: arr.sort((a, b) => a.first < b.first ? -1 : a.first === b.first ? a.second < b.second ? -1 : a.second === a.second ? a.third < b.third ? -1 : 1 : 1 : 1)

		Object.entries(vanillaDrops).sort(([monsterID_a, data_a], [monsterID_b, data_b]) => { // Sort in ascending level order
			const [lootDropperKey_a, tableKey_a] = chestOrMonsterChecker(data_a.chestOrMonster)
			const [lootDropperKey_b, tableKey_b] = chestOrMonsterChecker(data_b.chestOrMonster)
			return data_b.chestOrMonster.charCodeAt(0) - data_a.chestOrMonster.charCodeAt(0) || // Sort monsters at the top, then sort by combat level, then sort by chest price, then sort alphabetically.
				game[lootDropperKey_a].getObjectByID(monsterID_a)?.combatLevel - game[lootDropperKey_b].getObjectByID(monsterID_b)?.combatLevel ||
				game[lootDropperKey_a].getObjectByID(monsterID_a)?.sellsFor - game[lootDropperKey_b].getObjectByID(monsterID_b)?.sellsFor ||
				game[lootDropperKey_a].getObjectByID(monsterID_a)?.name.charCodeAt(0) - game[lootDropperKey_a].getObjectByID(monsterID_b)?.name.charCodeAt(0) ||
				game[lootDropperKey_a].getObjectByID(monsterID_a)?.name.charCodeAt(1) - game[lootDropperKey_a].getObjectByID(monsterID_b)?.name.charCodeAt(1)
			// Awful implementation using ternary, but it works.
			// return data_a.chestOrMonster < data_b.chestOrMonster ? 1 : data_a.chestOrMonster === data_b.chestOrMonster ?
			// 	game[lootDropperKey_a].getObjectByID(monsterID_a)?.combatLevel < game[lootDropperKey_b].getObjectByID(monsterID_b)?.combatLevel ? -1 : game[lootDropperKey_a].getObjectByID(monsterID_a)?.combatLevel === game[lootDropperKey_b].getObjectByID(monsterID_b)?.combatLevel ?
			// 		game[lootDropperKey_a].getObjectByID(monsterID_a)?.name < game[lootDropperKey_a].getObjectByID(monsterID_b)?.name ? -1 : 1 : 1 : -1
			// Original implementation that doesn't work really. Works sometimes... by accident
			// if (game.monsters.getObjectByID(a[0])?.combatLevel === undefined) return 1
			// if (game.monsters.getObjectByID(b[0])?.combatLevel === undefined) return -1
			// if (game.monsters.getObjectByID(a[0])?.combatLevel < game.monsters.getObjectByID(b[0])?.combatLevel) return -1
			// if (game.monsters.getObjectByID(a[0])?.combatLevel > game.monsters.getObjectByID(b[0])?.combatLevel) return 1
		}).forEach(([monsterID, data]) => {
			const [lootDropperKey, tableKey] = chestOrMonsterChecker(data.chestOrMonster)

			const monster = game[lootDropperKey].getObjectByID(monsterID)

			// logfile = logfile.concat(`${monster.name} drop table modified:\n`)
			generatedHtml += `<div><div id="monsterImageDiv" style="display:inline-block;width:25%"><h3 style="color:white">${monster.name}</h3><br><img class="swal2-image" width=100 height=100 src="${monster.media}"><br></div>`

			const vanillaDropTableHTML = htmlDropTableGenerator(data.drops, data.totalWeight)
			const modifiedDropTableHTML = htmlDropTableGenerator(game[lootDropperKey].getObjectByID(monsterID)[tableKey].sortedDropsArray, game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight)

			generatedHtml += `<div id="dropTableChangesDiv" style="display:inline-block;width:75%">${vanillaDropTableHTML}<br>&dArr; &dArr; &dArr; <br><br>${modifiedDropTableHTML}</div>`
			// generatedHtml += `<br>Loot Chance: ${data.lootChance} &rArr; ${game[lootDropperKey].getObjectByID(monsterID)?.lootChance}<br>`

			if (vanillaBones[monsterID]?.bones !== undefined) {
				logfile = logfile.concat(`\t× Bones drop ${vanillaBones[monsterID].bones.vanillaBonesDrop} (${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity}).\n`)
				generatedHtml = generatedHtml.concat(`<img class="skill-icon-xs" src=${vanillaBones[monsterID]?.bones.vanillaBonesDrop.media}> <i style="color:yellow">${vanillaBones[monsterID]?.bones.vanillaBonesDrop.name} (${vanillaBones[monsterID]?.bones.vanillaQuantity}) replaced with <img class="skill-icon-xs" src=${game.monsters.getObjectByID(monsterID).bones.item.media}> ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity})
				</i><br>`)
			}

			generatedHtml += `</div><h5 class='font-w600 mb-1'><hr></hr></h5>`

			checkedMonsters.add(monsterID)
			logfile = logfile.concat('\n')
		})
		Object.keys(vanillaBones).filter(monsterID => !checkedMonsters.has(monsterID)).forEach(monsterID => { // These are for monsters who only have bone drop table changes and no standard loot changes
			logfile = logfile.concat(`${game.monsters.getObjectByID(monsterID).name} drop table modified:\n`)
			generatedHtml = generatedHtml += `<img class="swal2-image" width=50 height=50 src="${game.monsters.getObjectByID(monsterID).media}"><br><b style="color:white">${game.monsters.getObjectByID(monsterID).name}</b><br>`

			logfile = logfile.concat(`\t× Bones drop ${vanillaBones[monsterID].bones.vanillaBonesDrop} (${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity}).\n`)
			generatedHtml = generatedHtml += `<i style="color:yellow">Bones drop <img class="skill-icon-xs" src=${vanillaBones[monsterID].bones.vanillaBonesDrop.media}> ${vanillaBones[monsterID].bones.vanillaBonesDrop.name}(${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with <img class="skill-icon-xs" src=${game.monsters.getObjectByID(monsterID).bones.item.media}> ${game.monsters.getObjectByID(monsterID).bones.item.name}(${game.monsters.getObjectByID(monsterID).bones.quantity})</i><br>`
		})

		return { log: logfile, html: generatedHtml }
	}
	const potatoPatchNotes = () => {
		const { log, html } = generateLogFile()
		SwalLocale.fire({
			title: `${game.currentGamemode.localID.toUpperCase()} Drop Table Changes V${versionNumber[0]}.${versionNumber[1]}.${versionNumber[2]}`,
			html: html,
			imageUrl: cdnMedia(`assets/media/bank/${game.currentGamemode.localID === "mcco" ? 'chilli' : 'potato'}.png`),
			imageWidth: 150,
			imageHeight: 150,
			width: '65em'
		})
		document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div").childNodes[4].outerHTML = `<center><h2 class="swal2-title" id="swal2-title" style="display: block;">${game.currentGamemode.localID.toUpperCase()} Drop Table Changes V${versionNumber[0]}.${versionNumber[1]}.${versionNumber[2]}</h2></center>`
		document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div").childNodes[4].appendChild(document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div > div.swal2-actions > button.swal2-confirm.btn.btn-primary.m-1"))
	}

	// ## Settings
	ctx.settings.section("CO Rebalance")
	ctx.settings.section("CO Rebalance").add([
		{
			type: 'label',
			label: `This mod contains several CO-centric changes that will only affect CO characters made through the mod. The changes include several drop table adjustments and a new skill. The goal is to improve the overall CO experience and make end-game TotH content achievable.`,
			// `Includes several changes the CO experience to make pre-expansion content more balanced and post-expansion content completable.  as well as an entire new skill added to the CO arsenal which is in the spirit of the gamemode. New monsters and dungeons are planned for the future.`,
			name: `${buttonNames.rebalance}-label`
		},
		{
			type: 'switch',
			name: `${buttonNames.rebalance}-button`,
			label: 'Enable CO rebalance: Several drop tables adjusted (check CO patch notes at the top of the sidebar) and Combat Max Capes added. Drop tables are mostly rebalanced for runes and for Linden Boat requirements.',
			hint: 'HP capped at 99 until 10k Dark Waters kills.',
			default: false,
			onChange: (value) => {
				if (!coGamemodeCheck())
					return
				ctx.characterStorage.setItem(buttonNames.rebalance, value);
				coRebalancePatch(value);
			}
		},
		{
			type: 'switch',
			name: `${buttonNames.rebalanceQoL}-button`,
			label: `Enable CO QoL changes: Enables multiple QoL fixes that don't affect gameplay.`,
			hint: `The shop items will be filtered to remove unobtainable items and the 90 Cooking requirement on Cooking Upgrade 2 is removed.`,
			default: true,
			onChange: (value) => {
				if (!coGamemodeCheck())
					return
				ctx.characterStorage.setItem(buttonNames.rebalanceQoL, value);
				coRebalanceQoLPatch(value);
			}
		},
		{
			type: 'switch',
			name: `${buttonNames.summoning}-button`,
			label: 'Enable Summoning & AoD: Summoning tablets added to drop tables and AoD areas are unlocked through combat.',
			hint: `Tablets are primarily found in the Strange Cave, in the shop and some other drop tables too. Check the CO patch notes at the top of the sidebar for specific details.`,
			default: false,
			onChange: (value) => {
				if (!coGamemodeCheck())
					return
				ctx.characterStorage.setItem(buttonNames.summoning, value);
				coSummoningPatch(value);
			}
		},
		{
			type: 'switch',
			name: `${buttonNames.marks}-button`,
			label: 'Enable Mark rebalance: Tablets become unlimited at mark level 7, but marks are only obtained with the familiar equipped.',
			default: false,
			onChange: (value) => {
				if (!coGamemodeCheck())
					return
				ctx.characterStorage.setItem(buttonNames.marks, value);
				coMarkRebalance(value)
			}
		},
		{
			type: 'switch',
			name: `${buttonNames.reroll}-button`,
			label: 'Enable repeat slayer tasks button: Current task can be repeated indefinitely, but a penalty of -65% fewer slayer coins and -65% slayer experience will be applied while doing so.',
			hint: `If repeat current task is enabled, the current monster will be set as a slayer task if it is within the selected tier when rolling for a task.`,
			default: false,
			onChange: (value) => {
				if (value === false) {
					if (!coGamemodeCheck())
						return
					// Make the button swap to false if it's disabled entirely, but don't necessarily turn it on when re-enabled
					ctx.characterStorage.setItem(buttonNames.reroll, false);
					//document.querySelector(`#${buttonNames.reroll}-checkbox`).checked = false
				}
				ctx.characterStorage.setItem(buttonNames.rerollEnable, value);
				coRepeatSlayerTaskButton(value)
			}
		},
		{
			type: 'switch',
			name: `${buttonNames.township}-button`,
			label: 'Enable Township Tasks.',
			hint: `Towns not available.`,
			default: false,
			onChange: (value) => {
				if (!coGamemodeCheck())
					return
				ctx.characterStorage.setItem(buttonNames.township, value);
				coTownshipPatch(value)
			}
		}
	])
	ctx.settings.section("Layout")
	ctx.settings.section("Layout").add([{
		type: 'switch',
		name: `${buttonNames.drops}-button`,
		label: 'Use revamped layout for drop tables.',
		hint: `Displays minimum roll, percentage drop chance and table drop weights.`,
		default: false,
		onChange: (value) => {
			if (!coGamemodeCheck())
				return
			ctx.characterStorage.setItem(buttonNames.drops, value);
		}
	}])

	// ## Mod Hooks
	await ctx.onCharacterLoaded(ctx => {
		if (!coGamemodeCheck()) {
			console.log("CO Gamemode not detected, mod will not be loaded.")
			resetAllCharacterStorage()
			return
		}
		registerItems()

		if (mod.api.reroll)
			mod.api.reroll.externalPatchFlag = true

		console.log("Loading CO gamemode...")

		const patchIngameFunctions = () => {
			ctx.patch(Currency, "add").before(function (amount) {
				if (!(rerollEnableButtonValue() || slayerRerollButtonValue()))
					return amount

				const modifyFlag = slayerRerollButtonValue() === undefined ? false : slayerRerollButtonValue() // check if characterStorage is undefined first
				if (this instanceof SlayerCoins)
					amount = Math.max(Math.floor(amount * (1 - 0.65 * modifyFlag)), 1)
				return [amount];
			})

			ctx.patch(Slayer, 'addXP').before((amount, masteryAction) => {
				if (!(rerollEnableButtonValue() || slayerRerollButtonValue()))
					return [amount, masteryAction]

				if (game.combat.enemy.monster === game.combat.slayerTask.monster)
					return [amount * (1 - 0.65), masteryAction]
			})

			ctx.patch(Hitpoints, 'levelCap').get((o) => {
				if (!rebalanceButtonValue())
					return o()

				if (game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Umbora")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Rokken")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Kutul")) >= 10000)
					return cloudManager.hasTotHEntitlement ? 120 : 99;
				else
					return 99;
			})
			ctx.patch(SlayerTask, 'getMonsterSelection').replace(function (o, tier) { // This should always be patched, since it's bugged ingame
				const data = SlayerTask.data[tier];
				if (slayerRerollButtonValue() && rerollEnableButtonValue() && game?.combat?.enemy?.monster?.canSlayer && game?.combat?.enemy?.monster?.combatLevel >= data.minLevel && game?.combat?.enemy?.monster?.combatLevel <= data.maxLevel) { // Check if reroll current task is enabled, check if the monster we are fighting is a slayer monster AND is in the tier of slayer task we are requesting
					return [game.combat.enemy.monster]
				}
				let monsterList = this.game.monsters.filter((monster) => {
					const combatLevel = monster.combatLevel;
					const monsterArea = this.game.getMonsterArea(monster);
					let slayerLevelReq = 0;
					if (monsterArea instanceof SlayerArea)
						slayerLevelReq = monsterArea.slayerLevelRequired;
					return (monster.canSlayer && combatLevel >= data.minLevel && combatLevel <= data.maxLevel && this.checkRequirements(monsterArea.entryRequirements, !this.autoSlayer, slayerLevelReq));
				});
				if (monsterList.length === 1)
					return monsterList // This distinguishes between whether the user can't meet the requirement for any slayer task vs whether they only have 1 completable task
				else
					return monsterList.filter(x => x !== this.monster)
			});
			ctx.patch(Bank, "willItemsFit").replace(function (o, items) { // This fixes resupplies etc so that they don't need one of every item in order to be purchased with a mostly full bank
				const ownedItems = items.filter(({ item }) => this.hasItem(item))
				return this.occupiedSlots + items.length - ownedItems.length <= this.maximumSlots
			})
			ctx.patch(Player, "autoEat").replace(function (o, foodSwapped) { // Fix autoeat potatoes in Arid Plains
				if ((this.hitpoints <= this.autoEatThreshold || foodSwapped) && this.food.currentSlot.item !== this.game.emptyFoodItem) {
					const autoEatHealing = Math.max(Math.floor((this.getFoodHealing(this.food.currentSlot.item) * this.autoEatEfficiency) / 100), 1); // This line is the fix
					let foodQty = Math.ceil((this.autoEatHPLimit - this.hitpoints) / autoEatHealing);
					foodQty = Math.min(foodQty, this.food.currentSlot.quantity);
					this.eatFood(foodQty, false, this.autoEatEfficiency);
					if (this.food.currentSlot.quantity < 1 && this.modifiers.autoSwapFoodUnlocked > 0 && this.game.settings.enableAutoSwapFood) {
						const nonEmptySlot = this.food.slots.findIndex((slot) => slot.item !== this.game.emptyFoodItem);
						if (nonEmptySlot >= 0) {
							this.food.setSlot(nonEmptySlot);
							if (this.hitpoints < this.autoEatHPLimit)
								this.autoEat(true);
						}
					}
				}
			})
			ctx.patch(Summoning, "hasMinibar").get((o) => {
				if (!summoningButtonValue())
					return o()
				else
					return false
			})
			ctx.patch(Summoning, "isCombat").get((o) => {
				if (!summoningButtonValue())
					return o()
				else
					return true
			})



			Object.defineProperty(game, 'playerCombatLevel', {
				get() {
					if (summoningButtonValue()) {
						const base = 0.25 * (this.defence.level + this.hitpoints.level + Math.floor(this.prayer.level / 2) + Math.floor(this.summoning.level / 2));
						const melee = 0.325 * (this.attack.level + this.strength.level);
						const range = 0.325 * Math.floor((3 * this.ranged.level) / 2);
						const magic = 0.325 * Math.floor((3 * this.altMagic.level) / 2);
						const levels = [melee, range, magic];
						return Math.floor(base + Math.max(...levels));
					} else {
						const base = 0.25 * (this.defence.level + this.hitpoints.level + Math.floor(this.prayer.level / 2));
						const melee = 0.325 * (this.attack.level + this.strength.level);
						const range = 0.325 * Math.floor((3 * this.ranged.level) / 2);
						const magic = 0.325 * Math.floor((3 * this.altMagic.level) / 2);
						const levels = [melee, range, magic];
						return Math.floor(base + Math.max(...levels));
					}
				},
				configurable: true
			});
			ctx.patch(Summoning, "checkForPetMark").replace(function (o) {
				if (!summoningButtonValue())
					return o()

				const bannedSkills = game.skills.filter(x => !x.isCombat || x.id === 'melvorD:Summoning').map(x => x.id) // Explicitly include Summoning because Fox cannot be obtained without making tablets
				const unlock = !this.actions.filter(x => x.skills.filter(y => !bannedSkills.includes(y.id)).length > 0).some((mark) => { // Convoluted way to filter to only have combat summon recipes left
					return mark.level <= 99 && this.getMarkCount(mark) < Summoning.markLevels[3];
				})
				if (unlock)
					this.game.petManager.unlockPetByID("melvorF:Mark");
			})
			ctx.patch(Player, "processDeath").replace(function (o) {
				this.removeAllEffects(true);
				this.setHitpoints(Math.floor(this.stats.maxHitpoints * 0.6)); // Modified this line too
				this.manager.addCombatStat(CombatStats.Deaths);
				this.manager.addMonsterStat(MonsterStats.KilledPlayer);
				this.applyDeathPenalty();
				// this.disableActivePrayers(); // Removed this
			})

			game.monsters.forEach(monster => {
				const newWeight = monster.lootTable.weight * (100 - monster.lootChance)
				monster.lootTable.drops = monster.lootTable.drops.map(drop => ({ ...drop, weight: monster.lootChance * drop.weight })) // Modify all weights by their loot chance
				monster.lootTable.drops = [...monster.lootTable.drops, { item: game.items.getObjectByID("melvorD:Empty_Equipment"), maxQuantity: 0, minQuantity: 0, weight: newWeight, vanillaWeight: newWeight }] // Add empty drop
				// delete monster.lootChance // Delete lootChance so that Melvor crashes if something tries to read it (then go fix the crash).
				monster.lootChance = 100
				monster.lootTable.totalWeight = monster.lootTable.drops.reduce((accumulated, current) => accumulated + current?.weight || 0, 0)
			})
			ctx.patch(DropTable, "sortedDropsArray").get(function (o) {
				return [...this.drops.filter(drop => drop.item.id !== "melvorD:Empty_Equipment")].sort((a, b) => b.weight - a.weight);
			})
			// console.log("Is sortedDropsArray patched? ", ctx.isPatched(DropTable, 'sortedDropsArray'))

			// initEffectRebalance()

			ctx.patch(CombatManager, "dropEnemyLoot").replace(function (o, monster) {
				if (!this.game.tutorial.complete)
					return;
				if (rollPercentage(monster.lootChance)) {
					let { item, quantity } = monster.lootTable.getDrop();
					if (item === game.items.getObjectByID("melvorD:Empty_Equipment"))
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
					const event = new MonsterDropEvent(item, quantity, herbItem !== undefined);
					this._events.emit('monsterDrop', event);
				}
			})
		}


		patchIngameFunctions()

		// These are to set the correct initial state
		patchCompletionLogItems(false)
		patchUnavailableShopItems(false)
		patchShopItemsForSummoning(false)

		const patchMarkMechanics = () => {
			Object.defineProperty(Summoning, 'markLevels', { // Add 7th mark level
				get: () => { return markButtonValue() ? [1, 6, 16, 31, 46, 61, 121] : [1, 6, 16, 31, 46, 61] }
			});
			ctx.patch(Summoning, "discoverMark").after(() => {
				if (!markButtonValue())
					return

				// game.summoning.actions.forEach(x => familiarLevelMap.set(x.product, game.summoning.getMarkLevel(x)))
				setFamiliarLevelMap()
			})
			setFamiliarLevelMap()

			ctx.patch(Player, "removeSummonCharge").replace(function (o, slot, interval) {
				if (!markButtonValue())
					return o(slot, interval)

				this.game.summoning.addXPForTabletConsumption(this.equipment.slots[slot].item, interval);
				const event = new SummonTabletUsedEvent(this.equipment.slots[slot].item);
				if (atMaxMarkLevel(this.equipment.slots[slot].item)) { } // No cost if at max level
				else if (!rollPercentage(Math.min(this.modifiers.increasedSummoningChargePreservation - this.modifiers.decreasedSummoningChargePreservation, 80))) {
					// Comment out following line to stop consumption of tablets
					this.game.stats.Summoning.inc(SummoningStats.TabletsUsed);
					if (this.equipment.removeQuantityFromSlot(slot, 1)) {
						this.computeAllStats();
						this.manager.notifications.add({
							type: 'Player',
							args: [this.game.summoning, getLangString('TOASTS_FAMILIAR_OUT_OF_CHARGES'), 'danger'],
						});
					}
					this.game.summoning.renderQueue.synergyQuantities = true;
				}
				// this.processCombatEvent(event);
				this._events.emit('summonTabletUsed', event);
				this.rendersRequired.equipment = true;
			})
		}

		const townshipCleanupPatch = () => {
			// Township cleanup. These disable the passive gain aspects of Township.
			if (game.township._xp !== 0) game.township._xp = 0 // Remove accidnetal Township XP from first implementation
			if (game.petManager.isPetUnlocked(game.pets.getObjectByID("melvorF:B"))) game.petManager.unlocked.delete(game.pets.getObjectByID("melvorF:B")) // Remove accidnetal pets
			ctx.patch(Township, "addXP").replace(function (o, amount, masteryAction) { return }) // Make township give no XP
			ctx.patch(Township, "rollForPets").replace(function (o, interval) { return }) // Make township give no pet
			game.township.casualTasks.currentCasualTasks.forEach(task => { task.rewards.skillXP = [] }) // Remove casual task xp rewards
			ctx.patch(TownshipTasks, "claimTaskRewards").before(function (task) {
				if (!coGamemodeCheck())
					return task
				if (slayerRerollButtonValue())
					// task.rewards.skillXP.forEach(({ skill, quantity }) => { if (skill.id === "melvorD:Slayer") quantity = quantity / 0.35 })
					task.rewards.skillXP.forEach(({ skill, qty }, i) => { if (skill.id === "melvorD:Slayer") task.rewards.skillXP[i].quantity = Math.round(qty / 0.35) })
				return task
			})
			ctx.patch(TownshipTasks, "showTaskCategory").replace(function (o, category) {
				if (!(coGamemodeCheck() && townshipButtonValue()))
					return o(category)

				const element = townshipUI.defaultElements.div.tasks;
				element.innerHTML = '';
				const row = createElement('div', { classList: ['row'] });
				row.append(this.createTaskCompletedBreakdown());
				row.append(this.createTaskButtonHeader());
				if (category !== 'Daily') {
					this.tasks.forEach((task) => {
						if (task.category === category && !this.completedTasks.has(task) && isRequirementMet(task.requirements))
							row.append(this.createTaskElement(task));
					});
				}
				else {
					this.game.township.casualTasks.currentCasualTasks.forEach((task, id) => {
						if (!this.game.township.casualTasks.completedCasualTasks.includes(task))
							row.append(this.createTaskElement(task));
					});
				}
				element.append(row);
				this.activeTaskCategory = category;
			})

			ctx.patch(TownshipTasks, "completeTask").replace(function (o, task, giveRewards = true, forceComplete = false) {
				if (!(coGamemodeCheck() && townshipButtonValue()))
					return o(task, giveRewards, forceComplete)

				if (this.checkTaskCompletion(task) || forceComplete) {
					if (giveRewards) {
						this.removeTaskItemsFromBank(task);
						this.claimTaskRewards(task);
					}
					if (task.category !== 'Daily') {
						this.completedTasks.add(task);
						if (task.category !== 'Birthday2023')
							this._tasksCompleted++;
					} else {
						this.game.township.casualTasks.completeDailyTask(task);
					}
					this.updateAllTasks();
					this.updateAllTaskProgress();
					this.updateTaskCompletedBreakdownText();
					this.showTaskComplete();
					// if (this.activeTaskCategory !== 'None' && this.getCompletedTaskCountInCategory(this.activeTaskCategory) < this.getTaskCountInCategory(this.activeTaskCategory)) // This is the only modified line
					if (this.activeTaskCategory !== 'None') // This is the only modified line. Stop the tasks from collapsing when clicking claim reward.
						this.showTaskCategory(this.activeTaskCategory);
					else
						this.showAllTaskCategories();
					this.checkForTaskReady(true);
					this._events.emit('townshipTaskCompleted', new TownshipTaskCompletedEvent(task));
					this.game.renderQueue.birthdayEventProgress = true;
				}
			})
		}

		ctx.patch(Game, "isAchievementMet").before(function (achievement) { // Doesn't work yet
			if (!coGamemodeCheck())
				return achievement
			var achieveModified = achievement
			if (achievement?.requiredGamemode?.id === "melvorF:Hardcore")
				achieveModified.requiredGamemode = game.gamemodes.getObjectByID("hcco:hcco")
			return achieveModified
		})



		const patchNotify = () => {
			// I am patching these functions because they accidentally trigger all the time in CO
			let temp = notifyCompletionYay;
			let temp2 = notifyCompletionTotH;
			let temp3 = notifyCompletionAoD;
			notifyCompletionYay = () => {
				if (coGamemodeCheck()) return
				temp()
			}
			notifyCompletionTotH = () => {
				if (coGamemodeCheck()) return
				temp2()
			}
			notifyCompletionAoD = () => {
				if (coGamemodeCheck()) return
				temp3()
			}
		}

		townshipCleanupPatch()
		patchMarkMechanics()
		setCOFlags()
		patchNotify()


		if (ctx.characterStorage.getItem(buttonNames.rebalance) === undefined)
			ctx.characterStorage.setItem(buttonNames.rebalance, false)

		if (ctx.characterStorage.getItem(buttonNames.rebalanceQoL) === undefined)
			ctx.characterStorage.setItem(buttonNames.rebalanceQoL, true)

		if (rebalanceButtonValue())
			coRebalancePatch(rebalanceButtonValue())

		if (rebalanceQoLButtonValue())
			coRebalanceQoLPatch(rebalanceQoLButtonValue())

		if (summoningButtonValue()) { // Can't run full coSummoningPatch() because UI elements can't be modified this early
			patchSummoningDrops(summoningButtonValue())
			patchShopItemsForSummoning(summoningButtonValue())
			patchSummoningEquipRequirements(summoningButtonValue())

			game.pages.getObjectByID("melvorD:Summoning").skillSidebarCategoryID = "Combat"
			patchSkill(summoningButtonValue(), 'melvorD:Summoning', 'Non-Combat')
		}
		// coRepeatSlayerTaskButton(rerollEnableButtonValue())
	})

	await ctx.onInterfaceReady(c => {
		if (!coGamemodeCheck()) {
			return
		}

		// HTML Slayer Additions
		const createSlayerRadios = () => {
			const radioButtonValues = {
				manualSlayer: "manual_slayer",
				autoSlayer: "auto_slayer",
				repeatSlayer: "repeat_slayer"
			}

			let radioButtons = document.createElement("div");
			document.querySelector("#combat-slayer-task-menu > div > div").appendChild(radioButtons)
			radioButtons.outerHTML = `
			<div id="slayerRadioDiv">
			<label class="col-12 font-w400 font-size-sm pt-3" align="center">
				<input class="slayerBlock" type="radio" name="slayerRadio" onclick="mod.getContext('hcco').characterStorage.setItem('${buttonNames.reroll}', false); game.settings.boolData.enableAutoSlayer.currentValue = false;document.querySelector('#settings-checkbox-2').checked=false" value="${radioButtonValues.manualSlayer}" id="${radioButtonValues.manualSlayer}"/>
				<b>
					Manually select Slayer tasks
				</b>
			</label>
	
			<label class="col-12 font-w400 font-size-sm pt-3" align="center">
				<input class="slayerBlock" type="radio" name="slayerRadio" onclick="mod.getContext('hcco').characterStorage.setItem('${buttonNames.reroll}', false); game.settings.boolData.enableAutoSlayer.currentValue = true;document.querySelector('#settings-checkbox-2').checked=true" value="${radioButtonValues.autoSlayer}" id="${radioButtonValues.autoSlayer}"/>
				<b>
					Automatically fight new Slayer tasks
				</b>
			</label>
	
			<label class="col-12 font-w400 font-size-sm pt-3" align="center">
				<input class="slayerBlock" type="radio" name="slayerRadio" onclick="mod.getContext('hcco').characterStorage.setItem('${buttonNames.reroll}', true); game.settings.boolData.enableAutoSlayer.currentValue = false; document.querySelector('#settings-checkbox-2').checked=false" value="${radioButtonValues.repeatSlayer}" id="${radioButtonValues.repeatSlayer}"/>
				<b>
					Repeat current enemy for <img class="skill-icon-xxs mr-1" src="https://cdn.melvor.net/core/v018/assets/media/main/slayer_coins.svg">+<img class="skill-icon-xxs mr-1" src="https://cdn.melvor.net/core/v018/assets/media/skills/slayer/slayer.svg"> -65%
				</b>
			</label>
			</div>
			`
		}
		createSlayerRadios()
		ctx.patch(SlayerTaskMenuElement, "toggleAutoSlayerCheckbox").before((unlocked) => {
			if (unlocked) document.querySelector("#slayerRadioDiv > label:nth-child(2)").classList.remove('d-none')
			else document.querySelector("#slayerRadioDiv > label:nth-child(2)").classList.add('d-none')
		})
		if (!game.settings.enableAutoSlayer)
			document.querySelector("#slayerRadioDiv > label:nth-child(2)").classList.add('d-none')


		if (document.getElementById(`${buttonNames.oldReroll}-checkbox`) != undefined) {
			document.getElementById(`${buttonNames.oldReroll}-checkbox`).parentElement.classList.add('d-none') // Hide the other slayer reroll fix button
			mod.getContext('reroll').characterStorage.setItem('reroll-slayer-task', false)
		}
		if (document.getElementById(`slayerRadioDivReroll`) != undefined) {
			document.getElementById(`slayerRadioDivReroll`).classList.add('d-none') // Hide the other slayer reroll fix button
			mod.getContext('reroll').characterStorage.setItem('reroll-slayer-task', false)
		}

		const summoningProgressBars = () => {
			let summoningSkillProgressElement = document.createElement("div");
			document.querySelector("#combat-skill-progress-menu > table").appendChild(summoningSkillProgressElement)
			summoningSkillProgressElement.outerHTML = `<tbody id='summoning-row'>
				<tr>
				<th class="text-center" scope="row">
				<img class="skill-icon-xs" src="assets/media/skills/summoning/summoning.svg">
				</th>
				<td class="font-w600 font-size-sm">
	
				</td>
				<td class="font-w600 font-size-sm">
				<small id="skill-progress-percent-melvorD:Summoning">100%</small>
				</td>
				<td class="font-w600 font-size-sm d-none d-sm-table-cell">
	
				</td>
				<td>
				<div class="progress active" style="height: 8px" id="skill-progress-xp-tooltip-melvorD:Summoning">
	
				</div>
				</div>
				</td>
				<td class="font-w600 xphc d-none" style="text-align: right;" id="xphc-7-rate"><small>...</small></td><td class="font-w600 xphc xphcl d-none" style="text-align: right;"><span id="xphc-7-lvl">...</span> to <input type="number" id="xphc-7-lvl-in" name="xphc-lvl" min="2" style="width: 60px; margin-left: 0.25em;"></td></tr>
				</tbody>`

			document.getElementById('summoning-row').classList.add('d-none')

			skillProgressDisplay.elems.get(game.summoning).percent.push(document.querySelector("#skill-progress-percent-melvorD\\:Summoning")) // Add an xp tracker
			const tooltipBar = document.getElementById(`skill-progress-xp-tooltip-melvorD:Summoning`)
			if (tooltipBar !== null) {
				const tooltip = skillProgressDisplay.createTooltip(tooltipBar, 'Test');
				skillProgressDisplay.elems.get(game.summoning).tooltip.push(tooltip)
			}
		}

		const summoningHTMLModifications = () => {
			game.pages.getObjectByID("melvorD:Summoning").skillSidebarCategoryID = "Combat"
			document.querySelector("#horizontal-navigation-summoning > ul > li:nth-child(2)")?.classList?.add('d-none') // Hide tablets/familiar page
			document.querySelectorAll(`[lang-id=MENU_TEXT_CREATE_FAMILIAR`).forEach(x => x?.parentElement?.parentElement?.classList?.add('d-none')) // Hide all "create tablet" elements on each of the summoning marks
			document.querySelector("#mark-discovery-elements > div:nth-child(2) > h5 > lang-string:nth-child(4)")?.classList?.add('d-none') // Hide message about creating tablets
			document.querySelector("#skill-header-melvorD\\:Summoning > mastery-skill-options")?.classList?.add('d-none') // Hide mastery options entirely
			hideSidebarSkillSubcategory(summoningButtonValue(), "melvorD:Summoning", "Non-Combat")
			document.getElementById("combat-menu-item-6")?.classList?.add("d-none") // Hide summoning combat menu
			document.querySelector("#mark-discovery-elements > div:nth-child(1)")?.classList?.add('d-none')
			document.querySelector("#mark-discovery-elements > div:nth-child(2)")?.classList?.add('d-none')
			document.querySelector("#mark-discovery-elements > div:nth-child(3)")?.classList?.add('d-none')
			document.querySelector("#summoning-container > div.skill-info")?.classList?.add('d-none')
		}


		sidebar.category('Non-Combat').rootEl.classList.add('d-none') // Hide non-combat area instead of remove()ing it, as that would affect Summoning as well
		sidebar.categories().find(x => x.id === "Passive").items().find(x => x.id === `melvorD:Farming`).itemEl.classList.add('d-none') // Hide farming

		summoningProgressBars()

		summoningHTMLModifications()

		patchLevelCap()
		patchCapes(rebalanceButtonValue())
		const patchMarkUI = () => {
			const patchBankQuantity = (familiarItem, value) => {
				familiarItem.validSlots.forEach(x => {
					equipmentSlotData[x].allowQuantity = value
				})
			}
			// if (entry[1].allowQuantity)
			// entry[1].qtyElements = getEquipmentQtyElements(entry[0]);
			ctx.patch(BankSelectedItemMenu, "setItem").before((bankItem, bank) => { // Change bank item to only allow single Mark equip
				if (!markButtonValue())
					return

				let item = bankItem.item
				if (item?.validSlots?.some(x => summoningSlots.includes(x))) { // Check if item is a summoning familiar
					patchBankQuantity(item, !atMaxMarkLevel(item))
				}
			})

			ctx.patch(Player, "equipItem").before((item, set, slot = 'Default', quantity = 1) => { // Hide 
				if (!markButtonValue())
					return

				if (!summoningSlots.includes(slot))
					return

				patchEquipmentQuantity(!atMaxMarkLevel(item), slot)
				return
			})

			ctx.patch(Player, "updateForEquipmentChange").before(function () { // Hide 
				if (!markButtonValue())
					return

				patchEquipmentQuantity(!atMaxMarkLevel(this.equipment.slots.Summon1.item), summoningSlots[0])
				patchEquipmentQuantity(!atMaxMarkLevel(this.equipment.slots.Summon2.item), summoningSlots[1])
			})

		}


		ctx.patch(SynergySearchMenu, "updateFilterOptions").replace(function (o) {
			if (!summoningButtonValue())
				return o()

			const bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)
			const combatFamiliars = game.summoning.actions.filter(x => x.skills.some(y => !bannedSkills.includes(y.id)) && x.id !== "melvorTotH:Fox")// Check neither of the summons are associated with non-combats
			summoningSearchMenu.filterOptions = new Map([...summoningSearchMenu.filterOptions].filter(x => x[0].skills.some(y => !bannedSkills.includes(y.id)) && x[0].id !== "melvorTotH:Fox"))

			combatFamiliars.forEach((mark) => {
				const option = summoningSearchMenu.filterOptions.get(mark);
				if (option === undefined)
					return;
				const item = mark.product;
				if (game.summoning.getMarkLevel(mark) > 0) {
					option.name.textContent = item.name;
					option.image.src = item.media;
					option.link.onclick = () => this.showSynergiesWithMark(mark);
				} else {
					option.name.textContent = getLangString('MENU_TEXT_QUESTION_MARKS');
					option.image.src = cdnMedia('assets/media/main/question.svg');
					option.link.onclick = null;
				}
			});
			// This is a hacky way of removing non-combats. I'm doing it this way because I give up trying to figure out this code. If anyone else wants to figure out the correct way, go ahead. This will probably break when new summons are added.
			const nonCombatFamiliarLocations = [3, 4, 5, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22, 23]
			summoningSearchMenu.filterOptionsContainer.children.forEach((x, i) => {
				if (nonCombatFamiliarLocations.includes(i))
					x.classList.add('d-none')
			})
			const height = (3 * (summoningSearchMenu.filterOptionsContainer.children.length - nonCombatFamiliarLocations.length) + 11) + "vh"
			summoningSearchMenu.filterOptionsContainer.style.height = height
		})

		openSynergiesBreakdown = () => { // This only shows unlocked synergies when you open the summoning synergy search menu. I think this just looks way more clean. 
			var _a;
			if (!game.summoning.isUnlocked) {
				lockedSkillAlert(game.summoning, 'SKILL_UNLOCK_OPEN_MENU');
			} else {
				summoningSearchMenu.updateVisibleElementUnlocks();
				summoningSearchMenu.updateVisibleElementQuantities();
				$('#modal-summoning-synergy').modal('show');
				let markToShow;
				if (((_a = game.openPage) === null || _a === void 0 ? void 0 : _a.action) != undefined) {
					const action = game.openPage.action;
					if (action instanceof Skill)
						markToShow = game.summoning.getMarkForSkill(action);
				}
				if (markToShow !== undefined && game.summoning.getMarkLevel(markToShow) > 0)
					summoningSearchMenu.showSynergiesWithMark(markToShow);
				else
					summoningSearchMenu.showUnlockedSynergies(); // This is the only line that is changed.
			}
		}

		// patchSummoningSynergySearch()

		const patchEquipmentQuantity = (value, slot) => {
			if (value) {
				equipmentSlotData[slot].allowQuantity = true
				equipmentSlotData[slot].qtyElements.forEach(x => x.classList.remove('d-none'))
			} else {
				equipmentSlotData[slot].allowQuantity = false
				equipmentSlotData[slot].qtyElements.forEach(x => x.classList.add('d-none'))
			}
		}
		patchMarkUI()


		patchGame()
		createSetVisibleButton()
		setCOFlags()
		ctx.patch(Completion, "updateSkillProgress").replace(function (o) {
			this.skillProgress.currentCount.clear();
			this.skillProgress.maximumCount.clear();
			setCOFlags();

			if (this.visibleCompletion === this.coNamespaceID) {
				this.game.skills.filter(x => x.isCombat).forEach((skill) => {
					switch (skill.namespace) {
						case "melvorD":
						case "melvorF":
							this.skillProgress.maximumCount.add(skill.namespace, 99);
							this.skillProgress.currentCount.add(skill.namespace, Math.min(skill.level, 99));
							this.skillProgress.currentCount.add(this.coNamespaceID, Math.min(skill.level, 120));
							this.skillProgress.maximumCount.add(this.coNamespaceID, 120);
							if (cloudManager.hasTotHEntitlement) {
								this.skillProgress.currentCount.add("melvorTotH", Math.max(skill.level - 99, 0));
								this.skillProgress.maximumCount.add("melvorTotH", 21);
							}
							break;
						default:
							this.skillProgress.currentCount.add(skill.namespace, Math.min(skill.level, skill.levelCap));
							this.skillProgress.maximumCount.add(skill.namespace, skill.levelCap);
							this.skillProgress.currentCount.add(this.coNamespaceID, Math.min(skill.level, skill.levelCap));
							this.skillProgress.maximumCount.add(this.coNamespaceID, skill.levelCap);
							break;
					}
				});
			} else {
				this.game.skills.forEach((skill) => {
					switch (skill.namespace) {
						case "melvorD":
						case "melvorF":
							this.skillProgress.maximumCount.add(skill.namespace, 99);
							this.skillProgress.currentCount.add(skill.namespace, Math.min(skill.level, 99));
							if (skill.isCombat) {
								this.skillProgress.maximumCount.add(this.coNamespaceID, 120);
								this.skillProgress.currentCount.add(this.coNamespaceID, Math.min(skill.level, 120));
							}
							if (cloudManager.hasTotHEntitlement) {
								this.skillProgress.maximumCount.add("melvorTotH", 21);
								this.skillProgress.currentCount.add("melvorTotH", Math.max(skill.level - 99, 0));
							}
							break;
						default:
							this.skillProgress.currentCount.add(skill.namespace, Math.min(skill.level, skill.levelCap));
							this.skillProgress.maximumCount.add(skill.namespace, skill.levelCap);
							this.skillProgress.currentCount.add(this.coNamespaceID, Math.min(skill.level, skill.levelCap));
							if (skill.isCombat)
								this.skillProgress.maximumCount.add(this.coNamespaceID, skill.levelCap);
							break;
					}
				});
			}
		})

		ctx.patch(Completion, "updateMasteryProgress").replace(function (o) {
			this.masteryProgress.currentCount.clear();
			this.masteryProgress.maximumCount.clear();
			setCOFlags();

			if (this.visibleCompletion === this.coNamespaceID)
				return
			this.game.masterySkills.forEach((skill) => {
				if (!skill.hasMastery)
					return
				skill.addTotalCurrentMasteryToCompletion(this.masteryProgress.currentCount);
				skill.totalMasteryActions.forEach((total, namespace) => {
					this.masteryProgress.maximumCount.add(namespace, total * skill.masteryLevelCap);
					// this.masteryProgress.maximumCount.add(this.coNamespaceID, total * skill.masteryLevelCap);
				});
			});
		})

		ctx.patch(Completion, "updateItemProgress").replace(function (o) {
			this.itemProgress.currentCount.clear();
			this.itemProgress.maximumCount.clear();
			setCOFlags();
			let coFlag = this.visibleCompletion === this.coNamespaceID // Do we have view only CO selected?
			let itemList = coFlag ? this.game.items.filter(x => x.isCO) : this.game.items

			itemList.forEach((item) => {
				if (item.ignoreCompletion)
					return

				if (this.game.stats.itemFindCount(item) > 0) {
					this.itemProgress.currentCount.inc(item.namespace);
					this.itemProgress.currentCount.inc(this.coNamespaceID);
				}
				this.itemProgress.maximumCount.inc(item.namespace);
				if (item.isCO)
					this.itemProgress.maximumCount.inc(this.coNamespaceID);
			});
		})

		ctx.patch(Completion, "updateMonsterProgress").replace(function (o) {
			this.monsterProgress.currentCount.clear();
			this.monsterProgress.maximumCount.clear();
			setCOFlags();

			let coFlag = this.visibleCompletion === this.coNamespaceID // Do we have view only CO selected?
			let monsterList = coFlag ? this.game.monsters.filter(x => x.isCO) : this.game.monsters

			monsterList.forEach((monster) => {
				if (monster.ignoreCompletion)
					return

				if (this.game.stats.monsterKillCount(monster) > 0) {
					this.monsterProgress.currentCount.inc(monster.namespace);
					this.monsterProgress.currentCount.inc(this.coNamespaceID);
				}
				this.monsterProgress.maximumCount.inc(monster.namespace);
				if (monster.isCO) this.monsterProgress.maximumCount.inc(this.coNamespaceID);
			});
		})

		ctx.patch(Completion, "updatePetProgress").replace(function (o) {
			this.petProgress.currentCount.clear();
			this.petProgress.maximumCount.clear();
			setCOFlags();

			let coFlag = this.visibleCompletion === this.coNamespaceID // Do we have view only CO selected?
			let petList = coFlag ? this.game.pets.filter(x => x.isCO) : this.game.pets

			petList.forEach((pet) => {
				if (pet.ignoreCompletion)
					return

				if (this.game.petManager.isPetUnlocked(pet)) {
					this.petProgress.currentCount.inc(pet.namespace);
					this.petProgress.currentCount.inc(this.coNamespaceID);
				}
				this.petProgress.maximumCount.inc(pet.namespace);
				if (pet.isCO) this.petProgress.maximumCount.inc(this.coNamespaceID);
			})
		})

		ctx.patch(CompletionMap, "getCompValue").replace(function (o, namespace) {
			switch (namespace) {
				case "melvorBaseGame":
					return this.getSumOfKeys(["melvorD", "melvorF"]);
				case "melvorTrue":
					return this.getSumOfKeys(["melvorD", "melvorF", "melvorTotH"]);
				default:
					return this.get(namespace);
			}
		})

		ctx.patch(Completion, "updateTotalProgress").before(function () {
			// const previousProgressCO = this.totalProgressMap.get(this.this.coNamespaceID);
			this.totalProgressMap.set(this.coNamespaceID, this.computeTotalProgressPercent(this.coNamespaceID));
			this.renderQueue.totalProgressCO = true;
		})

		ctx.patch(Completion, "computeTotalProgressPercent").replace(function (o, namespace) {
			if (namespace !== this.coNamespaceID)
				o(namespace)
			return ((this.skillProgress.getPercent(namespace) + this.itemProgress.getPercent(namespace) + this.monsterProgress.getPercent(namespace) + this.petProgress.getPercent(namespace)) / 4);
		})

		ctx.patch(Completion, "render").after(function () {
			const sideBarItem = sidebar.category('General').item('Completion Log');
			if (this.renderQueue.totalProgressCO) {
				if (this.visibleCompletion === this.coNamespaceID && sideBarItem.asideEl !== undefined)
					sideBarItem.asideEl.textContent = parseProgress(this.totalProgressCO);
				$('.comp-log-percent-hcco').text(parseProgress(this.totalProgressCO));
				$('.comp-log-percent-progress-hcco').css('width', `${this.totalProgressCO}%`);
				if (this.totalProgressCO >= 100) {
					$('.comp-log-comp-percent-hcco').addClass('text-success');
					$('.comp-log-comp-percent-hcco').addClass('font-w600');
				}
				this.renderQueue.totalProgressCO = false;
			}
		})
		// }
		// ctx.patch(Completion, "buildItemLog").after(function (returnVal) {
		// 	filterItemLog(0)
		// })

		if (game.completion.visibleCompletion === game.completion.coNamespaceID)
			document.getElementById("hcco-visible-completion-button").classList.replace('btn-outline-info', 'btn-info');
		game.completion.updateAllCompletion()

		ctx.patch(Completion, "updateAllCompletion").before(function () {
			toggleUnavailableMonsters(this.visibleCompletion === this.coNamespaceID)
			toggleUnavailableSkills(this.visibleCompletion === this.coNamespaceID)
			toggleUnavailableMasteries(this.visibleCompletion === this.coNamespaceID)
			toggleUnavailableItems(this.visibleCompletion === this.coNamespaceID)
			toggleUnavailablePets(this.visibleCompletion === this.coNamespaceID)
		})
		const patchTownship = (patchFlag) => {
			unlockSkill(patchFlag, "melvorD:Township", "Passive", "Passive")
			hideNonCombatCategory()
			enableTown(patchFlag)

			sidebar.categories().find(x => x.id === "Passive").items().find(x => x.id === `melvorD:Township`).asideEl.classList.add('d-none') // Township isn't a skill and shouldnt have a level
		}
		patchTownship(townshipButtonValue())
		townshipUI.currentPage = 2 // These should be run irrespective of townshipButtonValue
		hideTownshipElements()

		if (summoningButtonValue()) {
			patchSummoningSkillProgress(summoningButtonValue())
			togglePetMarkUnlockRequirements(summoningButtonValue())
			patchSkillingFamiliars(summoningButtonValue())
			patchCartographyEntryRequirements(summoningButtonValue())
		}

		if (markButtonValue()) {
			if (atMaxMarkLevel(game.combat.player.equipment.slots.Summon1.item))
				patchEquipmentQuantity(!atMaxMarkLevel(game.combat.player.equipment.slots.Summon1.item), summoningSlots[0])
			if (atMaxMarkLevel(game.combat.player.equipment.slots.Summon2.item))
				patchEquipmentQuantity(!atMaxMarkLevel(game.combat.player.equipment.slots.Summon2.item), summoningSlots[1])
		}

		coRepeatSlayerTaskButton(rerollEnableButtonValue())
		if (rerollEnableButtonValue()) {
			if (mod.getContext('hcco').characterStorage.getItem(`${buttonNames.reroll}`)) {
				document.querySelector("#repeat_slayer").checked = true
				game.settings.boolData.enableAutoSlayer.currentValue = false
				document.querySelector("#settings-checkbox-2").checked = false
			} else if (game.settings.boolData.enableAutoSlayer.currentValue) {
				document.querySelector("#auto_slayer").checked = true
				document.querySelector("#settings-checkbox-2").checked = true
			} else
				document.querySelector("#manual_slayer").checked = true
		}

		sidebar.category('HCCO Patch', {
			categoryClass: 'pt-1 pb-1 mb-1 bg-dark text-center pointer-enabled',
			nameClass: 'text-white-75 font-w600',
			name: createElement('span', {
				children: [`${game.currentGamemode.localID.toUpperCase()} Patch Notes V${versionNumber[0]}.${versionNumber[1]}`],
			}),
			before: "Expansion 1",
			onClick() { potatoPatchNotes() }
		});
		game.completion.setVisibleCompletion(ctx.namespace); // Set it so that "CO" is the default completion setting.
		// checkSidebarCategories()
		hideNonCombatCategory()
		if (ctx.characterStorage.getItem("hasShownOfflineCombatModalBefore") !== undefined && game.settings.enableOfflineCombat === false) {
			showEnableOfflineCombatModal()
			ctx.characterStorage.setItem("hasShownOfflineCombatModalBefore", true)
		}
		console.log("Loading CO gamemode complete.")
	})

}
