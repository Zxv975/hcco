export async function setup(ctx) {
	// Helper patch functions

	const coGamemodeCheck = () => (game.currentGamemode.namespace === 'hcco') // Check if the user is playing a CO game mode

	const buttonNames = {
		rebalance: 'co-rebalance-button-value',
		summoning: 'co-summoning-button-value',
		reroll: 'repeat-slayer-task',
		oldReroll: 'reroll-slayer-task'
	}
	
	const rebalanceButtonValue = () => ctx.characterStorage.getItem(buttonNames.rebalance)
	const summoningButtonValue = () => ctx.characterStorage.getItem(buttonNames.summoning)
	const slayerRerollButtonValue = () => ctx.characterStorage.getItem(buttonNames.reroll)

	// await ctx.gameData.addPackage('data/gamemode.json');
	// await ctx.gameData.addPackage('data/mini_max_capes.json');
	// await ctx.gameData.addPackage('data/resupplies.json');

	//await ctx.loadScript('completion_log.js')

	const removeLootChance = (monsterID) => {
		game.monsters.getObjectByID(monsterID).lootTable.totalWeight *= 100 / game.monsters.getObjectByID(monsterID).lootChance;
		game.monsters.getObjectByID(monsterID).lootChance = 100
	}

	const fixPoisonToad = () => {
		// Fix poison toad drop table by combining the 2 loot rolls into 1 roll. Can do other monsters in future if needed
		removeLootChance("melvorTotH:PoisonToad") // Remove loot chance from poison toad
		game.monsters.getObjectByID("melvorTotH:PoisonToad").lootTable.drops.forEach(x => { if (x.item.id == "melvorTotH:Bitterlyme_Seeds") x.weight = 696 }) // Replace empty drops with bitterlyme seeds
	}

	const chestOrMonsterChecker = (chestOrMonster) => {  // Chests and monsters behave the same but with different keys for whatever reason lol
		let lootDropperKey = ''
		let tableKey = ''
		if (chestOrMonster.toLowerCase() == 'chest') {
			lootDropperKey = 'items'
			tableKey = 'dropTable'
		} else if (chestOrMonster.toLowerCase() == 'monster') {
			lootDropperKey = 'monsters'
			tableKey = 'lootTable'
		} else {
			throw new Error(`${chestOrMonster} must be either 'chest' or 'monster'.`)
		}
		return { lootDropperKey, tableKey }
	}

	let vanillaDrops = {}
	let modifications = {}

	const patchDropTable2 = (monsterID, chestOrMonster, patchFlag, oldItemsToPatch, newItemsToInclude, bypass = false) => {
		// Check if the weights we remove from the drop table are all replaced by new weights
		if (!bypass)
			if (oldItemsToPatch.reduce((a, c) => a + c.weight ?? 0, 0) != newItemsToInclude.reduce((a, c) => a + c.weight ?? 0, 0)) // || 0 is for handling cases where weight is undefined
				throw new Error(`The sum of weights (${oldItemsToPatch.reduce((a, c) => a + c.weight, 0)}) removed does not total the sum of weights added (${newItemsToInclude.reduce((a, c) => a + c.weight, 0)}) in ${monsterID}.`)

		// Save vanilla values to database
		const { lootDropperKey, tableKey } = chestOrMonsterChecker(chestOrMonster)
		const state = JSON.stringify({ monsterID, chestOrMonster, oldItemsToPatch, newItemsToInclude })

		if (vanillaDrops[monsterID] == undefined)
			vanillaDrops[monsterID] = {}
		game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.forEach(x => {
			if (vanillaDrops[monsterID][x.item.id] == undefined) // Check if monster is in database
				vanillaDrops[monsterID][x.item.id] = {
					'vanillaWeight': x.weight,
					'vanillaMinQuantity': x.minQuantity,
					'vanillaMaxQuantity': x.maxQuantity
				}
		})
		// Add or remove modifications based on patchFlag state
		if (modifications[monsterID] == undefined)
			modifications[monsterID] = new Set()
		modifications[monsterID].add(state)
		newItemsToInclude.forEach(x => {
			if (patchFlag) {
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops = [
					...game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.filter(y => y.item.id != x.id),
					{ 'item': game.items.getObjectByID(x.id), 'minQuantity': x.minQuantity, 'maxQuantity': x.maxQuantity, 'weight': x.weight }
				]
				//[...game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.filter(x => !newItemsToInclude.map(y => y.item.id).includes(x.id)), ...newItemsToInclude] // The filter prevents repeat additions
			} else {
				game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.filter(y => y.item.id != x.id)
				modifications[monsterID].forEach(x => { if (x == state) modifications[monsterID].delete(state) })
			}
		})

		oldItemsToPatch.forEach(x => {
			let matchingItemDrop = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.filter(y => y.item.id == x.id)[0]
			if (matchingItemDrop == undefined) {
				throw new Error(`Item ${x.id} not found in Melvor item database for monster ${monsterID}.`)
			}
			matchingItemDrop.weight = vanillaDrops[monsterID][x.id].vanillaWeight - [...modifications[monsterID]].reduce((a, c) => a + JSON.parse(c)?.oldItemsToPatch.filter(y => y.id == x.id)[0]?.weight ?? 0, 0)
			// Overwrite values or restore values from saved database
			if (patchFlag) {
				// Set drop quantity to supplied values
				// if (x.weight != undefined) matchingItemDrop.weight -= x.weight
				if (x.minQuantity != undefined) matchingItemDrop.minQuantity = x.minQuantity
				if (x.maxQuantity != undefined) matchingItemDrop.maxQuantity = x.maxQuantity
			} else {
				// Reset drop quantities to base values
				// matchingItemDrop.weight = vanillaDrops[monsterID][x.id] - modifications[monsterID].reduce((a, c) => a + c?.weight || 0, 0)
				matchingItemDrop.minQuantity = vanillaDrops[monsterID][x.id].vanillaMinQuantity
				matchingItemDrop.maxQuantity = vanillaDrops[monsterID][x.id].vanillaMaxQuantity
			}
		})
	}


	const patchBoneTable = (monsterToPatch, patchFlag, bonesToPatch) => {
		// bonesToPatch = {id, quantity} // This is a reference
		if (vanillaDrops[monsterToPatch] == undefined) { // Check if monster is in database
			vanillaDrops[monsterToPatch] = {}
		}
		if (vanillaDrops[monsterToPatch].bones == undefined) // Check if item is in database
			vanillaDrops[monsterToPatch].bones = {
				'vanillaBones': game.monsters.getObjectByID(monsterToPatch).bones.item,
				'vanillaQuantity': game.monsters.getObjectByID(monsterToPatch).bones.quantity
			}
		if (patchFlag) {
			game.monsters.getObjectByID(monsterToPatch).bones.item = game.items.getObjectByID(bonesToPatch.id)
			game.monsters.getObjectByID(monsterToPatch).bones.quantity = bonesToPatch.quantity
		} else {
			game.monsters.getObjectByID(monsterToPatch).bones.item = vanillaDrops[monsterToPatch].bones.vanillaBones
			game.monsters.getObjectByID(monsterToPatch).bones.quantity = vanillaDrops[monsterToPatch].bones.vanillaQuantity
		}
	}

	const patchAutoSwapFood = (patchFlag) => {
		let autoSwapFood = [...[...shopMenu.tabs.values()][0].menu.items].filter(x => x[0]?.id == 'melvorD:AutoSwapFood')
		if (patchFlag) {
			game.shop.purchases.getObjectByID("melvorD:AutoSwapFood").purchaseRequirements = [];
			if (autoSwapFood.length > 0) // This is false when the item is already purchased
				autoSwapFood[0][1].item.mediaBody.childNodes[3].childNodes[0].classList.add('d-none')
		}
		else {
			game.shop.purchases.getObjectByID("melvorD:AutoSwapFood").purchaseRequirements = [{ "type": "SkillLevel", "skill": game.cooking, "level": 90 }];
			if (autoSwapFood.length > 0)
				autoSwapFood[0][1].item.mediaBody.childNodes[3].childNodes[0].classList.remove('d-none')
		}
	}

	const patchMonsterDrops = (patchFlag) => {
		// Bones
		patchBoneTable("melvorTotH:RaZu", patchFlag, { "id": "melvorTotH:Lightning_Rune", "quantity": 800 })

		// Chests
		patchDropTable2("melvorTotH:Ancient_Chest", "chest", patchFlag, [{ 'id': "melvorTotH:Carrion_Bark", "weight": 14 }, { "id": "melvorTotH:Jungle_Spores", 'weight': 5 }], [{ 'id': "melvorTotH:Linden_Logs", 'weight': 19, 'minQuantity': 150, 'maxQuantity': 300 }])
		patchDropTable2("melvorTotH:Burning_Chest", "chest", patchFlag, [{ 'id': "melvorTotH:Infernal_Bones", "weight": 10 }, { "id": "melvorTotH:Charcoal", 'weight': 6 }, { "id": "melvorF:Ash", 'weight': 6 }], [{ 'id': "melvorTotH:Palladium_Bar", 'weight': 22, 'minQuantity': 50, 'maxQuantity': 150 }])
		patchDropTable2('melvorD:Magic_Chest', 'chest', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Ancient_Rune", 'minQuantity': 500, 'maxQuantity': 1500 }
		], [])
		patchDropTable2("melvorF:Miolite_Chest", "chest", patchFlag, [
			{ 'id': "melvorF:Miolite_Boots", 'weight': 47 },
			{ "id": "melvorF:Miolite_Helmet", "weight": 23 },
			{ "id": "melvorF:Miolite_Shield", "weight": 7 },
			{ "id": "melvorF:Miolite_Spore", "weight": 6 },
			{ "id": "melvorF:Miolite_Platelegs", "weight": 5 },
			{ "id": "melvorF:Miolite_Platebody", "weight": 2 }
		], [
			{ 'id': "melvorD:Mist_Rune", 'weight': 20, 'minQuantity': 200, 'maxQuantity': 400 },
			{ "id": "melvorD:Dust_Rune", "weight": 20, "minQuantity": 200, "maxQuantity": 400 },
			{ "id": "melvorF:Mud_Rune", "weight": 20, "minQuantity": 200, "maxQuantity": 400 },
			{ "id": "melvorD:Smoke_Rune", "weight": 10, "minQuantity": 200, "maxQuantity": 400 },
			{ "id": "melvorF:Steam_Rune", "weight": 10, "minQuantity": 200, "maxQuantity": 400 },
			{ "id": "melvorF:Lava_Rune", "weight": 10, "minQuantity": 200, "maxQuantity": 400 }
		])
		patchDropTable2('melvorF:Water_Chest', 'chest', patchFlag, [
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 500, 'maxQuantity': 1000 },
			{ 'id': "melvorD:Blood_Rune", 'minQuantity': 500, 'maxQuantity': 1000 },
			{ 'id': "melvorD:Ancient_Rune", 'minQuantity': 500, 'maxQuantity': 1000 }
		], [])

		// Monsters
		patchDropTable2("melvorTotH:BurningSnake", "monster", patchFlag, [{ 'id': "melvorTotH:Chilli_Seeds", "weight": 15 }], [
			{ "id": "melvorTotH:Divine_Helmet", "weight": 4, "minQuantity": 1, "maxQuantity": 1 },
			{ "id": "melvorTotH:Divine_Boots", "weight": 4, "minQuantity": 1, "maxQuantity": 1 },
			{ "id": "melvorTotH:Divine_Shield", "weight": 3, "minQuantity": 1, "maxQuantity": 1 },
			{ "id": "melvorTotH:Divine_Platebody", "weight": 2, "minQuantity": 1, "maxQuantity": 1 },
			{ "id": "melvorTotH:Divine_Platelegs", "weight": 2, "minQuantity": 1, "maxQuantity": 1 }
		])
		patchDropTable2("melvorTotH:PoisonToad", "monster", patchFlag, [{ 'id': "melvorTotH:Bitterlyme_Seeds", "weight": 200 }], [{ 'id': "melvorTotH:Poison_Rune", 'weight': 200, 'minQuantity': 20, 'maxQuantity': 60 }])
		patchDropTable2("melvorTotH:FrostGolem", "monster", patchFlag, [{ 'id': "melvorD:Water_Rune", "weight": 49 }], [{ 'id': "melvorTotH:Archaic_Rune", 'weight': 49, 'minQuantity': 35, 'maxQuantity': 80 }])
		patchDropTable2('melvorD:Wizard', 'monster', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 10, 'maxQuantity': 30 }
		], [])
		patchDropTable2('melvorD:MasterWizard', 'monster', patchFlag, [{ 'id': "melvorD:Mind_Rune", 'minQuantity': 5, 'maxQuantity': 10 }], [])
		patchDropTable2('melvorTotH:FrostGolem', 'monster', patchFlag, [{ 'id': "melvorD:Water_Rune", 'minQuantity': 35, 'maxQuantity': 80 }], [])
		patchDropTable2('melvorTotH:MagicFireDemon', 'monster', patchFlag, [{ 'id': "melvorD:Fire_Rune", 'minQuantity': 10, 'maxQuantity': 30 }, { 'id': "melvorF:Lava_Rune", 'minQuantity': 20, 'maxQuantity': 50 }], [])
		patchDropTable2('melvorTotH:GretYun', 'monster', patchFlag, [{ 'id': "melvorTotH:Infernal_Rune", 'minQuantity': 20, 'maxQuantity': 50 }], [])
		patchDropTable2('melvorTotH:IceHydra', 'monster', patchFlag, [{ 'id': "melvorTotH:Calamity_Rune", 'minQuantity': 100, 'maxQuantity': 200 }], [])
		patchDropTable2('melvorTotH:Siren', 'monster', patchFlag, [{ 'id': "melvorTotH:Despair_Rune", 'minQuantity': 15, 'maxQuantity': 30 }], [])
		patchDropTable2('melvorTotH:PolarBear', 'monster', patchFlag, [{ 'id': "melvorTotH:Frost_Crab", 'minQuantity': 50, 'maxQuantity': 80 }, { 'id': "melvorTotH:Frozen_Manta_Ray", 'minQuantity': 150, 'maxQuantity': 300 }], [])
		patchDropTable2('melvorTotH:Cockatrice', 'monster', patchFlag, [{ 'id': "melvorTotH:Decay_Bolts", 'minQuantity': 10, 'maxQuantity': 25 }], [])
		patchDropTable2('melvorTotH:PlagueDoctor', 'monster', patchFlag, [
			{ 'id': "melvorF:Hinder_Potion_III", 'minQuantity': 1, 'maxQuantity': 2 },
			{ 'id': "melvorF:Lethal_Toxins_Potion_III", 'minQuantity': 1, 'maxQuantity': 2 },
			{ 'id': "melvorTotH:Area_Control_Potion_III", 'minQuantity': 1, 'maxQuantity': 2 },
			{ 'id': "melvorTotH:Reaper_Potion_III", 'minQuantity': 1, 'maxQuantity': 2 },
			{ 'id': "melvorF:Famished_Potion_III", 'minQuantity': 1, 'maxQuantity': 2 },
			{ 'id': "melvorTotH:Penetration_Potion_III", 'minQuantity': 1, 'maxQuantity': 2 }
		], [])

		patchDropTable2('melvorF:Vampire', 'monster', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Mind_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 3, 'maxQuantity': 6 },
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 2, 'maxQuantity': 4 }
		], [])
		patchDropTable2('melvorF:Shaman', 'monster', patchFlag, [{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
		patchDropTable2('melvorF:Necromancer', 'monster', patchFlag, [{ 'id': "melvorD:Death_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
		patchDropTable2('melvorF:Elementalist', 'monster', patchFlag, [{ 'id': "melvorF:Havoc_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
		patchDropTable2('melvorTotH:InfernalGolem', 'monster', patchFlag, [{ 'id': "melvorTotH:Infernal_Rune", 'minQuantity': 25, 'maxQuantity': 35 }], [])

		// Soul runes
		const moonwortSeeds = { "id": "melvorTotH:Moonwort_Seeds", "weight": 200 }
		const soulRune = { "id": "melvorTotH:Soul_Rune", "minQuantity": 250, "maxQuantity": 500, "weight": 200 }
		patchDropTable2("melvorTotH:Phantom", "monster", patchFlag, [moonwortSeeds], [soulRune])
		patchDropTable2("melvorTotH:Spectre", "monster", patchFlag, [moonwortSeeds], [soulRune])
		patchDropTable2("melvorTotH:Banshee", "monster", patchFlag, [moonwortSeeds], [soulRune])

		// Absorbing shield
		patchDropTable2("melvorF:Valkyrie", "monster", patchFlag, [], [{ 'id': "melvorF:Absorbing_Shield", 'weight': 0.5, 'minQuantity': 1, 'maxQuantity': 1 }], true)
		game.monsters.getObjectByID('melvorF:Valkyrie').lootTable.totalWeight = 5.5
		game.monsters.getObjectByID('melvorF:Valkyrie').lootChance = 5.5
	}

	const patchUnavailableShopItems = (patchFlag) => {
		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { y.container.classList.remove('d-none') }))
		if (!patchFlag) {
			// let bannedItems = ["hcco:Combat_Max_Skillcape", "hcco:Combat_Superior_Max_Skillcape"]
			//let bannedItems = []
			//shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (y.item.purchase.namespace == "hcco") bannedItems.push(y.item.purchase.id) }))
			//shopMenu.tabs.forEach(x => x.menu.items.forEach(y => y.container.classList.remove('d-none')))
			//shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (bannedItems.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
			shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (y.item.purchase.namespace == "hcco") y.container.classList.add('d-none') })) // Remove Combat max capes from this mod
			return
		}
		const bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)
		//let shopItems = game.shop.purchases.allObjects.filter(x => !x.category.isGolbinRaid).filter(x =>
		let shopItems = game.shop.purchases.allObjects.filter(x =>
			!x.purchaseRequirements.some(y => y.type == 'TownshipBuilding')
		).filter(shopItems =>
			shopItems.purchaseRequirements.length == 0 || // If no purchase requirements then include it
			shopItems.purchaseRequirements.every(reqs =>
				!bannedSkills.includes(reqs?.skill?.id)
			)
		).map(x => x.id)
		let bannedItems = ["melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire", "melvorD:Weird_Gloop", "melvorTotH:Slayer_Torch", "melvorTotH:Mystic_Lantern", "mini_max_cape:Combat_Superior_Max_Skillcape", "mini_max_cape:Combat_Max_Skillcape", "mini_max_cape:Skilling_Superior_Max_Skillcape", "mini_max_cape:Skilling_Max_Skillcape", "melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control", "melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar", "melvorF:Cape_of_Completion", "melvorTotH:Superior_Cape_Of_Completion", "melvorF:Max_Skillcape", "melvorTotH:Superior_Max_Skillcape"]
		//if (!ctx.characterStorage.getItem('co-summoning-button-value'))
		if (!summoningButtonValue())
			bannedItems = [... new Set([...bannedItems, "hcco:Critter_Pack", "hcco:Companion_Pack", "hcco:Familiar_Pack", "hcco:Beast_Pack"])]

		// if (!ctx.characterStorage.getItem('co-rebalance-button-value'))
		if (!rebalanceButtonValue())
			bannedItems = [... new Set([...bannedItems, "hcco:Apprentice_Runepack", "hcco:Adept_Runepack", "hcco:Master_Runepack", "hcco:Archmage_Runepack"])]

		shopItems = shopItems.filter(x => !bannedItems.includes(x))
		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (!shopItems.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
	}
	const patchCompletionLog = (patchFlag) => {
		if (patchFlag) {
			game.items.getObjectByID("hcco:Combat_Max_Skillcape").ignoreCompletion = false
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").ignoreCompletion = false
		} else {
			game.items.getObjectByID("hcco:Combat_Max_Skillcape").ignoreCompletion = true
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").ignoreCompletion = true
		}
	}

	const patchCapes = (patchFlag) => {
		const patchedCapeValue = 25
		const patchedSuperiorCapeValue = 35
		const unpatchedCapeValue = 50
		const unpatchedSuperiorCapeValue = 75

		const shopPrayerCapeItem = Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id == 'melvorF:Prayer_Skillcape')[0]
		const shopSuperiorPrayerCapeItem = Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id == 'melvorTotH:Superior_Prayer_Skillcape')[0]
		if (patchFlag) {
			game.items.getObjectByID("hcco:Combat_Max_Skillcape").modifiers.decreasedPrayerCost = patchedCapeValue
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").modifiers.decreasedPrayerCost = patchedSuperiorCapeValue
			game.items.getObjectByID("melvorF:Prayer_Skillcape").modifiers.decreasedPrayerCost = patchedCapeValue
			game.items.getObjectByID("melvorTotH:Superior_Prayer_Skillcape").modifiers.decreasedPrayerCost = patchedSuperiorCapeValue

			shopPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${patchedCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
			shopSuperiorPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${patchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
		} else {
			game.items.getObjectByID("hcco:Combat_Max_Skillcape").modifiers.decreasedPrayerCost = unpatchedCapeValue
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").modifiers.decreasedPrayerCost = unpatchedSuperiorCapeValue
			game.items.getObjectByID("melvorF:Prayer_Skillcape").modifiers.decreasedPrayerCost = unpatchedCapeValue
			game.items.getObjectByID("melvorTotH:Superior_Prayer_Skillcape").modifiers.decreasedPrayerCost = unpatchedSuperiorCapeValue

			shopPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${unpatchedCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
			shopSuperiorPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${unpatchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
		}
	}

	const patchShopItemsForSummoning = (patchFlag) => {
		let shopMaxCapeItem = Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id == 'hcco:Combat_Max_Skillcape')
		let shopSuperiorMaxCapeItem = Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id == 'hcco:Combat_Superior_Max_Skillcape')
		let shopItemsToModify = ["hcco:Critter_Pack", "hcco:Companion_Pack", "hcco:Familiar_Pack", "hcco:Beast_Pack"]
		if (patchFlag) {
			// Add summoning requirements
			if (!game.shop.purchases.getObjectByID("hcco:Combat_Max_Skillcape").purchaseRequirements.map(x => x.skill.id).includes('melvorD:Summoning')) {
				game.shop.purchases.getObjectByID("hcco:Combat_Max_Skillcape").purchaseRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 99 });
				game.items.getObjectByID("hcco:Combat_Max_Skillcape").equipRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 99 });
			}
			if (!game.shop.purchases.getObjectByID("hcco:Combat_Superior_Max_Skillcape").purchaseRequirements.map(x => x.skill.id).includes('melvorD:Summoning')) {
				game.shop.purchases.getObjectByID("hcco:Combat_Superior_Max_Skillcape").purchaseRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 120 });
				game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").equipRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 120 });
			}
			// Modify cape stats
			game.items.getObjectByID("hcco:Combat_Max_Skillcape").modifiers.increasedSummoningChargePreservation = 0
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").modifiers.increasedSummoningChargePreservation = 0
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").modifiers.increasedSummoningMaxHit = 0
			// Reveal shop requirements
			if (shopMaxCapeItem.length > 0) { // This is false if the item is not in the shop, which shouldn't happen...? But it's good practice I guess
				Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.remove('d-none'); // Show skill requirement in shop front
				Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id == 'melvorF:Summoning_Skillcape')[0][1].container.classList.remove('d-none') // Reveal in shop
			}
			if (shopSuperiorMaxCapeItem.length > 0) { // This is false if the item is not in the shop, which shouldn't happen...? But it's good practice I guess
				Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.remove('d-none');
				Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id == 'melvorTotH:Superior_Summoning_Skillcape')[0][1].container.classList.remove('d-none')
			}
			// Reveal other shop items

			shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (shopItemsToModify.includes(y.item.purchase.id)) y.container.classList.remove('d-none') }))
		} else {
			// Add summoning requirements
			game.shop.purchases.getObjectByID("hcco:Combat_Max_Skillcape").purchaseRequirements = game.shop.purchases.getObjectByID("hcco:Combat_Max_Skillcape").purchaseRequirements.filter(x => x.skill.id != "melvorD:Summoning"); // Remove summoning req
			game.shop.purchases.getObjectByID("hcco:Combat_Superior_Max_Skillcape").purchaseRequirements = game.shop.purchases.getObjectByID("hcco:Combat_Superior_Max_Skillcape").purchaseRequirements.filter(x => x.skill.id != "melvorD:Summoning");
			game.items.getObjectByID("hcco:Combat_Max_Skillcape").equipRequirements = game.items.getObjectByID("hcco:Combat_Max_Skillcape").equipRequirements.filter(x => x.skill.id != "melvorD:Summoning"); // Remove summoning req
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").equipRequirements = game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").equipRequirements.filter(x => x.skill.id != "melvorD:Summoning");

			// Modify cape stats
			game.items.getObjectByID("hcco:Combat_Max_Skillcape").modifiers.increasedSummoningChargePreservation = 10
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").modifiers.increasedSummoningChargePreservation = 15
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").modifiers.increasedSummoningMaxHit = 10
			// Hide shop requirements
			if (shopMaxCapeItem.length > 0) {
				Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.add('d-none'); // Hide skill req in shop front
				Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id == 'melvorF:Summoning_Skillcape')[0][1].container.classList.add('d-none')
			}
			if (shopSuperiorMaxCapeItem.length > 0) {
				Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.add('d-none');
				Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id == 'melvorTotH:Superior_Summoning_Skillcape')[0][1].container.classList.add('d-none')
			}
			// Hide other shop items
			shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (shopItemsToModify.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
		}
	}

	const patchSummoningEquipRequirements = (patchFlag) => {
		if (patchFlag) {
			game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 1 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 5 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 15 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 25 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 35 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 55 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 65 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 80 })]
			game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 90 })]
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 100 })]
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 105 })]
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 110 })]
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 115 })]
		} else {
			game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
			game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements.filter(x => x.skill.id != 'melvorD:Summoning')
		}
	}

	const patchSummoningDrops = (patchFlag) => {
		// Bones
		// Lightning spirit
		patchBoneTable("melvorTotH:LightningSpirit", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 51 })
		patchBoneTable("melvorTotH:LightningMonkey", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 53 })
		patchBoneTable("melvorTotH:LightningGolem", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 58 })
		// Spider familiar
		patchBoneTable("melvorTotH:RandomSpiderLair", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 53 })
		patchBoneTable("melvorTotH:SpiderQueen", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 350 })
		// Necormancer palace
		patchBoneTable("melvorTotH:CursedSkeletonWarrior", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 120 })
		patchBoneTable("melvorTotH:Beholder", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Siren", "quantity": 150 })
		patchBoneTable("melvorTotH:DarkKnight", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 200 })
		patchBoneTable("melvorTotH:Fiozor", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spectre", "quantity": 600 })

		// Monsters
		const eyeball = { "id": "melvorF:Eyeball", "weight": 2 }
		const eyeball2 = { "id": "melvorF:Eyeball", "weight": 4 }
		patchDropTable2('melvorF:LotsofEyes', 'monster', patchFlag, [eyeball], [{ 'id': "melvorF:Summoning_Familiar_Golbin_Thief", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable2('melvorF:ManyEyedMonster', 'monster', patchFlag, [eyeball2], [{ 'id': "melvorF:Summoning_Familiar_Occultist", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Wolf", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable2('melvorF:StrangeEyedMonster', 'monster', patchFlag, [eyeball2], [{ 'id': "melvorF:Summoning_Familiar_Minotaur", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Witch", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable2('melvorF:Eyes', 'monster', patchFlag, [eyeball2], [{ 'id': "melvorF:Summoning_Familiar_Centaur", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Cyclops", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable2('melvorF:SuperiorEyedMonster', 'monster', patchFlag, [eyeball2], [{ 'id': "melvorF:Summoning_Familiar_Yak", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Unicorn", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable2('melvorF:EyeOfFear', 'monster', patchFlag, [eyeball], [{ 'id': "melvorF:Summoning_Familiar_Dragon", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable2('melvorTotH:Siren', 'monster', patchFlag, [{ "id": "melvorTotH:Despair_Rune", "weight": 138, 'minQuantity': 30, 'maxQuantity': 60 }], [{ 'id': "melvorTotH:Summoning_Familiar_Siren", 'weight': 138, 'minQuantity': 10, 'maxQuantity': 50 }])

		const moonwortSeeds = { "id": "melvorTotH:Moonwort_Seeds", "weight": 200 }
		const spectre = { "id": "melvorTotH:Summoning_Familiar_Spectre", "minQuantity": 250, "maxQuantity": 500, "weight": 200 }
		patchDropTable2('melvorTotH:Phantom', 'monster', patchFlag, [moonwortSeeds], [spectre])
		patchDropTable2('melvorTotH:Banshee', 'monster', patchFlag, [moonwortSeeds], [spectre])
		patchDropTable2('melvorTotH:Spectre', 'monster', patchFlag, [moonwortSeeds], [spectre])

		// game.dungeons.getObjectByID("melvorTotH:Lightning_Region").dropBones = patchFlag || ctx.characterStorage.getItem('co-rebalance-button-value')
		game.dungeons.getObjectByID("melvorTotH:Lightning_Region").dropBones = patchFlag || rebalanceButtonValue()
		game.dungeons.getObjectByID("melvorTotH:Lair_of_the_Spider_Queen").dropBones = patchFlag
		game.dungeons.getObjectByID("melvorTotH:Necromancers_Palace").dropBones = patchFlag
	}

	const patchSummoningSkillProgress = (patchFlag) => {
		if (patchFlag) {
			document.getElementById('summoning-row').classList.remove('d-none')
			// Level
			document.querySelector("#combat-skill-progress-menu > table > tbody:nth-child(10) > tr > td:nth-child(2)").appendChild(document.querySelector("#skill-progress-level-melvorD\\:Summoning"))
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList)
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.add('font-w600', 'font-size-sm')
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(1) > span").classList.add('d-none')
			// Xp
			document.querySelector("#combat-skill-progress-menu > table > tbody:nth-child(10) > tr > td.font-w600.font-size-sm.d-none.d-md-table-cell").appendChild(document.querySelector("#skill-progress-xp-melvorD\\:Summoning"))
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList)
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.add("font-w600", "font-size-sm")
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(2) > span.font-w600").classList.add('d-none')
			// Progress bar
			document.querySelector("#skill-progress-xp-tooltip-melvorD\\:Summoning").appendChild(document.querySelector("#skill-progress-bar-melvorD\\:Summoning"))
		} else {
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
		}
	}


	const patchLevelCap = function (patchFlag) { // Cap HP to 99 until after 10000 DW kills
		if (patchFlag)
			Object.defineProperty(game.hitpoints, 'levelCap', {
				get() { // Check if 10000 total Dark Waters kills to unlock 120 HP
					if (game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Umbora")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Rokken")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Kutul")) >= 10000)
						return cloudManager.hasTotHEntitlement ? 120 : 99;
					else
						return 99;
				},
				configurable: true
			})
		else // Default behaviour
			Object.defineProperty(game.hitpoints, 'levelCap', {
				get() { return cloudManager.hasTotHEntitlement ? 120 : 99 },
				configurable: true
			})
		game.combat.player.levels.Hitpoints = Math.min(game.hitpoints.level, game.hitpoints.levelCap)
	}

	const patchLightRunesFromResupplies = (patchFlag) => {
		// const defaultDescription = "+${qty1} Mithril Arrows, +${qty2} Topaz Bolts, +${qty3} Lobsters, +${qty4} Magic Bones, +${qty5} Light Runes" // Have to move light runes to the end
		// const modifiedDescription = "+${qty1} Mithril Arrows, +${qty2} Topaz Bolts, +${qty3} Lobsters, +${qty4} Magic Bones"
		let resupplyShopItems = [game.shop.purchases.getObjectByID("melvorF:Basic_Resupply"), game.shop.purchases.getObjectByID("melvorF:Standard_Resupply"), game.shop.purchases.getObjectByID("melvorF:Generous_Resupply"), game.shop.purchases.getObjectByID("melvorTotH:Plentiful_Resupply"), game.shop.purchases.getObjectByID("melvorTotH:Bountiful_Resupply")]

		if (patchFlag) {
			resupplyShopItems.forEach(x => x.contains.items = x.contains.items.filter(x => x.item.id != "melvorD:Light_Rune")) // Remove light runes
			resupplyShopItems.forEach(x => Object.defineProperty(x, 'isModded', { get() { return true }, configurable: true })); // Set modded flag to be true so that the game reads the custom description
			// resupplyShopItems.forEach(x => x._customDescription = modifiedDescription)
			resupplyShopItems[0]._customDescription = "+${qty1} Mithril Arrows, +${qty2} Topaz Bolts, +${qty3} Lobsters, +${qty4} Magic Bones"
			resupplyShopItems[1]._customDescription = "+${qty1} Adamant Arrows, +${qty2} Sapphire Bolts, +${qty3} Crabs, +${qty4} Magic Bones"
			resupplyShopItems[2]._customDescription = "+${qty1} Rune Arrows, +${qty2} Ruby Bolts, +${qty3} Sharks, +${qty4} Magic Bones"
			resupplyShopItems[3]._customDescription = "+${qty1} Dragon Arrows, +${qty2} Emerald Bolts, +${qty3} Magma Fish, +${qty4} Magic Bones"
			resupplyShopItems[4]._customDescription = "+${qty1} Ancient Arrows, +${qty2} Diamond Bolts, +${qty3} Static Jellyfish, +${qty4} Magic Bones"
		} else if (game.shop.purchases.getObjectByID("melvorF:Basic_Resupply").contains.items.filter(x => x.item.id == "melvorD:Light_Rune")[0]?.quantity != 200) { // Check if resupplies have been modified yet
			game.shop.purchases.getObjectByID("melvorF:Basic_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 200 })
			game.shop.purchases.getObjectByID("melvorF:Standard_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 500 })
			game.shop.purchases.getObjectByID("melvorF:Generous_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 1000 })
			game.shop.purchases.getObjectByID("melvorTotH:Plentiful_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 4000 })
			game.shop.purchases.getObjectByID("melvorTotH:Bountiful_Resupply").contains.items.push({ 'item': game.items.getObjectByID("melvorD:Light_Rune"), 'quantity': 8500 })
			// resupplyShopItems.forEach(x => x._customDescription = defaultDescription)
			resupplyShopItems[0]._customDescription = "+${qty1} Mithril Arrows, +${qty2} Topaz Bolts, +${qty3} Lobsters, +${qty4} Magic Bones, +${qty5} Light Runes"
			resupplyShopItems[1]._customDescription = "+${qty1} Adamant Arrows, +${qty2} Sapphire Bolts, +${qty3} Crabs, +${qty4} Magic Bones, +${qty5} Light Runes"
			resupplyShopItems[2]._customDescription = "+${qty1} Rune Arrows, +${qty2} Ruby Bolts, +${qty3} Sharks, +${qty4} Magic Bones, +${qty5} Light Runes"
			resupplyShopItems[3]._customDescription = "+${qty1} Dragon Arrows, +${qty2} Emerald Bolts, +${qty3} Magma Fish, +${qty4} Magic Bones, +${qty5} Light Runes"
			resupplyShopItems[4]._customDescription = "+${qty1} Ancient Arrows, +${qty2} Diamond Bolts, +${qty3} Static Jellyfish, +${qty4} Magic Bones, +${qty5} Light Runes"
		}
	}

	// Main callable patch functions
	// Call all the patching functions from inside here to guard them with this first if statement which checks gamemode

	const patchSidebar = (patchFlag) => {
		if (patchFlag) {
			game.pages.getObjectByID('melvorD:Summoning').skillSidebarCategoryID = 'Combat'
			document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(8) > li:nth-child(11)")?.classList?.remove('d-none') // Reveal summoning in sidebar
		} else {
			game.pages.getObjectByID('melvorD:Summoning').skillSidebarCategoryID = 'Non-Combat'
			document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(8) > li:nth-child(11)")?.classList?.add('d-none') // Hide summoning from sidebar
		}
	}

	const patchSummoningSkill = (patchFlag) => {
		if (patchFlag) {
			Object.defineProperty(game.summoning, 'hasMinibar', {
				get() { return false },
				configurable: true
			});
			Object.defineProperty(game.summoning, 'isCombat', {
				get() { return true },
				configurable: true
			});
			Object.defineProperty(game, 'playerCombatLevel', {
				get() {
					const base = 0.25 * (this.defence.level + this.hitpoints.level + Math.floor(this.prayer.level / 2) + Math.floor(this.summoning.level / 2));
					const melee = 0.325 * (this.attack.level + this.strength.level);
					const range = 0.325 * Math.floor((3 * this.ranged.level) / 2);
					const magic = 0.325 * Math.floor((3 * this.altMagic.level) / 2);
					const levels = [melee, range, magic];
					return Math.floor(base + Math.max(...levels));
				},
				configurable: true
			});
			game.summoning.setUnlock(true);
		} else {
			Object.defineProperty(game, 'playerCombatLevel', {
				get() {
					const base = 0.25 * (this.defence.level + this.hitpoints.level + Math.floor(this.prayer.level / 2));
					const melee = 0.325 * (this.attack.level + this.strength.level);
					const range = 0.325 * Math.floor((3 * this.ranged.level) / 2);
					const magic = 0.325 * Math.floor((3 * this.altMagic.level) / 2);
					const levels = [melee, range, magic];
					return Math.floor(base + Math.max(...levels));
				},
				configurable: true
			});
			Object.defineProperty(game.summoning, 'hasMinibar', {
				get() { return true },
				configurable: true
			});
			Object.defineProperty(game.summoning, 'isCombat', {
				get() { return false },
				configurable: true
			});
			game.summoning.setUnlock(false)
			if (game.openPage == game.pages.getObjectByID('melvorD:Summoning'))
				sidebar.category('Combat').items()[0].click()
		}
	}

	const toggleMarkUnlockRequirements = (patchFlag) => {
		if (patchFlag) {
			ctx.patch(Summoning, "checkForPetMark").replace(function () {
				const bannedSkills = game.skills.filter(x => !x.isCombat || x.id == 'melvorD:Summoning').map(x => x.id) // Explicitly include Summoning because Fox cannot be obtained without making tablets
				const unlock = !this.actions.filter(x => x.skills.filter(y => !bannedSkills.includes(y.id)).length > 0).some((mark) => { // Convoluted way to filter to only have combat summon recipes left
					return mark.level <= 99 && this.getMarkCount(mark) < Summoning.markLevels[3];
				});
				if (unlock)
					this.game.petManager.unlockPetByID("melvorF:Mark");
			})
			game.pets.getObjectByID('melvorF:Mark').isCO = true
		} else { // Default behaviour
			ctx.patch(Summoning, "checkForPetMark").replace(function () {
				const unlock = !this.actions.some((mark) => {
					return mark.level <= 99 && this.getMarkCount(mark) < Summoning.markLevels[3];
				});
				if (unlock)
					this.game.petManager.unlockPetByID("melvorF:Mark");
			})
			game.pets.getObjectByID('melvorF:Mark').isCO = false
		}
	}

	// const coPatchBankSlots = (patchValue) => {
	// 	if (!coGamemodeCheck() || patchValue === -1) {
	// 		game.shop.purchases.getObjectByID("melvorD:Extra_Bank_Slot")._buyLimitOverrides.delete(game.gamemodes.getObjectByID("hcco:hcco"))
	// 		game.shop.purchases.getObjectByID("melvorD:Extra_Bank_Slot")._buyLimitOverrides.delete(game.gamemodes.getObjectByID("hcco:mcco"))
	// 		return
	// 	}

	// 	game.shop.purchases.getObjectByID("melvorD:Extra_Bank_Slot")._buyLimitOverrides.set(game.gamemodes.getObjectByID("hcco:hcco"), patchValue)
	// 	game.shop.purchases.getObjectByID("melvorD:Extra_Bank_Slot")._buyLimitOverrides.set(game.gamemodes.getObjectByID("hcco:mcco"), patchValue)
	// }


	const coRebalancePatch = (patchFlag) => {
		if (!coGamemodeCheck())
			return
		patchLevelCap(patchFlag)
		patchMonsterDrops(patchFlag)
		patchAutoSwapFood(patchFlag)
		patchLightRunesFromResupplies(patchFlag)
		patchCapes(patchFlag)
		//patchUnavailableShopItems(patchFlag || ctx.settings.section("CO Rebalance").get("co-summoning-button")) // Only false if both buttons are false
		// patchUnavailableShopItems(patchFlag || ctx.characterStorage.getItem('co-summoning-button-value')) // Only false if both buttons are false
		patchUnavailableShopItems(patchFlag) // Only false if both buttons are false
		patchCompletionLog(patchFlag)
	}

	const coSummoningPatch = (patchFlag) => {
		if (!coGamemodeCheck())
			return
		patchSummoningDrops(patchFlag) // No hysteresis
		patchShopItemsForSummoning(patchFlag) // Hysteresis!!!
		patchSummoningSkill(patchFlag) // No hysteresis
		patchSidebar(patchFlag) // No hysteresis
		patchSummoningEquipRequirements(patchFlag) // No hysteresis
		patchSummoningSkillProgress(patchFlag) // No hysteresis
		toggleMarkUnlockRequirements(patchFlag) // No hysteresis
		//patchUnavailableShopItems(patchFlag || ctx.settings.section("CO Rebalance").get("co-rebalance-button")) // Only false if both buttons are false, indicating returning to vanilla game
		//patchSummoningPacks(patchFlag)
		//	patchUnavailableShopItems(patchFlag || ctx.characterStorage.getItem('co-rebalance-button-value'))
	}

	const coRepeatSlayerTaskButton = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		if (patchFlag) {
			ctx.patch(SlayerTask, 'getMonsterSelection').replace(function (originalFunc, tier) {
				const data = SlayerTask.data[tier];
				// if (ctx.characterStorage.getItem('repeat-slayer-task') && game?.combat?.enemy?.monster?.canSlayer && game?.combat?.enemy?.monster?.combatLevel >= data.minLevel && game?.combat?.enemy?.monster?.combatLevel <= data.maxLevel) { // Check if reroll current task is enabled, check if the monster we are fighting is a slayer monster AND is in the tier of slayer task we are requesting
				if (slayerRerollButtonValue() && game?.combat?.enemy?.monster?.canSlayer && game?.combat?.enemy?.monster?.combatLevel >= data.minLevel && game?.combat?.enemy?.monster?.combatLevel <= data.maxLevel) { // Check if reroll current task is enabled, check if the monster we are fighting is a slayer monster AND is in the tier of slayer task we are requesting
					return [game.combat.enemy.monster]
				}
				let monsterList = this.game.monsters.filter((monster) => {
					const combatLevel = monster.combatLevel;
					const monsterArea = this.game.getMonsterArea(monster);
					let slayerLevelReq = 0;
					if (monsterArea instanceof SlayerArea)
						slayerLevelReq = monsterArea.slayerLevelRequired;
					return (monster.canSlayer && combatLevel >= data.minLevel && combatLevel <= data.maxLevel && this.checkRequirements(monsterArea.entryRequirements, !this.autoSlayer, slayerLevelReq));
				}
				);
				if (monsterList.length == 1)
					return monsterList // This distinguishes between whether the user can't meet the requirement for any slayer task vs whether they only have 1 completable task
				else
					return monsterList.filter(x => x != this.monster)
			});
			ctx.patch(Currency, "add").replace(function (o, amount) {
				// const modifyFlag = ctx.characterStorage.getItem('repeat-slayer-task') == undefined ? false : ctx.characterStorage.getItem('repeat-slayer-task') // check if characterStorage is undefined first
				const modifyFlag = slayerRerollButtonValue() == undefined ? false : slayerRerollButtonValue() // check if characterStorage is undefined first
				if (this instanceof SlayerCoins) amount = Math.max(Math.floor(amount * (1 - 0.65 * modifyFlag)), 1)
				this._amount += amount;
				this.queueNotification(amount);
				this.onAmountChange();
			})
			if (document.getElementById("repeat-slayer-task-checkbox"))
				document.getElementById("repeat-slayer-task-checkbox").parentElement.classList.remove('d-none')
		} else {
			ctx.patch(SlayerTask, 'getMonsterSelection').replace(function (oiginalFunc, tier) {
				const data = SlayerTask.data[tier];
				let monsterList = this.game.monsters.filter((monster) => {
					const combatLevel = monster.combatLevel;
					const monsterArea = this.game.getMonsterArea(monster);
					let slayerLevelReq = 0;
					if (monsterArea instanceof SlayerArea)
						slayerLevelReq = monsterArea.slayerLevelRequired;
					return (monster.canSlayer && combatLevel >= data.minLevel && combatLevel <= data.maxLevel && this.checkRequirements(monsterArea.entryRequirements, !this.autoSlayer, slayerLevelReq));
				}
				);
				if (monsterList.length == 1)
					return monsterList
				else
					return monsterList.filter(x => x != this.monster)
			});
			ctx.patch(Currency, "add").replace(function (o, amount) {
				this._amount += amount;
				this.queueNotification(amount);
				this.onAmountChange();
			})
			if (document.getElementById("repeat-slayer-task-checkbox"))
				document.getElementById("repeat-slayer-task-checkbox").parentElement.classList.add('d-none')
		}
	}

	// Settings options setup

	// const bankButtonOptions = [{ value: -1, display: "No limit" }, { value: 0, display: "12" }, { value: 88, display: "100" }]

	// ctx.settings.section("Cap Bank Slots")
	// ctx.settings.section("Cap Bank Slots").add(
	// 	// {
	// 	// 	type: 'switch',
	// 	// 	name: `cap-bank-slots-button`,
	// 	// 	label: 'Enable a limit of 88 purchased bank slots from the shop.',
	// 	// 	default: false,
	// 	// 	onChange: (value) => { ctx.characterStorage.setItem('co-bank-button-value', value); coPatchBankSlots(value); }
	// 	// },
	// 	{
	// 		type: 'dropdown',
	// 		name: `cap-bank-slots-dropdown`,
	// 		label: 'Enable a limit of 12 or 100 total bank slots from the shop (including default). Bank slot tokens will still be redeemable.',
	// 		default: -1,
	// 		options: bankButtonOptions,
	// 		onChange: (value) => { ctx.characterStorage.setItem('co-bank-button-value', value); coPatchBankSlots(value); }
	// 	}
	// )
	ctx.settings.section("CO Rebalance")
	ctx.settings.section("CO Rebalance").add([
		{
			type: 'label',
			label: `Includes several changes the CO experience to make pre-expansion content more balanced and post-expansion content completable. Includes several drop table adjustments as well as an entire new skill added to the CO arsenal which is in the spirit of the gamemode. New monsters and dungeons are planned for the future.`,
			name: 'co-rebalance-label'
		},
		{
			type: 'switch',
			name: 'co-rebalance-button',
			label: 'Enable CO rebalance.',
			default: false,
			onChange: (value) => { ctx.characterStorage.setItem('co-rebalance-button-value', value); coRebalancePatch(value); }
		},
		{
			type: 'switch',
			name: 'co-summoning-button',
			label: 'Enable Summoning for CO.',
			default: false,
			onChange: (value) => { ctx.characterStorage.setItem('co-summoning-button-value', value); coSummoningPatch(value) }
		},
		{
			type: 'switch',
			name: 'co-repeatslayer-button',
			label: 'Enable repeat slayer tasks button.',
			default: false,
			onChange: (value) => { ctx.characterStorage.setItem('co-repeatslayer-button-value', value); coRepeatSlayerTaskButton(value) }
		}
	])

	// Lifecycle hooks, so this is where we actually modify the game

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


	ctx.onCharacterLoaded(c => {
		if (!coGamemodeCheck())
			return

		fixPoisonToad()

		patchUnavailableShopItems(false) // These are to set the correct initial state
		patchShopItemsForSummoning(false)

		// if (ctx.characterStorage.getItem('co-summoning-button-value')) {
		// 	const patchFlag = ctx.characterStorage.getItem('co-summoning-button-value')
		if (summoningButtonValue()) { // Can't run full coSummoningPatch because UI elements can't be modified this early
			// coSummoningPatch(ctx.characterStorage.getItem('co-summoning-button-value'))
			patchSummoningDrops(summoningButtonValue())
			patchShopItemsForSummoning(summoningButtonValue())
			patchSummoningSkill(summoningButtonValue())
			// patchSidebar(patchFlag)
			patchSummoningEquipRequirements(summoningButtonValue())
		}
		// if (ctx.characterStorage.getItem('co-rebalance-button-value'))
		// 	coRebalancePatch(ctx.characterStorage.getItem('co-rebalance-button-value'))
		// if (ctx.characterStorage.getItem('co-repeatslayer-button-value'))
		// 	coRepeatSlayerTaskButton(ctx.characterStorage.getItem('co-repeatslayer-button-value'))
		if (rebalanceButtonValue())
			coRebalancePatch(rebalanceButtonValue())
		if (slayerRerollButtonValue())
			coRepeatSlayerTaskButton(slayerRerollButtonValue())

		// if (c.settings.section("Cap Bank Slots").get("cap-bank-slots-button"))
		// 	coPatchBankSlots(c.settings.section("Cap Bank Slots").get("cap-bank-slots-button"))
		// if (c.settings.section("CO Rebalance").get("co-summoning-button"))
		// 	coSummoningPatch(c.settings.section("CO Rebalance").get("co-summoning-button"))
		// if (c.settings.section("CO Rebalance").get("co-rebalance-button")) // Only call the patch function if the button is set to true and ignore if its undefined (i.e. first use of the mod). The parity of the mod assumes this has been called once at the beginning

		// 	coRebalancePatch(c.settings.section("CO Rebalance").get("co-rebalance-button"))

		// if (c.settings.section("CO Rebalance").get("co-repeatslayer-button"))
		// 	coRepeatSlayerTaskButton(c.settings.section("CO Rebalance").get("co-repeatslayer-button"))
	})

	ctx.onInterfaceReady(c => {
		if (!coGamemodeCheck()) {
			[...shopMenu.tabs.values()].forEach(x => [...x.menu.items].filter(y => y[0].namespace == "hcco").forEach(y => y[1].container.classList.add('d-none'))) // Remove all hcco items from the shop.
			patchCompletionLog(false) // Remove items from completion log
			return
		}

		// HTML Additions
		let repeatSlayerCheckbox = document.createElement("div");
		document.querySelector("#combat-slayer-task-menu > div > div").appendChild(repeatSlayerCheckbox)

		repeatSlayerCheckbox.outerHTML = `<div class="col-12 font-w400 font-size-sm text-center pt-3 form-check">
					<input class="form-check-input pointer-enabled" type="checkbox" value="" id="repeat-slayer-task-checkbox" onclick="mod.getContext('hcco').characterStorage.setItem('repeat-slayer-task', this.checked)">
					<label class="form-check-label pointer-enabled" for="repeat-slayer-task-checkbox">Repeat current enemy for <img class="skill-icon-xxs mr-1" src="https://cdn.melvor.net/core/v018/assets/media/main/slayer_coins.svg"> -65%?</label>
					</div>`

		// document.querySelector("#repeat-slayer-task-checkbox").checked = mod.getContext('hcco').characterStorage.getItem('repeat-slayer-task') == undefined ? false : mod.getContext('hcco').characterStorage.getItem('repeat-slayer-task')
		document.querySelector("#repeat-slayer-task-checkbox").checked = mod.getContext('hcco').characterStorage.getItem(buttonNames.reroll) == undefined ? false : mod.getContext('hcco').characterStorage.getItem(buttonNames.reroll)
		document.getElementById("repeat-slayer-task-checkbox").parentElement.classList.add('d-none') // Remove by default

		// Summoning skill progress bar
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
			<td class="font-w600 font-size-sm d-none d-md-table-cell">

			</td>
			<td>
			<div class="progress active" style="height: 8px" id="skill-progress-xp-tooltip-melvorD:Summoning">

			</div>
			</div>
			</td>
			<td class="font-w600 xphc d-none" style="text-align: right;" id="xphc-7-rate"><small>...</small></td><td class="font-w600 xphc xphcl d-none" style="text-align: right;"><span id="xphc-7-lvl">...</span> to <input type="number" id="xphc-7-lvl-in" name="xphc-lvl" min="2" style="width: 60px; margin-left: 0.25em;"></td></tr>
			</tbody>`

		document.getElementById('summoning-row').classList.add('d-none')

		// HTML modifications
		if (document.getElementById('reroll-slayer-task-checkbox') != undefined)
			document.getElementById('reroll-slayer-task-checkbox').parentElement.classList.add('d-none') // Hide the other slayer reroll fix button
		game.pages.allObjects[18].skillSidebarCategoryID = 'Combat' // Add summoning to sidebar category combat
		document.querySelector("#skill-header-melvorD\\:Summoning > mastery-skill-options").classList.add('d-none') // Hide mastery options entirely
		document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(8)").appendChild([...document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(9)").childNodes].filter(x => x.childNodes[0]?.childNodes[1]?.innerText == "Summoning")[0]) // Move the summoning skill to the combat area
		document.querySelector("#horizontal-navigation-summoning > ul > li:nth-child(2)").classList.add('d-none') // Hide tablets/familiar page
		document.querySelectorAll(`[lang-id=CREATE_FAMILIAR`).forEach(x => x.parentElement.parentElement.classList.add('d-none')) // Hide all "create tablet" elements on each of the summoning marks
		document.querySelector("#mark-discovery-elements > div:nth-child(2) > h5 > lang-string:nth-child(4)").classList.add('d-none') // Hide message about creating tablets
		sidebar.category('Non-Combat').rootEl.classList.add('d-none') // Hide non-combat area instead of remove()ing it, as that would affect Summoning as well
		document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(8) > li:nth-child(11)").classList.add('d-none') // Hide summoning by default

		// if (c.characterStorage.getItem('co-summoning-button-value')) {
		// 	coSummoningPatch(c.characterStorage.getItem('co-summoning-button-value'))
		if (summoningButtonValue()) {
			coSummoningPatch(summoningButtonValue())
			// patchSidebar(c.characterStorage.getItem('co-summoning-button-value')) // Needs to be done later at interface stage
		}
		// if (ctx.characterStorage.getItem('co-repeatslayer-button-value'))
		// 	coRepeatSlayerTaskButton(ctx.characterStorage.getItem('co-repeatslayer-button-value'))
		if (slayerRerollButtonValue)
		coRepeatSlayerTaskButton(slayerRerollButtonValue())
	})
}
