export async function setup(ctx) {

	// ## Utility

	// Helper patch functions

	const coGamemodeCheck = (gamemode = game.currentGamemode) => { // Check if the user is playing a CO game mode
		return gamemode.namespace === 'hcco' || gamemode.id === "melvorF:HCCOSpeedrun"
	}

	const versionNumber = { major: 2, minor: 31 }
	const buttonNames = {
		rebalance: 'co-rebalance-button-value',
		summoning: 'co-summoning-button-value',
		township: 'co-township-button-value',
		marks: 'co-mark-button-value',
		rerollEnable: 'co-repeatslayer-button-value',
		reroll: 'repeat-slayer-task-checkbox-value',
		oldReroll: 'reroll-slayer-task'
	}

	const rebalanceButtonValue = () => ctx.characterStorage.getItem(buttonNames.rebalance)
	const summoningButtonValue = () => ctx.characterStorage.getItem(buttonNames.summoning)
	const townshipButtonValue = () => ctx.characterStorage.getItem(buttonNames.township)
	const markButtonValue = () => ctx.characterStorage.getItem(buttonNames.marks)
	const rerollEnableButtonValue = () => ctx.characterStorage.getItem(buttonNames.rerollEnable)
	const slayerRerollButtonValue = () => ctx.characterStorage.getItem(buttonNames.reroll)

	const maxCapeJSONData = await ctx.loadData('data/mini_max_capes.json')
	const resupplyJSONData = await ctx.loadData('data/resupplies.json')
	const modifierJSONData = await ctx.loadData('data/modifiers.json')
	let dataRegistered = false

	let vanillaDrops = {}
	let vanillaBones = {}
	let modifications = {}

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
	const patchDropTable = (monsterID, chestOrMonster, patchFlag, oldItemsToPatch, newItemsToInclude, bypass = false) => {
		// Check if the weights we remove from the drop table are all replaced by new weights
		if (!bypass)
			if (oldItemsToPatch.reduce((a, c) => a + (c.weight === undefined ? 0 : c.weight), 0) != newItemsToInclude.reduce((a, c) => a + (c.weight === undefined ? 0 : c.weight), 0))
				throw new Error(`The sum of weights (${oldItemsToPatch.reduce((a, c) => a + (c.weight === undefined ? 0 : c.weight), 0)}) removed does not total the sum of weights added (${newItemsToInclude.reduce((a, c) => a + (c.weight === undefined ? 0 : c.weight), 0)}) in ${monsterID}.`)

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
			matchingItemDrop.weight = vanillaDrops[monsterID][x.id].vanillaWeight - [...modifications[monsterID]].reduce((a, c) => a + JSON.parse(c)?.oldItemsToPatch.filter(y => y.id == x.id)[0]?.weight || 0, 0)
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
		if (vanillaBones[monsterToPatch] == undefined) { // Check if monster is in database
			vanillaBones[monsterToPatch] = {}
		}
		if (vanillaBones[monsterToPatch].bones == undefined) // Check if item is in database
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
	})
	// ## Rebalance

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
		patchBoneTable("melvorTotH:RaZu", patchFlag, { "id": "melvorTotH:Lightning_Rune", "quantity": 1500 })

		// Chests
		patchDropTable("melvorTotH:Ancient_Chest", "chest", patchFlag, [{ 'id': "melvorTotH:Carrion_Bark", "weight": 14 }, { "id": "melvorTotH:Jungle_Spores", 'weight': 5 }], [{ 'id': "melvorTotH:Linden_Logs", 'weight': 19, 'minQuantity': 150, 'maxQuantity': 300 }])
		patchDropTable("melvorTotH:Burning_Chest", "chest", patchFlag, [{ 'id': "melvorTotH:Infernal_Bones", "weight": 10 }, { "id": "melvorTotH:Charcoal", 'weight': 6 }, { "id": "melvorF:Ash", 'weight': 6 }], [{ 'id': "melvorTotH:Palladium_Bar", 'weight': 22, 'minQuantity': 50, 'maxQuantity': 150 }])
		patchDropTable('melvorD:Magic_Chest', 'chest', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
			{ 'id': "melvorD:Ancient_Rune", 'minQuantity': 500, 'maxQuantity': 1500 }
		], [])
		patchDropTable("melvorF:Miolite_Chest", "chest", patchFlag, [
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
		patchDropTable('melvorF:Water_Chest', 'chest', patchFlag, [
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 500, 'maxQuantity': 1000 },
			{ 'id': "melvorD:Blood_Rune", 'minQuantity': 500, 'maxQuantity': 1000 },
			{ 'id': "melvorD:Ancient_Rune", 'minQuantity': 500, 'maxQuantity': 1000 }
		], [])

		// Monsters
		patchDropTable("melvorTotH:BurningSnake", "monster", patchFlag, [{ 'id': "melvorTotH:Chilli_Seeds", "weight": 4 }], [
			{ "id": "melvorTotH:Divine_Helmet", "weight": 4, "minQuantity": 1, "maxQuantity": 1 }
		])
		patchDropTable('melvorTotH:InfernalGolem', 'monster', patchFlag,
			[{ 'id': "melvorTotH:Infernal_Rune", 'minQuantity': 25, 'maxQuantity': 35 }, { "id": "melvorTotH:Iridium_Ore", "weight": 58 }],
			[{ "id": "melvorTotH:Iridium_Bar", "minQuantity": 10, "maxQuantity": 25, "weight": 50 }, { "id": "melvorTotH:Divine_Boots", "weight": 8, "minQuantity": 1, "maxQuantity": 1 },]
		)
		patchDropTable('melvorTotH:MagicFireDemon', 'monster', patchFlag,
			[{ 'id': "melvorD:Fire_Rune", 'minQuantity': 10, 'maxQuantity': 30, "weight": 2 }, { 'id': "melvorF:Lava_Rune", 'minQuantity': 20, 'maxQuantity': 50, 'weight': 1 }],
			[{ "id": "melvorTotH:Divine_Shield", "weight": 3, "minQuantity": 1, "maxQuantity": 1 }]
		)
		patchDropTable('melvorTotH:Manticore', 'monster', patchFlag, [{ 'id': "melvorTotH:Palladium_Ore", "weight": 1 }], [{ "id": "melvorTotH:Divine_Platelegs", "weight": 1, "minQuantity": 1, "maxQuantity": 1 }])
		patchDropTable('melvorTotH:GretYun', 'monster', patchFlag, [{ 'id': "melvorTotH:Infernal_Rune", 'minQuantity': 20, 'maxQuantity': 50 }, { 'id': "melvorD:Dragon_Bones", 'weight': 1 }], [{ "id": "melvorTotH:Divine_Platebody", "weight": 1, "minQuantity": 1, "maxQuantity": 1 }])

		patchDropTable("melvorTotH:PoisonToad", "monster", patchFlag, [{ 'id': "melvorTotH:Bitterlyme_Seeds", "weight": 200 }], [{ 'id': "melvorTotH:Poison_Rune", 'weight': 200, 'minQuantity': 20, 'maxQuantity': 60 }])
		patchDropTable("melvorTotH:FrostGolem", "monster", patchFlag, [{ 'id': "melvorD:Water_Rune", "weight": 49, 'minQuantity': 35, 'maxQuantity': 80 }], [{ 'id': "melvorTotH:Archaic_Rune", 'weight': 49, 'minQuantity': 35, 'maxQuantity': 80 }])
		patchDropTable('melvorD:Wizard', 'monster', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 10, 'maxQuantity': 30 }
		], [])
		patchDropTable('melvorF:Priest', 'monster', patchFlag, [{ 'id': "melvorD:Light_Rune", 'minQuantity': 10, 'maxQuantity': 30, "weight": 5 }], [{ 'id': "melvorF:Prayer_Scroll", 'minQuantity': 1000, 'maxQuantity': 1500, "weight": 5 }])
		patchDropTable('melvorD:DarkWizard', 'monster', patchFlag, [
			{ 'id': "melvorD:Enchanted_Shield", "weight": 5 },
			{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 15, 'maxQuantity': 40 },
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 15, 'maxQuantity': 40 }
		], [{ 'id': "melvorF:Wizards_Scroll", 'minQuantity': 1000, 'maxQuantity': 1500, "weight": 5 }])

		patchDropTable('melvorD:MasterWizard', 'monster', patchFlag, [{ 'id': "melvorD:Mind_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
		patchDropTable('melvorTotH:IceHydra', 'monster', patchFlag, [{ 'id': "melvorTotH:Calamity_Rune", 'minQuantity': 100, 'maxQuantity': 200 }], [])
		patchDropTable('melvorTotH:Siren', 'monster', patchFlag, [{ 'id': "melvorTotH:Despair_Rune", 'minQuantity': 15, 'maxQuantity': 30, "weight": 0 }], [])
		patchDropTable('melvorTotH:PolarBear', 'monster', patchFlag, [{ 'id': "melvorTotH:Frost_Crab", 'minQuantity': 50, 'maxQuantity': 80 }, { 'id': "melvorTotH:Frozen_Manta_Ray", 'minQuantity': 150, 'maxQuantity': 300 }], [])
		patchDropTable('melvorTotH:Cockatrice', 'monster', patchFlag, [{ 'id': "melvorTotH:Decay_Bolts", 'minQuantity': 25, 'maxQuantity': 100 }], [])
		patchDropTable('melvorTotH:PlagueDoctor', 'monster', patchFlag, [
			{ 'id': "melvorF:Hinder_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
			{ 'id': "melvorF:Lethal_Toxins_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
			{ 'id': "melvorTotH:Area_Control_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
			{ 'id': "melvorTotH:Reaper_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
			{ 'id': "melvorF:Famished_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
			{ 'id': "melvorTotH:Penetration_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 }
		], [])

		patchDropTable('melvorF:Vampire', 'monster', patchFlag, [
			{ 'id': "melvorD:Air_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Water_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Earth_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Fire_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Mind_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
			{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 3, 'maxQuantity': 6 },
			{ 'id': "melvorD:Death_Rune", 'minQuantity': 2, 'maxQuantity': 4 }
		], [])
		patchDropTable('melvorF:Shaman', 'monster', patchFlag, [{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
		patchDropTable('melvorF:Necromancer', 'monster', patchFlag, [{ 'id': "melvorD:Death_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
		patchDropTable('melvorF:Elementalist', 'monster', patchFlag, [{ 'id': "melvorF:Havoc_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])

		// Soul runes
		const moonwortSeeds = { "id": "melvorTotH:Moonwort_Seeds", "weight": 200 }
		const soulRune = { "id": "melvorTotH:Soul_Rune", "minQuantity": 250, "maxQuantity": 500, "weight": 200 }
		patchDropTable("melvorTotH:Phantom", "monster", patchFlag, [moonwortSeeds], [soulRune])
		patchDropTable("melvorTotH:Spectre", "monster", patchFlag, [moonwortSeeds], [soulRune])
		patchDropTable("melvorTotH:Banshee", "monster", patchFlag, [moonwortSeeds], [soulRune])

		// Absorbing shield
		patchDropTable("melvorF:Valkyrie", "monster", patchFlag, [], [{ 'id': "melvorF:Absorbing_Shield", 'weight': 1, 'minQuantity': 1, 'maxQuantity': 1 }], true)
		if (patchFlag) {
			game.monsters.getObjectByID('melvorF:Valkyrie').lootTable.totalWeight = 6
			game.monsters.getObjectByID('melvorF:Valkyrie').lootChance = 6
		} else {
			game.monsters.getObjectByID('melvorF:Valkyrie').lootTable.totalWeight = 5
			game.monsters.getObjectByID('melvorF:Valkyrie').lootChance = 5
		}

		// Golbin drop table for shrimp
		patchDropTable("melvorD:Golbin", "monster", patchFlag, [{ 'id': "melvorD:Raw_Shrimp", "weight": 1 }], [{ 'id': "melvorD:Shrimp", 'weight': 1, 'minQuantity': 1, 'maxQuantity': 1 }])

		// GCM
		// if (patchFlag) {
		// 	game.monsters.getObjectByID('melvorTotH:Torvair').lootTable.totalWeight = 20
		// 	game.monsters.getObjectByID('melvorTotH:Torvair').lootChance = 100
		// 	game.monsters.getObjectByID('melvorTotH:Arctair').lootTable.totalWeight = 20
		// 	game.monsters.getObjectByID('melvorTotH:Arctair').lootChance = 100
		// 	game.monsters.getObjectByID('melvorTotH:Harkair').lootTable.totalWeight = 20
		// 	game.monsters.getObjectByID('melvorTotH:Harkair').lootChance = 100
		// } else {
		// 	game.monsters.getObjectByID('melvorTotH:Torvair').lootTable.totalWeight = 1
		// 	game.monsters.getObjectByID('melvorTotH:Torvair').lootChance = 5
		// 	game.monsters.getObjectByID('melvorTotH:Arctair').lootTable.totalWeight = 1
		// 	game.monsters.getObjectByID('melvorTotH:Arctair').lootChance = 5
		// 	game.monsters.getObjectByID('melvorTotH:Harkair').lootTable.totalWeight = 1
		// 	game.monsters.getObjectByID('melvorTotH:Harkair').lootChance = 5
		// }
		// patchDropTable("melvorTotH:Torvair", "monster", patchFlag, [], [{ 'id': "melvorF:Damage_Reduction_Potion_III", 'weight': 19, 'minQuantity': 5, 'maxQuantity': 10 }], true)
		// patchDropTable("melvorTotH:Arctair", "monster", patchFlag, [], [{ 'id': "melvorF:Damage_Reduction_Potion_III", 'weight': 19, 'minQuantity': 5, 'maxQuantity': 10 }], true)
		// patchDropTable("melvorTotH:Harkair", "monster", patchFlag, [], [{ 'id': "melvorF:Damage_Reduction_Potion_III", 'weight': 19, 'minQuantity': 5, 'maxQuantity': 10 }], true)

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
		if (!summoningButtonValue())
			bannedItems = [... new Set([...bannedItems, "hcco:Critter_Pack", "hcco:Companion_Pack", "hcco:Familiar_Pack", "hcco:Beast_Pack"])]

		if (!rebalanceButtonValue())
			bannedItems = [... new Set([...bannedItems, "hcco:Apprentice_Runepack", "hcco:Adept_Runepack", "hcco:Master_Runepack", "hcco:Archmage_Runepack"])]

		shopItems = shopItems.filter(x => !bannedItems.includes(x))
		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (!shopItems.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
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

			shopPrayerCapeItem[1].item.description.innerHTML = `-${patchedCapeValue}% Prayer Point Cost for Prayers`
			shopSuperiorPrayerCapeItem[1].item.description.innerHTML = `-${patchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
			// shopPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${patchedCapeValue}% Prayer Point Cost for Prayers`
			// shopSuperiorPrayerCapeItem[1].container.childNodes[0].childNodes[0].childNodes[1].childNodes[2].innerHTML = `-${patchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
		} else {
			game.items.getObjectByID("hcco:Combat_Max_Skillcape").modifiers.decreasedPrayerCost = unpatchedCapeValue
			game.items.getObjectByID("hcco:Combat_Superior_Max_Skillcape").modifiers.decreasedPrayerCost = unpatchedSuperiorCapeValue
			game.items.getObjectByID("melvorF:Prayer_Skillcape").modifiers.decreasedPrayerCost = unpatchedCapeValue
			game.items.getObjectByID("melvorTotH:Superior_Prayer_Skillcape").modifiers.decreasedPrayerCost = unpatchedSuperiorCapeValue

			shopPrayerCapeItem[1].item.description.innerHTML = `-${unpatchedCapeValue}% Prayer Point Cost for Prayers`
			shopSuperiorPrayerCapeItem[1].item.description.innerHTML = `-${unpatchedSuperiorCapeValue}% Prayer Point Cost for Prayers and +5% Chance To Preserve Prayer Points`
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
	const coRebalancePatch = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		patchMonsterDrops(patchFlag)
		patchAutoSwapFood(patchFlag)
		patchLightRunesFromResupplies(patchFlag)
		patchCapes(patchFlag)
		patchUnavailableShopItems(patchFlag) // Only false if both buttons are false
		patchCompletionLog(patchFlag)
		// patchItemModifiers(patchFlag)
	}


	// ## Skill Utility Functions 
	const patchSidebar = (patchFlag, skillID, category) => {
		if (patchFlag) {
			game.pages.getObjectByID(`melvorD:${skillID}`).skillSidebarCategoryID = 'Combat'
			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(8) > li:nth-child(11)")?.classList?.remove('d-none') // Reveal summoning in sidebar
			sidebar.categories().filter(x => x.id == category)[0].items().filter(x => x.id == `melvorD:${skillID}`)[0].itemEl.classList.remove('d-none')
		} else {
			game.pages.getObjectByID(`melvorD:${skillID}`).skillSidebarCategoryID = category
			sidebar.categories().filter(x => x.id == category)[0].items().filter(x => x.id == `melvorD:${skillID}`)[0].itemEl.classList.add('d-none')
			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(8) > li:nth-child(11)")?.classList?.add('d-none') // Hide summoning from sidebar
		}
	}
	const patchSkill = (patchFlag, skillID, category) => {
		if (patchFlag) {
			game[skillID.toLowerCase()].setUnlock(true);
		} else {
			game[skillID.toLowerCase()].setUnlock(false)
			if (game.openPage == game.pages.getObjectByID(`melvorD:${skillID}`))
				sidebar.category('Combat').items()[0].click() // If the person has the skill window open when they disable the skill, move them to the combat window
		}
	}
	const patchSidebarCategory = (patchFlag, category) => {
		if (patchFlag)
			sidebar.categories().filter(x => x.id == category)[0].rootEl.classList.remove('d-none')
		else
			sidebar.categories().filter(x => x.id == category)[0].rootEl.classList.add('d-none')
	}
	const makeSkillCombatOnly = (patchFlag, skillID, category) => {
		if (patchFlag) {
			sidebar.categories().filter(x => x.id == "Combat")[0].rootEl.appendChild(sidebar.categories().filter(x => x.id == category)[0].items().filter(x => x.id == `melvorD:${skillID}`)[0].itemEl)
		} else {
			sidebar.categories().filter(x => x.id == "Non-Combat")[0].rootEl.appendChild(sidebar.categories().filter(x => x.id == category)[0].items().filter(x => x.id == `melvorD:${skillID}`)[0].itemEl)
		}
	}

	// ## Summoning
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
				// Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.remove('d-none'); // Show skill requirement in shop front
				Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes)[shopMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.remove('d-none'); // Repeat of above function to not use .at()
				Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id == 'melvorF:Summoning_Skillcape')[0][1].container.classList.remove('d-none') // Reveal in shop
			}
			if (shopSuperiorMaxCapeItem.length > 0) { // This is false if the item is not in the shop, which shouldn't happen...? But it's good practice I guess
				// Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.remove('d-none');
				Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes)[shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.remove('d-none');// Repeat of above function to not use .at()
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
				// Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.add('d-none'); // Hide skill req in shop front
				Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes)[shopMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.add('d-none'); // Repeat of above function to not use .at()
				Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id == 'melvorF:Summoning_Skillcape')[0][1].container.classList.add('d-none')
			}
			if (shopSuperiorMaxCapeItem.length > 0) {
				// Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.add('d-none');
				Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes)[shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.add('d-none'); // Repeat of above function to not use .at()
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
		// Necormancer palace
		patchBoneTable("melvorTotH:CursedSkeletonWarrior", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 120 })
		patchBoneTable("melvorTotH:Beholder", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Siren", "quantity": 150 })
		patchBoneTable("melvorTotH:DarkKnight", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 200 })
		patchBoneTable("melvorTotH:Fiozor", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spectre", "quantity": 600 })

		// Monsters
		const eyeball = { "id": "melvorF:Eyeball", "weight": 2 }
		const eyeball2 = { "id": "melvorF:Eyeball", "weight": 4 }
		patchDropTable('melvorF:LotsofEyes', 'monster', patchFlag, [eyeball], [{ 'id': "melvorF:Summoning_Familiar_Golbin_Thief", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable('melvorF:ManyEyedMonster', 'monster', patchFlag, [eyeball2], [{ 'id': "melvorF:Summoning_Familiar_Occultist", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Wolf", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable('melvorF:StrangeEyedMonster', 'monster', patchFlag, [eyeball2], [{ 'id': "melvorF:Summoning_Familiar_Minotaur", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Witch", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable('melvorF:Eyes', 'monster', patchFlag, [eyeball2], [{ 'id': "melvorF:Summoning_Familiar_Centaur", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Cyclops", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable('melvorF:SuperiorEyedMonster', 'monster', patchFlag, [eyeball2], [{ 'id': "melvorF:Summoning_Familiar_Yak", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Unicorn", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable('melvorF:EyeOfFear', 'monster', patchFlag, [eyeball], [{ 'id': "melvorF:Summoning_Familiar_Dragon", 'weight': 2, 'minQuantity': 10, 'maxQuantity': 50 }])
		patchDropTable('melvorTotH:Siren', 'monster', patchFlag, [{ "id": "melvorTotH:Despair_Rune", "weight": 138, 'minQuantity': 30, 'maxQuantity': 60 }], [{ 'id': "melvorTotH:Summoning_Familiar_Siren", 'weight': 138, 'minQuantity': 10, 'maxQuantity': 50 }])

		const moonwortSeeds = { "id": "melvorTotH:Moonwort_Seeds", "weight": 200 }
		const spectre = { "id": "melvorTotH:Summoning_Familiar_Spectre", "minQuantity": 250, "maxQuantity": 500, "weight": 200 }
		patchDropTable('melvorTotH:Phantom', 'monster', patchFlag, [moonwortSeeds], [spectre])
		patchDropTable('melvorTotH:Banshee', 'monster', patchFlag, [moonwortSeeds], [spectre])
		patchDropTable('melvorTotH:Spectre', 'monster', patchFlag, [moonwortSeeds], [spectre])

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
			// document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.add('font-w600', 'font-size-sm')
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(1) > span").classList.add('d-none')
			// Xp
			document.querySelector("#combat-skill-progress-menu > table > tbody:nth-child(10) > tr > td.font-w600.font-size-sm.d-none.d-sm-table-cell").appendChild(document.querySelector("#skill-progress-xp-melvorD\\:Summoning"))
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList)
			// document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.add("font-w600", "font-size-sm")
			document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(2) > span.font-w600").classList.add('d-none')
			// Progress bar
			document.querySelector("#skill-progress-xp-tooltip-melvorD\\:Summoning").appendChild(document.querySelector("#skill-progress-bar-melvorD\\:Summoning"))

			// Adding these as additional steps well after the fact to not confuse myself lol
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML.replace("span", "small")
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML.replace("span", "small")
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

			// Adding these as additional steps well after the fact to not confuse me lol
			document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML.replace("small", "span")
			document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML.replace("small", "span")
		}
	}
	const patchSkillingFamiliars = (patchFlag) => {
		if (patchFlag) {
			// console.log(document.querySelector("#mark-discovery-elements").childNodes)
			const bannedSkills = game.skills.filter(x => !x.isCombat || x.id == 'melvorD:Summoning').map(x => x.id)
			markDiscoveryMenus.forEach((v, k) => {
				if (k.skills.some(y => bannedSkills.includes(y.id)))
					v.classList.add('d-none')
			})
		} else {
			document.querySelector("#mark-discovery-elements").childNodes.forEach(x => x?.classList?.remove('d-none'))
		}
	}
	const togglePetMarkUnlockRequirements = (patchFlag) => { game.pets.getObjectByID('melvorF:Mark').isCO = patchFlag }
	const coSummoningPatch = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		patchSummoningDrops(patchFlag)
		patchShopItemsForSummoning(patchFlag)
		patchSkill(patchFlag, 'Summoning', "Non-Combat")
		makeSkillCombatOnly(patchFlag, 'Summoning', 'Non-Combat')
		patchSidebar(patchFlag, "Summoning", "Non-Combat")
		patchSummoningEquipRequirements(patchFlag)
		patchSummoningSkillProgress(patchFlag)
		togglePetMarkUnlockRequirements(patchFlag)
		patchSkillingFamiliars(patchFlag)
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
	const resetSummoningMarkLevels = () => {
		game.summoning.marksUnlocked.clear()
	}
	const resetAllowQuantity = (patchFlag) => {
		if (!patchFlag) {
			equipmentSlotData['Summon1'].allowQuantity = true
			equipmentSlotData['Summon2'].allowQuantity = true
		}
	}
	ctx.patch(Summoning, "getChanceForMark").replace(function (o, mark, skill, modifiedInterval) { // Only allow obtaining marks if summon equipped
		if (!markButtonValue() || !coGamemodeCheck())
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
		patchSkill(patchFlag, "Township", "Passive")
		patchSidebar(patchFlag, "Township", "Passive")
		patchSidebarCategory(patchFlag, "Passive")
		enableTown(patchFlag)
		hideTownshipElements()
	}
	ctx.patch(Game, "createOfflineModal").after((html) => {
		if (!townshipButtonValue())
			return html
		html = html.replace("<span class='text-danger'>Township Health: 100%</span>", "").replace("<h5 class='font-w600 mb-1'></h5>", "") // Remove Township health from the UI and do some cleanup on empty HTML if necessary
		return html
	})
	const hideTownshipElements = () => {
		const elements = [
			...Object.entries(townshipUI.defaultElements.btn).filter(x => x[0] != "tasks").map(x => x[1].parentElement),
			...Object.entries(townshipUI.defaultElements.div).filter(x => x[0] != "container" && x[0] != "categoryMenu" && x[0] != "tasks").map(x => x[1]),
			...Object.entries(townshipUI.defaultElements.icon).map(x => x[1]),
			...Object.entries(townshipUI.defaultElements.notifications).map(x => x[1]),
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

	// ## Completion Log
	const getCOItemList = () => {
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
				).reduce((accumulator, current) => accumulator.concat(current)), // Reduce to flatten ragged array
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
		const upgradeCheck = (coDrops) => {
			const upgradeItems = game.bank.itemUpgrades; // Grab all upgradeable items in the game
			let currentLength = -1
			while (currentLength != coDrops.size) { // We loop to check upgrade paths that require several steps, e.g. DFS requiring 3 loops
				currentLength = coDrops.size
				let upgradeItems2 = []
				upgradeItems.forEach((v, k) => {
					if (!(k instanceof PotionItem)) // Remove potion upgrades, as these require mastery
						if (v[0].rootItems.every(y => coDrops.has(y.id))) // Check if the root items for the upgrade are CO items
							upgradeItems2.push(v)
				})
				upgradeItems2 = upgradeItems2.map(x => x[0].upgradedItem.id)
				coDrops = new Set([...coDrops, ...upgradeItems2])
			}

			return coDrops
		}

		coDrops = upgradeCheck(coDrops)

		// Add shop items to the list
		//	let bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)

		const bannedSkills = game.skills.filter(x => !x.isCombat).map(x => x.id)
		let shopItems = game.shop.purchases.filter(shopItems =>
			shopItems.contains.items.length > 0  // Remove shop items that don't give a bank item
		).filter(x => !x.category.isGolbinRaid).filter(x =>
			!x.purchaseRequirements.some(y => y.type == 'TownshipBuilding')
		).filter(shopItem =>
			shopItem.purchaseRequirements.length == 0 || // If no purchase requirements then include it
			shopItem.purchaseRequirements.every(reqs =>
				!bannedSkills.includes(reqs?.skill?.id) && reqs?.type != 'AllSkillLevels' && reqs?.type != 'Completion'
			)
		)


		//.map(x => x.contains.items).flat().map(x => x.item)

		//	flatten(shopItems).map(x => x.item)

		// Remove shop items that cannot be purchased as a CO
		const shopCheck = (coDrops) => {
			let currentLength = -1
			while (currentLength !== coDrops.size) { // Loop to make sure there aren't shop items that require other shop items to purchase
				currentLength = coDrops.size
				coDrops = new Set([...coDrops, ...shopItems.filter(x =>
					x.costs.items.every(y =>
						coDrops.has(y.item.id) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
					)
				).map(x => x.contains.items).flat().map(x => x.item.id)
				])
			}
			return coDrops
		}

		coDrops = shopCheck(coDrops)
		coDrops = upgradeCheck(coDrops) // Repeat check again after adding shop items


		let coChests = [...coDrops].map(x => game.items.getObjectByID(x)).filter(x => x instanceof OpenableItem) // Double check chests, because some don't come from dungeons lol
		let coChestsItems = coChests.flat().map(x => x?.dropTable?.drops?.map(y => y.item.id)).flat() // Same steps as above to map chests to their contents
		let bonusItems = ["melvorD:Signet_Ring_Half_B"] // Misc items that don't fit into other categories
		coDrops = new Set([...coDrops, ...game.shop.purchases.filter(shopItems => shopItems.contains?.itemCharges != undefined).map(x => x.contains.itemCharges.item.id), ...coChestsItems, ...bonusItems]) // Add in gloves manually: they hvae itemCharges instead of an item. Also add signet and chest items
		let bannedItems = ["mini_max_cape:Combat_Superior_Max_Skillcape", "mini_max_cape:Combat_Max_Skillcape"]
		return [...coDrops].filter(x => !bannedItems.includes(x))
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
	const setCOFlags = () => {
		game.pets.forEach(x => x['isCO'] = false) // Reset
		game.items.forEach(x => x['isCO'] = false) // Reset

		getCOItemList().map(x => game.items.getObjectByID(x)).forEach(x => x['isCO'] = true)
		game.pets.filter(x => x?.skill?.isCombat || x?._langHint?.id === "Combat" || x?._langHint?.category === "DUNGEON" || x?._langHint?.category === "SLAYER_AREA").forEach(x => x['isCO'] = true)
		game.pets.getObjectByID('melvorF:TimTheWolf').isCO = false // This one still isn't obtainable
		game.pets.getObjectByID('melvorF:Mark').isCO = ctx.characterStorage.getItem('co-summoning-button-value') // This one will be available
	}
	const toggleUnavailableMasteries = (patchFlag) => {
		const collectionLogTabs = [...document.querySelector("#completionLog-container > div").childNodes].slice(3, 12).filter((v, k) => k % 2 == 0) // Get all collection log tabs
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
		// game.pets.forEach(x => x.isCO = false) // Reset
		setCOFlags(patchFlag)
		completionLogMenu.pets.forEach((value, key) => { if (!key.ignoreCompletion) value.classList.remove('d-none') }) // Reset
		if (patchFlag) {
			// game.pets.filter(x => x?.skill?.isCombat || x?._langHint?.category == "DUNGEON" || x?._langHint?.category == "SLAYER_AREA").forEach(x => x.isCO = true)
			completionLogMenu.pets.forEach((value, key) => { if (!key.isCO) value.classList.add('d-none') })
		}
	}
	const toggleUnavailableItems = (patchFlag) => {
		// game.items.allObjects.forEach(x => x.isCO = false) // Reset
		// getCOItemList().map(x => game.items.getObjectByID(x)).forEach(x => x.isCO = true) // Recalculate
		setCOFlags(patchFlag)
		completionLogMenu.items.forEach((value, key) => { if (!key.ignoreCompletion) value.classList.remove('d-none') }) // Reset

		if (patchFlag)
			completionLogMenu.items.forEach((value, key) => { if (!key.isCO) value.classList.add('d-none') })
	}
	const createSetVisibleButton = () => {
		let a = document.createElement("div");
		document.querySelector("#completionLog-container > div > div:nth-child(1) > div > div > div > div.media-body").appendChild(a)
		a.outerHTML =
			`<div class="expansion-1-show">
	<h5 class="font-w600 text-left text-muted mb-0"> Combat Only
	<small class="comp-log-percent-combat_only">0%</small>
	<button class="btn btn-sm btn-outline-info ml-2 btn-visible-completion-combat_only" onclick="game.completion.setVisibleCompletion('combat_only');" id="combat_only-visible-completion-button">Set Visible</button>
	</h5>
	<div class="font-size-sm mb-2">
	<div class="progress active mr-1 mt-2 ml-1" style="height:10px">
	<div class="comp-log-percent-progress-combat_only progress-bar bg-co-progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
	</div>
	</div>
	</div>
	</div>`
	}

	Completion.prototype.coNamespaceID = "combat_only"
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
			toggleUnavailableItems(game.completion.visibleCompletion == game.completion.coNamespaceID)
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
					shouldShow = (item, _) => (item.namespace == 'melvorD' || item.namespace == 'melvorF') && !item.ignoreCompletion
					break;
				case 4:
					shouldShow = (item, _) => item.namespace == 'melvorTotH' && !item.ignoreCompletion
					break;
			}
			let itemList = game.items;
			if (game.completion.visibleCompletion == game.completion.coNamespaceID)
				itemList = game.items.filter(x => x.isCO)
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
	  ${cloudManager.hasTotHEntitlement ? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(3);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_3')}</button>
	  <button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(4);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_4')}</button>` : ''}
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
					}
					);
					game.items.forEach((item) => {
						var _a;
						const itemCompletion = new ItemCompletionElement();
						itemCompletion.className = 'bank-item no-bg btn-light pointer-enabled m-1 resize-48';
						(_a = namespaceContainers.get(item.namespace)) === null || _a === void 0 ? void 0 : _a.append(itemCompletion);
						itemCompletion.updateItem(item, game);
						if (item.ignoreCompletion)
							hideElement(itemCompletion);
						completionLogMenu.items.set(item, itemCompletion);
					}
					);
					game.completion.updateItem(game.items.firstObject);
					$('#searchTextbox-items').click(function (e) {
						updateItemLogSearchArray(game);
					});
					$('#searchTextbox-items').keyup(function () {
						const search = $('#searchTextbox-items').val();
						updateItemLogSearch(search);
					});
					filterItemLog(0)
				}
					, 1000);
				itemLogLoaded = true;
			}
		}
	}

	// ## Rerolling
	const coRepeatSlayerTaskButton = (patchFlag) => {
		if (!coGamemodeCheck())
			return

		// if (patchFlag) {
		// 	if (document.getElementById(`${buttonNames.reroll}-checkbox`))
		// 		document.getElementById(`${buttonNames.reroll}-checkbox`).parentElement.classList.remove('d-none')
		// } else {
		// 	if (document.getElementById(`${buttonNames.reroll}-checkbox`))
		// 		document.getElementById(`${buttonNames.reroll}-checkbox`).parentElement.classList.add('d-none')
		// }
		// console.log("Repeat slayer button", patchFlag)
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
		let generatedHtml = ''
		let checkedMonsters = new Set()
		Object.entries(modifications).sort((a, b) => {
			if (game.monsters.getObjectByID(a[0])?.combatLevel === undefined) return 1
			if (game.monsters.getObjectByID(b[0])?.combatLevel === undefined) return -1
			if (game.monsters.getObjectByID(a[0])?.combatLevel < game.monsters.getObjectByID(b[0])?.combatLevel) return -1
			if (game.monsters.getObjectByID(a[0])?.combatLevel > game.monsters.getObjectByID(b[0])?.combatLevel) return 1
		}).forEach(([monsterID, states]) => { // States is a set of JSON stringified states
			// Recall: const state = JSON.stringify({ monsterID, chestOrMonster, oldItemsToPatch, newItemsToInclude })
			// console.warn(game.monsters.getObjectByID(monsterID)?.combatLevel)
			const statesArray = [...states]
			if (statesArray.length === 0)
				return
			const firstState = JSON.parse(statesArray[0])
			const { lootDropperKey, tableKey } = chestOrMonsterChecker(firstState.chestOrMonster)
			logfile = logfile.concat(`${game[lootDropperKey].getObjectByID(monsterID).name} drop table modified:\n`)

			// game.monsters.getObjectByID(monsterID).name
			generatedHtml = generatedHtml.concat(`<img class="swal2-image" width=50 height=50 src="${game[lootDropperKey].getObjectByID(monsterID).media}"><br><b style="color:white">${game[lootDropperKey].getObjectByID(monsterID).name}</b><br>`)
			const itemsAdded = {}
			const itemsModified = {}

			statesArray.forEach(state => {
				const stateParsed = JSON.parse(state)
				stateParsed.oldItemsToPatch.forEach(item => {
					if (itemsModified[item.id] === undefined)
						itemsModified[item.id] = {}
					// itemsModified[item.id] = { 'minQuantity': item.minQuantity, 'maxQuantity': item.maxQuantity, 'weight': item.weight }
					// itemsModified[item.id].weight += item.weight
					// We assume all the min and max quantities are the same, but the weight can change from state to state
				})

				stateParsed.newItemsToInclude.forEach(item => {
					if (itemsAdded[item.id] === undefined)
						itemsAdded[item.id] = { 'minQuantity': item.minQuantity, 'maxQuantity': item.maxQuantity, 'weight': item.weight }
					itemsAdded[item.id].weight = item.weight
					itemsAdded[item.id].minQuantity = item.minQuantity
					itemsAdded[item.id].maxQuantity = item.maxQuantity
				})
			})

			const lootChance = game[lootDropperKey].getObjectByID(monsterID)?.lootChance || 100
			Object.keys(itemsModified).forEach(dropID => {
				const droptable = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.filter(y => y.item.id == dropID)[0]
				const droptableWeight = game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight / (lootChance / 100)
				const dropProperties = vanillaDrops[monsterID][dropID]

				// Check if the weight or the quantity have been modified
				const weightFlag = (dropProperties.vanillaWeight !== droptable.weight) // Weight has been modified 
				const quantityFlag = (dropProperties.vanillaMinQuantity !== undefined) && (dropProperties.vanillaMinQuantity !== droptable.minQuantity || dropProperties.vanillaMaxQuantity !== droptable.maxQuantity) // Quantity has been modified

				if (!weightFlag && !quantityFlag) // Neither weight nor quantity have been modified, so return
					return
				logfile = logfile.concat(`\t- ${droptable.item.name}`)
				generatedHtml = generatedHtml.concat(`<img class="skill-icon-xs" src=${droptable.item.media}> <i style="color:fuchsia">${droptable.item.name}`)
				if (weightFlag) {
					logfile = logfile.concat(` drop rate changed from ${dropProperties.vanillaWeight}/${droptableWeight} to ${droptable.weight}/${droptableWeight}`)
					generatedHtml = generatedHtml.concat(` drop rate changed from ${dropProperties.vanillaWeight}/${droptableWeight} to ${droptable.weight}/${droptableWeight}`)
				}
				if (quantityFlag)
					if (weightFlag) { // Both have been modified (grammar)
						logfile = logfile.concat(` and drop quantity changed from ${dropProperties.vanillaMinQuantity}-${dropProperties.vanillaMaxQuantity} to ${droptable.minQuantity}-${droptable.maxQuantity}`)
						generatedHtml = generatedHtml.concat(` and drop quantity changed from ${dropProperties.vanillaMinQuantity}-${dropProperties.vanillaMaxQuantity} to ${droptable.minQuantity}-${droptable.maxQuantity}`)
					}
					else { // Only quantity has been modified (grammar)
						logfile = logfile.concat(` drop quantity changed from ${dropProperties.vanillaMinQuantity}-${dropProperties.vanillaMaxQuantity} to ${droptable.minQuantity}-${droptable.maxQuantity}`)
						generatedHtml = generatedHtml.concat(` drop quantity changed from ${dropProperties.vanillaMinQuantity}-${dropProperties.vanillaMaxQuantity} to ${droptable.minQuantity}-${droptable.maxQuantity}`)
					}
				logfile = logfile.concat('.\n')
				generatedHtml = generatedHtml.concat('</i><br>')
			})
			Object.entries(itemsAdded).forEach(([dropID, dropProperties]) => {
				const droptable = game[lootDropperKey].getObjectByID(monsterID)[tableKey].drops.filter(y => y.item.id == dropID)[0]
				const droptableWeight = game[lootDropperKey].getObjectByID(monsterID)[tableKey].totalWeight / (lootChance / 100)
				logfile = logfile.concat(`\t+ ${droptable.item.name} added to the drop table at a rate of ${dropProperties.weight}/${droptableWeight} and with a drop quantity of ${dropProperties.minQuantity}-${dropProperties.maxQuantity}.\n`)
				generatedHtml = generatedHtml.concat(`<img class="skill-icon-xs" src=${droptable.item.media}> <i style="color:cyan">${droptable.item.name} added to the drop table at a rate of ${dropProperties.weight}/${droptableWeight} and with a drop quantity of ${dropProperties.minQuantity}-${dropProperties.maxQuantity}</i><br>`)
			})

			if (vanillaBones[monsterID]?.bones !== undefined) {
				logfile = logfile.concat(`\t× Bones drop ${vanillaBones[monsterID].bones.vanillaBonesDrop} (${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity}).\n`)
				generatedHtml = generatedHtml.concat(`<img class="skill-icon-xs" src=${vanillaBones[monsterID]?.bones.vanillaBonesDrop.media}> <i style="color:yellow">${vanillaBones[monsterID]?.bones.vanillaBonesDrop.name} (${vanillaBones[monsterID]?.bones.vanillaQuantity}) replaced with <img class="skill-icon-xs" src=${game.monsters.getObjectByID(monsterID).bones.item.media}> ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity})
				</i><br>`)
			}

			checkedMonsters.add(monsterID)
			logfile = logfile.concat('\n')
		})
		Object.keys(vanillaBones).filter(monsterID => !checkedMonsters.has(monsterID)).forEach(monsterID => { // These are for monsters who only have bone drop table changes and no standard loot changes
			// if(game.monsters.getObjectByID(monsterID).name === 'UNDEFINED TRANSLATION: :MONSTER_NAME_RandomSpiderLair')
			// 	monsterID = 

			logfile = logfile.concat(`${game.monsters.getObjectByID(monsterID).name} drop table modified:\n`)
			generatedHtml = generatedHtml.concat(`<img class="swal2-image" width=50 height=50 src="${game.monsters.getObjectByID(monsterID).media}"><br><b style="color:white">${game.monsters.getObjectByID(monsterID).name}</b><br>`)

			logfile = logfile.concat(`\t× Bones drop ${vanillaBones[monsterID].bones.vanillaBonesDrop} (${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with ${game.monsters.getObjectByID(monsterID).bones.item.name} (${game.monsters.getObjectByID(monsterID).bones.quantity}).\n`)
			generatedHtml = generatedHtml.concat(`<i style="color:yellow">Bones drop <img class="skill-icon-xs" src=${vanillaBones[monsterID].bones.vanillaBonesDrop.media}> ${vanillaBones[monsterID].bones.vanillaBonesDrop.name}(${vanillaBones[monsterID].bones.vanillaQuantity}) replaced with <img class="skill-icon-xs" src=${game.monsters.getObjectByID(monsterID).bones.item.media}> ${game.monsters.getObjectByID(monsterID).bones.item.name}(${game.monsters.getObjectByID(monsterID).bones.quantity})</i><br>`)
		})
		return { log: logfile, html: generatedHtml }
	}
	const potatoPatchNotes = () => {
		const { log, html } = generateLogFile()
		console.log(log)
		SwalLocale.fire({
			title: `${game.currentGamemode.localID.toUpperCase()} Drop Table Changes V${versionNumber.major}.${versionNumber.minor}`,
			html: html,
			imageUrl: cdnMedia(`assets/media/bank/${game.currentGamemode.localID === "mcco" ? 'chilli' : 'potato'}.png`),
			imageWidth: 150,
			imageHeight: 150,
			width: '65em'
		})
	}

	// ## Item rebalance 
	// const newModifiers = {
	// 	bundled_heal: "heal12ForFirstStun",
	// 	bundled_dr: "increased5DRAfterStunned",
	// 	levi_heal: "heal12ForFirst5Attacks"
	// }

	// const savedItemDescriptions = {
	// 	bundled_protection_body: game.items.getObjectByID("melvorTotH:Bundled_Protection_Body")._customDescription,
	// 	frostspark_amulet: game.items.getObjectByID("melvorTotH:FrostSpark_Amulet")._customDescription,
	// 	leviathan_shield: game.items.getObjectByID("melvorTotH:Leviathan_Shield")._customDescription
	// }

	// const addModifierEffects = () => {
	// 	const heal12ForFirstStunEffect = {
	// 		type: 'Modifier',
	// 		modifiers: {},
	// 		maxStacks: 1,
	// 		stacksToAdd: 1,
	// 		turns: Infinity,
	// 		countsOn: 'Target',
	// 		character: 'Attacker',
	// 		media: dotMedia.Regen,
	// 		// media: 'media/regen_increase'
	// 	};

	// 	const increased5DRAfterStunnedEffect = {
	// 		type: 'Modifier',
	// 		modifiers: {
	// 			increasedDamageReduction: 5,
	// 		},
	// 		maxStacks: 1,
	// 		stacksToAdd: 1,
	// 		turns: Infinity,
	// 		countsOn: 'Target',
	// 		character: 'Attacker',
	// 		media: effectMedia.defenseUp
	// 		// media: 'media/evasion_increase'
	// 	};

	// 	const heal12ForFirst5AttacksEffect = {
	// 		type: 'Modifier',
	// 		modifiers: {},
	// 		maxStacks: 5,
	// 		stacksToAdd: 1,
	// 		turns: Infinity,
	// 		countsOn: 'Target',
	// 		character: 'Attacker',
	// 		media: dotMedia.Regen,
	// 		// media: 'media/regen_increase'
	// 	};

	// 	let mods = {}
	// 	mods.writeAttackEffect2 = (game, attack) => (effect, writer) => {
	// 		if (attack === game.itemEffectAttack) {
	// 			writer.writeUint8(18);
	// 			writer.writeNamespacedObject(game.itemEffectAttack.getItemEffectFromEffect(effect));
	// 		} else {
	// 			let effectType = 0;
	// 			let effectID = attack.onhitEffects.findIndex((onhit) => onhit === effect);
	// 			if (effectID === -1) {
	// 				effectID = attack.prehitEffects.findIndex((prehit) => prehit === effect);
	// 				effectType = 1;
	// 			}
	// 			if (effectID === -1) {
	// 				if (effect === afflictionEffect)
	// 					effectType = 2;
	// 				else if (effect === frostBurnEffect)
	// 					effectType = 3;
	// 				else if (effect instanceof SlowEffect) {
	// 					effectType = 4;
	// 					effectID = effect.modifiers.increasedAttackIntervalPercent;
	// 				} else if (effect === absorbingSkinEffect)
	// 					effectType = 5;
	// 				else if (effect === dualityEffect)
	// 					effectType = 6;
	// 				else if (effect === rageEffect)
	// 					effectType = 7;
	// 				else if (effect === darkBladeEffect)
	// 					effectType = 8;
	// 				else if (effect instanceof EndOfTurnEvasionEffect) {
	// 					effectType = 9;
	// 					effectID = effect.modifiers.increasedGlobalEvasion;
	// 				} else if (effect === shockEffect)
	// 					effectType = 10;
	// 				else if (effect === assassinEffect)
	// 					effectType = 11;
	// 				else if (effect === decreasedEvasionStackingEffect)
	// 					effectType = 12;
	// 				else if (effect === growingMadnessEffect)
	// 					effectType = 13;
	// 				else if (effect === momentInTimeEffect)
	// 					effectType = 14;
	// 				else if (effect === reignOverTimeEffect)
	// 					effectType = 15;
	// 				else if (effect === shadowCloakEffect)
	// 					effectType = 17;
	// 				else if (effect === increased5DROnHitEffect)
	// 					effectType = 19;
	// 				else if (effect === heal12ForFirstStunEffect)
	// 					effectType = 20;
	// 				else if (effect === increased5DRAfterStunnedEffect)
	// 					effectType = 21;
	// 				else if (effect === heal12ForFirst5AttacksEffect)
	// 					effectType = 22;
	// 				else
	// 					throw new Error('Attempted to encode invalid modifier effect.');
	// 			}
	// 			writer.writeUint8(effectType);
	// 			writer.writeFloat64(effectID);
	// 		}
	// 	}

	// 	mods.readAttackEffect2 = function (reader, game, attack) {
	// 		let effect;
	// 		const effectType = reader.getUint8();
	// 		if (effectType === 18) {
	// 			const itemEffect = reader.getNamespacedObject(game.itemEffectAttack.itemEffects);
	// 			if (typeof itemEffect === 'string')
	// 				return undefined;
	// 			return itemEffect.effect;
	// 		} else {
	// 			const effectID = reader.getFloat64();
	// 			if (attack === undefined)
	// 				return undefined;
	// 			switch (effectType) {
	// 				case 0:
	// 					effect = attack.onhitEffects[effectID];
	// 					break;
	// 				case 1:
	// 					effect = attack.prehitEffects[effectID];
	// 					break;
	// 				case 2:
	// 					effect = afflictionEffect;
	// 					break;
	// 				case 3:
	// 					effect = frostBurnEffect;
	// 					break;
	// 				case 4:
	// 					effect = new SlowEffect(effectID, 2);
	// 					break;
	// 				case 5:
	// 					effect = absorbingSkinEffect;
	// 					break;
	// 				case 6:
	// 					effect = dualityEffect;
	// 					break;
	// 				case 7:
	// 					effect = rageEffect;
	// 					break;
	// 				case 8:
	// 					effect = darkBladeEffect;
	// 					break;
	// 				case 9:
	// 					effect = new EndOfTurnEvasionEffect(1, effectID, true);
	// 					break;
	// 				case 10:
	// 					effect = shockEffect;
	// 					break;
	// 				case 11:
	// 					effect = assassinEffect;
	// 					break;
	// 				case 12:
	// 					effect = decreasedEvasionStackingEffect;
	// 					break;
	// 				case 13:
	// 					effect = growingMadnessEffect;
	// 					break;
	// 				case 14:
	// 					effect = momentInTimeEffect;
	// 					break;
	// 				case 15:
	// 					effect = reignOverTimeEffect;
	// 					break;
	// 				case 16:
	// 					return undefined;
	// 				case 17:
	// 					effect = shadowCloakEffect;
	// 					break;
	// 				case 19:
	// 					effect = increased5DROnHitEffect;
	// 					break;
	// 				case 20:
	// 					effect = heal12ForFirstStunEffect;
	// 					break;
	// 				case 21:
	// 					effect = increased5DRAfterStunnedEffect;
	// 					break;
	// 				case 22:
	// 					effect = heal12ForFirst5AttacksEffect;
	// 					break;
	// 				default:
	// 					throw new Error(`Error deserializing data, effectType ${effectType} is invalid.`);
	// 			}
	// 		}
	// 		return effect;
	// 	}

	// 	ctx.patch(Character, "encodeModifierEffects").replace(function (o, attackMap, writer) { // Modify writeAttackEffect
	// 		writer.writeMap(attackMap, writeNamespaced, (effectMap, writer, attack) => {
	// 			writer.writeMap(effectMap, mods.writeAttackEffect2(this.game, attack), (activeEffect, writer) => {
	// 				writer.writeFloat64(activeEffect.turnsLeft);
	// 				writer.writeFloat64(activeEffect.stacks);
	// 			}
	// 			);
	// 		});
	// 	})

	// 	ctx.patch(Character, "decodeModifierEffects").replace(function (o, reader, version) { // Modify readAttackEffectƒ
	// 		return reader.getMap(readNamespacedReject(this.game.specialAttacks), (reader, attack) => {
	// 			const effectMap = reader.getMap((reader) => {
	// 				const effect = mods.readAttackEffect2(reader, this.game, attack);
	// 				if (effect === undefined || effect.type !== 'Modifier')
	// 					return undefined;
	// 				return effect;
	// 			}
	// 				, (reader) => {
	// 					return {
	// 						turnsLeft: reader.getFloat64(),
	// 						stacks: reader.getFloat64(),
	// 					};
	// 				}
	// 			);
	// 			if (effectMap.size === 0)
	// 				return undefined;
	// 			return effectMap;
	// 		}
	// 		);
	// 	})
	// }

	// const checkIfShocked = () => {
	// 	[...game.combat.player.modifierEffects.fromTarget.countSelf].filter(effectMap => [...effectMap[1].keys()].filter(y => y.media === "assets/media/status/shocked.svg") !== []) !== [] || [...game.combat.player.modifierEffects.fromSelf.countSelf].filter(effectMap => [...effectMap[1].keys()].filter(y => y.media === "assets/media/status/shocked.svg") !== []) !== []
	// }

	// Add/remove modifiers
	// const patchItemModifiers = (patchFlag) => {
	// 	if (patchFlag) {
	// 		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['increased5DROnBeingHit'] // Base game
	// 		game.items.getObjectByID('melvorTotH:FrostSpark_Amulet').modifiers['increasedHealWhenStunned'] = 7 // Base game

	// 		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers[newModifiers.bundled_heal] = 1
	// 		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers[newModifiers.bundled_dr] = 1
	// 		game.items.getObjectByID('melvorTotH:Leviathan_Shield').modifiers[newModifiers.levi_heal] = 1

	// 		//			game.items.getObjectByID("melvorTotH:Bundled_Protection_Body")._customDescription = ""
	// 		game.items.getObjectByID("melvorTotH:FrostSpark_Amulet")._customDescription = 'Passive: +20% Reflect Damage and +10% chance to ignore Stuns and Freezes. When you are Slowed or Frozen: Heal 7% max HP, gain +80 Maximum Hitpoints and +3% Damage Reduction. <br><span class="text-warning">When equipped with Frostspark Boots and Frostspark 1H Sword: +10% chance to ignore Stuns and Freezes, -0.2s Attack Interval, and +15% Maximum Hit</span>'
	// 		//			game.items.getObjectByID("melvorTotH:Leviathan_Shield")._customDescription = ""

	// 		// Object.defineProperty(game.items.getObjectByID("melvorTotH:Bundled_Protection_Body"), 'isModded', { get() { return true }, configurable: true })
	// 		// Object.defineProperty(game.items.getObjectByID("melvorTotH:FrostSpark_Amulet"), 'isModded', { get() { return true }, configurable: true })
	// 		// Object.defineProperty(game.items.getObjectByID("melvorTotH:Leviathan_Shield"), 'isModded', { get() { return true }, configurable: true })
	// 	} else {
	// 		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['increased5DROnBeingHit'] = 1 // Base game
	// 		delete game.items.getObjectByID('melvorTotH:FrostSpark_Amulet').modifiers['increasedHealWhenStunned'] // Base game

	// 		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers[newModifiers.bundled_heal]
	// 		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers[newModifiers.bundled_dr]
	// 		delete game.items.getObjectByID('melvorTotH:Leviathan_Shield').modifiers[newModifiers.levi_heal]

	// 		game.items.getObjectByID("melvorTotH:Bundled_Protection_Body")._customDescription = savedItemDescriptions.bundled_protection_body
	// 		game.items.getObjectByID("melvorTotH:FrostSpark_Amulet")._customDescription = savedItemDescriptions.frostspark_amulet
	// 		game.items.getObjectByID("melvorTotH:Leviathan_Shield")._customDescription = savedItemDescriptions.leviathan_shield

	// 		// Object.defineProperty(game.items.getObjectByID("melvorTotH:Bundled_Protection_Body"), 'isModded', { get() { return false }, configurable: true })
	// 		// Object.defineProperty(game.items.getObjectByID("melvorTotH:FrostSpark_Amulet"), 'isModded', { get() { return false }, configurable: true })
	// 		// Object.defineProperty(game.items.getObjectByID("melvorTotH:Leviathan_Shield"), 'isModded', { get() { return false }, configurable: true })
	// 	}
	// }

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
			label: 'Enable CO rebalance: Several drop tables adjusted, Combat Max Capes added and various QoL features included. Drop tables are mostly rebalanced for runes, but also for Linden Boat requirements.',
			hint: 'HP capped at 99 until 10k Dark Waters kills.',
			default: false,
			onChange: (value) => { ctx.characterStorage.setItem(buttonNames.rebalance, value); coRebalancePatch(value); }
		},
		{
			type: 'switch',
			name: `${buttonNames.summoning}-button`,
			label: 'Enable Summoning: Summoning tablets added to drop tables.',
			hint: `Tablets are primarily found in the Strange Cave, and also in the shop.`,
			default: false,
			onChange: (value) => { ctx.characterStorage.setItem(buttonNames.summoning, value); coSummoningPatch(value) }
		},
		{
			type: 'switch',
			name: `${buttonNames.marks}-button`,
			label: 'Enable Mark rebalance: Tablets become unlimited at mark level 7, but marks are only obtained with the familiar equipped.',
			default: false,
			onChange: (value) => { ctx.characterStorage.setItem(buttonNames.marks, value); coMarkRebalance(value) }
		},
		{
			type: 'switch',
			name: `${buttonNames.reroll}-button`,
			label: 'Enable repeat slayer tasks button: Current task can be repeated indefinitely, but a penalty of -65% fewer slayer coins and -65% slayer experience will be applied while doing so.',
			hint: `If repeat current task is enabled, the current monster will be set as a slayer task if it is within the selected tier when rolling for a task.`,
			default: false,
			onChange: (value) => {
				if (value === false) {
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
			onChange: (value) => { ctx.characterStorage.setItem(buttonNames.township, value); coTownshipPatch(value) }
		}
	])

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
			game.pages.getObjectByID("melvorD:Summoning").skillSidebarCategoryID = 'Combat' // Add summoning to sidebar category combat
			document.querySelector("#skill-header-melvorD\\:Summoning > mastery-skill-options").classList.add('d-none') // Hide mastery options entirely
			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(8)").appendChild([...document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(9)").childNodes].filter(x => x.childNodes[0]?.childNodes[1]?.innerText == "Summoning")[0]) // Move the summoning skill to the combat area
			makeSkillCombatOnly(summoningButtonValue(), "Summoning", "Non-Combat")
			document.querySelector("#horizontal-navigation-summoning > ul > li:nth-child(2)").classList.add('d-none') // Hide tablets/familiar page
			document.querySelectorAll(`[lang-id=CREATE_FAMILIAR`).forEach(x => x.parentElement.parentElement.classList.add('d-none')) // Hide all "create tablet" elements on each of the summoning marks
			document.querySelector("#mark-discovery-elements > div:nth-child(2) > h5 > lang-string:nth-child(4)").classList.add('d-none') // Hide message about creating tablets
			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(8) > li:nth-child(11)").classList.add('d-none') // Hide summoning by default
			sidebar.categories().filter(x => x.id == "Non-Combat")[0].items().filter(x => x.id == `melvorD:Summoning`)[0].itemEl.classList.add('d-none')
		}

		sidebar.category('Non-Combat').rootEl.classList.add('d-none') // Hide non-combat area instead of remove()ing it, as that would affect Summoning as well
		sidebar.categories().filter(x => x.id == "Passive")[0].items().filter(x => x.id == `melvorD:Farming`)[0].itemEl.classList.add('d-none') // Hide farming


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

			// ctx.patch(Player, "quickEquipSynergy").before(function (synergy) {
			// 	if (!markButtonValue())
			// 		return

			// 	patchEquipmentQuantity(!atMaxMarkLevel(synergy.summons[0].product), summoningSlots[0])
			// 	patchEquipmentQuantity(!atMaxMarkLevel(synergy.summons[1].product), summoningSlots[1])

			// 	// const mark1 = synergy.summons[0].product;
			// 	// const mark2 = synergy.summons[1].product;

			// 	// if (atMaxMarkLevel(mark1)) equipmentSlotData['Summon1'].allowQuantity = false
			// 	// else equipmentSlotData['Summon1'].allowQuantity = true
			// 	// if (atMaxMarkLevel(mark2)) equipmentSlotData['Summon2'].allowQuantity = false
			// 	// else equipmentSlotData['Summon2'].allowQuantity = true

			// 	return
			// })

			// ctx.patch(Player, "changeEquipmentSet").before(function (setID) {
			// 	if (!markButtonValue())
			// 		return

			// 	patchEquipmentQuantity(!atMaxMarkLevel(this.equipmentSets[setID].equipment.slots.Summon1), summoningSlots[0])
			// 	patchEquipmentQuantity(!atMaxMarkLevel(this.equipmentSets[setID].equipment.slots.Summon2), summoningSlots[1])
			// })
		}
		const patchSummoningSynergySearch = (patchFlag) => {

			// const bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)
			// const combatRecipes = game.summoning.synergies.filter(x => x.summons[0].skills.some(y => !bannedSkills.includes(y.id)) || x.summons[1].skills.some(y => !bannedSkills.includes(y.id))) // Check neither of the summons are associated with non-combats
			// const combatFamiliars = game.summoning.actions.filter(x => x.skills.some(y => !bannedSkills.includes(y.id)) && x.id !== "melvorTotH:Fox")
			// const combatSynergies = new Map(combatRecipes.map((synergy) => { // Map between combat synergies and their search element
			// 	const searchElement = new SummoningSynergySearch();
			// 	searchElement.className = 'col-12 col-lg-6';
			// 	summoningSearchMenu._content.append(searchElement);
			// 	summoningSearchMenu.visibleSynergies.add(searchElement);
			// 	return [synergy, searchElement];
			// }))

			// // Reset 
			// summoningSearchMenu.visibleSynergies = new Set()
			// summoningSearchMenu.searchElements.forEach((element) => {
			// 	hideElement(element)
			// 	// if (combatSynergies.get(element)) {
			// 	// 	showElement(element);
			// 	// 	summoningSearchMenu.visibleSynergies.add(element);
			// 	// }
			// });

			// combatSynergies.forEach((element) => {
			// 	showElement(element);
			// 	summoningSearchMenu.visibleSynergies.add(element);
			// });

			// // showUnlockedSynergies() { // Reference code
			// // 	this.searchElements.forEach((element, synergy) => {
			// // 		if (game.summoning.isSynergyUnlocked(synergy)) {
			// // 			showElement(element);
			// // 			this.visibleSynergies.add(element);
			// // 		} else {
			// // 			hideElement(element);
			// // 			this.visibleSynergies.delete(element);
			// // 		}
			// // 	}
			// // 	);
			// // }

			// openSynergiesBreakdown
			// openSynergiesBreakdown = () => {
			// 	var _a;
			// 	if (!game.summoning.isUnlocked) {
			// 		lockedSkillAlert(game.summoning, 'SKILL_UNLOCK_OPEN_MENU');
			// 	} else {
			// 		summoningSearchMenu.updateVisibleElementUnlocks();
			// 		summoningSearchMenu.updateVisibleElementQuantities();
			// 		$('#modal-summoning-synergy').modal('show');
			// 		let markToShow;
			// 		if (((_a = game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined) {
			// 			const action = game.openPage.action;
			// 			if (action instanceof Skill)
			// 				markToShow = game.summoning.getMarkForSkill(action);
			// 		}
			// 		if (markToShow !== undefined && game.summoning.getMarkLevel(markToShow) > 0)
			// 			summoningSearchMenu.showSynergiesWithMark(markToShow);
			// 		else
			// 			summoningSearchMenu.showUnlockedSynergies();
			// 	}
			// }


			// // updateFilterOptions() { // Reference code
			// // 	combatFamiliars.forEach((mark)=>{
			// // 		const option = this.filterOptions.get(mark);
			// // 		if (option === undefined)
			// // 			return;
			// // 		const item = mark.product;
			// // 		if (game.summoning.getMarkLevel(mark) > 0) {
			// // 			option.name.textContent = item.name;
			// // 			option.image.src = item.media;
			// // 			option.link.onclick = ()=>this.showSynergiesWithMark(mark);
			// // 		} else {
			// // 			option.name.textContent = getLangString('MENU_TEXT', 'QUESTION_MARKS');
			// // 			option.image.src = cdnMedia('assets/media/main/question.svg');
			// // 			option.link.onclick = null;
			// // 		}
			// // 	}
			// // 	);
			// // }

			// ctx.patch(SynergySearchMenu, "updateSearchArray").replace(function (o) {

			// 	const nonCombatFamiliarLocations = [3, 4, 5, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22, 23]
			// 	document.querySelector("#summoning-synergies-search-cont > synergy-search-menu > div.col-12.col-lg-6.text-right.show > div").children.forEach((x, i) => {
			// 		if (nonCombatFamiliarLocations.includes(i))
			// 			x.classList.add('d-none')
			// 	})

			// 	ctx.patch(Summoning, "updateSearchArray").replace(function (o) {
			// 		if (!summoningButtonValue())
			// 			return o()
			// 		Summoning.searchArray = combatRecipes.map((synergy) => {
			// 			const name1 = synergy.summons[0].product.name;
			// 			const name2 = synergy.summons[1].product.name;
			// 			return {
			// 				synergy,
			// 				description: synergy.description,
			// 				name1,
			// 				name2,
			// 				name1long: templateLangString('MENU_TEXT', 'THE_FAMILIAR', { name: name1 }),
			// 				name2long: templateLangString('MENU_TEXT', 'THE_FAMILIAR', { name: name2 }),
			// 			};
			// 		});
			// 	})
			// })
		}

		ctx.patch(SynergySearchMenu, "updateFilterOptions").replace(function (o) {
			if (!summoningButtonValue()) {
				// summoningSearchMenu.filterOptionsContainer.style.height = '80vh'
				return o()
			}

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
			summoningSearchMenu.filterOptionsContainer.style.height = '49vh'
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
				if (((_a = game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined) {
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

			if (this.visibleCompletion == this.coNamespaceID) {
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

			if (this.visibleCompletion == this.coNamespaceID)
				return
			this.game.masterySkills.forEach((skill) => {
				if (skill.hasMastery) {
					skill.addTotalCurrentMasteryToCompletion(this.masteryProgress.currentCount);
					skill.totalMasteryActions.forEach((total, namespace) => {
						this.masteryProgress.maximumCount.add(namespace, total * skill.masteryLevelCap);
						// this.masteryProgress.maximumCount.add(this.coNamespaceID, total * skill.masteryLevelCap);
					});
				}
			});
		})

		ctx.patch(Completion, "updateItemProgress").replace(function (o) {
			this.itemProgress.currentCount.clear();
			this.itemProgress.maximumCount.clear();
			setCOFlags();

			if (this.visibleCompletion == this.coNamespaceID) {
				this.game.items.filter(x => x.isCO).forEach((item) => {
					if (!item.ignoreCompletion) {
						if (this.game.stats.itemFindCount(item) > 0) {
							this.itemProgress.currentCount.inc(item.namespace);
							this.itemProgress.currentCount.inc(this.coNamespaceID);
						}
						this.itemProgress.maximumCount.inc(item.namespace);
						this.itemProgress.maximumCount.inc(this.coNamespaceID);
					}
				});
			} else {
				this.game.items.forEach((item) => {
					if (!item.ignoreCompletion) {
						if (this.game.stats.itemFindCount(item) > 0) {
							this.itemProgress.currentCount.inc(item.namespace);
							this.itemProgress.currentCount.inc(this.coNamespaceID);
						}
						this.itemProgress.maximumCount.inc(item.namespace);
						if (item.isCO)
							this.itemProgress.maximumCount.inc(this.coNamespaceID);
					}
				});
			}
		})


		ctx.patch(Completion, "updateMonsterProgress").replace(function (o) {
			this.monsterProgress.currentCount.clear();
			this.monsterProgress.maximumCount.clear();
			setCOFlags();

			this.game.monsters.forEach((monster) => {
				if (!monster.ignoreCompletion) {
					if (this.game.stats.monsterKillCount(monster) > 0) {
						this.monsterProgress.currentCount.inc(monster.namespace);
						this.monsterProgress.currentCount.inc(this.coNamespaceID);
					}
					this.monsterProgress.maximumCount.inc(monster.namespace);
					this.monsterProgress.maximumCount.inc(this.coNamespaceID);
				}
			});
		})

		ctx.patch(Completion, "updatePetProgress").replace(function (o) {
			this.petProgress.currentCount.clear();
			this.petProgress.maximumCount.clear();
			setCOFlags();

			if (this.visibleCompletion == this.coNamespaceID) {
				this.game.pets.filter(x => x.isCO).forEach((pet) => {
					if (!pet.ignoreCompletion) {
						if (this.game.petManager.isPetUnlocked(pet)) {
							this.petProgress.currentCount.inc(pet.namespace);
							this.petProgress.currentCount.inc(this.coNamespaceID);
						}
						this.petProgress.maximumCount.inc(pet.namespace);
						this.petProgress.maximumCount.inc(this.coNamespaceID);
					}
				})
			} else {
				this.game.pets.forEach((pet) => {
					if (!pet.ignoreCompletion) {
						if (this.game.petManager.isPetUnlocked(pet)) {
							this.petProgress.currentCount.inc(pet.namespace);
							this.petProgress.currentCount.inc(this.coNamespaceID);
						}
						this.petProgress.maximumCount.inc(pet.namespace);
						if (pet.isCO)
							this.petProgress.maximumCount.inc(this.coNamespaceID);
					}
				})
			}
		})

		ctx.patch(Completion, "updateTotalProgress").before(function () {
			// const previousProgressCO = this.totalProgressMap.get(this.this.coNamespaceID);
			this.totalProgressMap.set(this.coNamespaceID, this.computeTotalProgressPercent(this.coNamespaceID));
			this.renderQueue.totalProgressCO = true;
		})

		ctx.patch(Completion, "render").after(function () {
			const sideBarItem = sidebar.category('General').item('Completion Log');
			if (this.renderQueue.totalProgressCO) {
				if (this.visibleCompletion === this.coNamespaceID && sideBarItem.asideEl !== undefined)
					sideBarItem.asideEl.textContent = parseProgress(this.totalProgressCO);
				$('.comp-log-percent-combat_only').text(parseProgress(this.totalProgressCO));
				$('.comp-log-percent-progress-combat_only').css('width', `${this.totalProgressCO}%`);
				if (this.totalProgressCO >= 100) {
					$('.comp-log-comp-percent-combat_only').addClass('text-success');
					$('.comp-log-comp-percent-combat_only').addClass('font-w600');
				}
				this.renderQueue.totalProgressCO = false;
			}
		})
		// }
		// ctx.patch(Completion, "buildItemLog").after(function (returnVal) {
		// 	filterItemLog(0)
		// })

		if (game.completion.visibleCompletion == game.completion.coNamespaceID)
			document.getElementById("combat_only-visible-completion-button").classList.replace('btn-outline-info', 'btn-info');
		game.completion.updateAllCompletion()

		ctx.patch(Completion, "updateAllCompletion").before(function () {
			toggleUnavailableSkills(this.visibleCompletion == this.coNamespaceID)
			toggleUnavailableMasteries(this.visibleCompletion == this.coNamespaceID)
			toggleUnavailableItems(this.visibleCompletion == this.coNamespaceID)
			toggleUnavailablePets(this.visibleCompletion == this.coNamespaceID)
		})


		const patchTownship = (patchFlag) => {

			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(9)").classList.remove('d-none')
			// game.township.setUnlock(true)
			// game.township.confirmTownCreation()
			// game.township.tasks.skipTownshipTutorial()
			// document.querySelector("#horizontal-navigation-township > ul").childNodes.forEach(x => { if (x.childNodes[1]?.id != "BTN_TASKS") x?.classList?.add('d-none') })
			// document.querySelector("#township-container > div.skill-info").classList.add('d-none')
			// document.querySelector("#township-container > div.row.row-deck.gutters-tiny").childNodes.forEach(x => { if (!(x.id == "township-category-menu" || x.id == "DIV_CONTAINER")) x?.classList?.add('d-none') })

			// v2
			patchSkill(patchFlag, "Township", "Passive")
			patchSidebarCategory(patchFlag, "Passive")
			enableTown(patchFlag)

			// game.township.tasks.completedTasks.forEach((task) => {
			// 	if (!(task instanceof DummyTownshipTask)) {
			// 		game.township.tasks.completedTasks.delete(task);
			// 		game.township.tasks._tasksCompleted--;
			// 	}
			// }); // Reset all tasks

			// game.township.tasks.skipTownshipTutorial()
			sidebar.categories().filter(x => x.id == "Passive")[0].items().filter(x => x.id == `melvorD:Township`)[0].asideEl.classList.add('d-none') // Township isn't a skill and shouldnt have a level
			townshipUI.currentPage = 2

			// const elements = [
			// 	document.querySelector("#township-container > div.skill-info"),
			// 	document.querySelector("#township-container > div.skill-info.d-none"),
			// 	document.querySelector("#TOWNSHIP_ALERT_TUTORIAL"),
			// 	document.querySelector("#township-container > div.row.row-deck.gutters-tiny > div:nth-child(2)"),
			// 	document.querySelector("#TOWN_NO_FOOD_NOTIFICATION"),
			// 	document.querySelector("#TOWN_LOSING_FOOD_NOTIFICATION"),
			// 	document.querySelector("#TOWN_NO_STORAGE_NOTIFICATION"),
			// 	document.querySelector("#TOWN_NO_PRIORITY_NOTIFICATION"),
			// 	document.querySelector("#DIV_GENERATE_TOWN"),
			// 	document.querySelector("#horizontal-navigation-township > ul > li:nth-child(1)"),
			// 	document.querySelector("#horizontal-navigation-township > ul > li:nth-child(2)"),
			// 	document.querySelector("#horizontal-navigation-township > ul > li:nth-child(3)"),
			// 	document.querySelector("#horizontal-navigation-township > ul > li:nth-child(5)"),
			// 	document.querySelector("#horizontal-navigation-township > ul > li:nth-child(6)"),
			// 	document.querySelector("#horizontal-navigation-township > ul > li:nth-child(7)"),
			// ]
			// elements.forEach(x => x?.classList?.add('d-none'))
			hideTownshipElements()

			// Object.entries(townshipUI.defaultElements.btn).filter(x => x[0] != "tasks").map(x => x[1].parentElement).forEach(x => x?.classList?.add('d-none'))
			// Object.entries(townshipUI.defaultElements.div).filter(x => x[0] != "container" && x[0] != "categoryMenu" && x[0] != "tasks").map(x => x[1]).forEach(x => x?.classList?.add('d-none'))


			const checkTownshipItems = (coDrops) => {
				let obtainableItems = new Set([...coDrops])
				let currentLength = -1
				while (currentLength !== obtainableItems.size) {
					currentLength = obtainableItems.size
					const newItems = game.township.tasks.tasks.filter(x => x.goals.items.every(y => obtainableItems.has(y.item.id))).map(x => x.rewards.items).flat().map(x => x.item.id)
					obtainableItems = new Set([...obtainableItems, ...newItems])
				}
				return obtainableItems
			}
			const bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)

			const obtainableItems = new Set([...checkTownshipItems(getCOItemList())])
			const COtasks = [...game.township.tasks.tasks.filter(x => x.goals.items.every(y => obtainableItems.has(y.item.id))), ...game.township.tasks.tasks.filter(x => x.goals.skillXP.some(y => !bannedSkills.includes(y.skill.id)))]

			// COtasks.forEach(x => x['isCO'] = true)
			// tasks.forEach(x => game.township.tasks.completeTask(x, false, true))

			// V1.1.1
			// ctx.patch(TownshipTasks, "showTaskCategory").replace((o, category) => {
			// 	if (!townshipButtonValue())
			// 		return o(category)

			// 	if (this.isTaskCategoryComplete(category))
			// 		return;
			// 	if (category !== 'TownshipTutorial' && this.tasksCompleted < 3) {
			// 		notifyPlayer(game.township, 'You must complete at least 3 Township Starter Guide Tasks before you can start other tasks.', 'danger');
			// 		return;
			// 	}
			// 	const element = townshipUI.defaultElements.div.tasks;
			// 	element.innerHTML = '';
			// 	const row = createElement('div', {
			// 		classList: ['row']
			// 	});
			// 	row.append(this.createTaskCompletedBreakdown());
			// 	row.append(this.createTaskButtonHeader());
			// 	if (category === 'TownshipTutorial') {
			// 		const div = createElement('div', {
			// 			classList: ['col-12', 'mb-2']
			// 		});
			// 		const btn = createElement('button', {
			// 			classList: ['btn', 'btn-sm', 'btn-danger'],
			// 			text: 'Skip Tutorial'
			// 		});
			// 		btn.onclick = () => this.game.township.tasks.skipTownshipTutorial();
			// 		div.appendChild(btn);
			// 		row.append(div);
			// 	}
			// 	this.tasks.forEach((task) => {
			// 		if (task.category === category && !this.completedTasks.has(task) && this.isTaskRequirementMet(task) && COtasks.includes(task))
			// 			row.append(this.createTaskElement(task));
			// 	});
			// 	element.append(row);
			// 	this.activeTaskCategory = category;
			// })

			// ctx.patch(TownshipTasks, "showTaskCategory").replace(function (o, category) {
			// 	if (!townshipButtonValue())
			// 		return o(category)
			// 	if (this.isTaskCategoryComplete(category))
			// 		return;
			// 	const element = townshipUI.defaultElements.div.tasks;
			// 	element.innerHTML = '';
			// 	const row = createElement('div', {
			// 		classList: ['row']
			// 	});
			// 	row.append(this.createTaskCompletedBreakdown());
			// 	row.append(this.createTaskButtonHeader());
			// 	if (category !== 'Daily') {
			// 		this.tasks.forEach((task) => {
			// 			if (task.category === category && !this.completedTasks.has(task) && isRequirementMet(task.requirements))
			// 				row.append(this.createTaskElement(task));
			// 		});
			// 	} else {
			// 		this.game.township.casualTasks.currentCasualTasks.forEach((task, id) => {
			// 			if (!this.game.township.casualTasks.completedCasualTasks.includes(task) && isRequirementMet(task.requirements) && COtasks.includes(task))
			// 				row.append(this.createTaskElement(task));
			// 		});
			// 	}
			// 	element.append(row);
			// 	this.activeTaskCategory = category;
			// 	ctx.patch(Township, "hasMinibar").get((o) => {
			// 		if (!townshipButtonValue())
			// 			return o()
			// 		else
			// 			return false
			// 	})
			// })
			// ctx.patch(Township, "isCombat").get((o) => {
			// 	if (!townshipButtonValue())
			// 		return o()
			// 	else
			// 		return true
			// })



			// const elements2 = [
			// 	townshipUI.defaultElements.btn.build,
			// 	townshipUI.defaultElements.btn.citizens,
			// 	townshipUI.defaultElements.btn.convertResources,
			// 	townshipUI.defaultElements.btn.settings,
			// 	townshipUI.defaultElements.btn.town,
			// 	townshipUI.defaultElements.btn.yeetResources
			// ]
			// elements2.forEach(x => hideElement(x))


			// document.querySelector("#DIV_TASKS > div > div:nth-child(3)").classList.add('d-none')
			// document.querySelector("#DIV_TASKS > div > div:nth-child(2) > button.btn.btn-sm.m-1.text-white.bg-township").classList.add('d-none')
			// document.querySelector("#DIV_TASKS > div > div:nth-c hild(2) > button.btn.btn-sm.m-1.text-white.bg-primary").classList.add('d-none')

			// townshipLoot = new Set()
			// game.township.tasks.tasks.forEach(x => townshipLoot.add(x.rewards.items))
			// townshipLootUnravelled = new Set()
			// townshipLoot.forEach(x => x.forEach(y => townshipLootUnravelled.add(y.item)))
		}

		patchTownship(townshipButtonValue())

		if (summoningButtonValue()) {
			coSummoningPatch(summoningButtonValue())
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
				children: [`${game.currentGamemode.localID.toUpperCase()} Mod V${versionNumber.major}.${versionNumber.minor}`],
			}),
			after: 'Game Version',
			onClick() { potatoPatchNotes() }
		});
		console.log("Loading CO gamemode complete.")
	})
	// ## Mod Hooks
	await ctx.onCharacterLoaded(c => {
		if (!coGamemodeCheck()) {
			console.log("CO Gamemode not detected, mod will not be loaded.")
			return
		}
		if (mod.api.reroll)
			mod.api.reroll.externalPatchFlag = true

		console.log("Loading CO gamemode...")
		// Setup functions
		// function initEffectRebalance() {
		// 	const createNewModifiers = () => {
		// 		// Create new modifiers 
		// 		// Idk why these exist really

		// 		game.modifiers[newModifiers.bundled_heal] = 0 // Bundled protection
		// 		game.modifiers[newModifiers.bundled_dr] = 0 // Bundled protection
		// 		game.modifiers[newModifiers.levi_heal] = 0 // Leviathan

		// 		game.combat.player.mods = {}
		// 		game.combat.player.mods[newModifiers.bundled_heal] = { maxStacks: 1, stackCounter: 0, amount: 12 } // Bundled protection
		// 		game.combat.player.mods[newModifiers.bundled_dr] = { maxStacks: 1, stackCounter: 0, amount: 5 } // Bundled protection
		// 		game.combat.player.mods[newModifiers.levi_heal] = { maxStacks: 5, stackCounter: 0, amount: 12 } // Leviathan

		// 		// Create new descriptions
		// 		modifierData[newModifiers.bundled_heal] = {
		// 			get langDescription() {
		// 				return getLangString('MODIFIER_DATA', newModifiers.bundled_heal);
		// 			},
		// 			//description: "When stunned by an Enemy, heal for 12% of your max HP. Activates once per fight.",
		// 			isNegative: false, isSkill: false, tags: ['combat']
		// 		}

		// 		modifierData[newModifiers.bundled_dr] = {
		// 			get langDescription() {
		// 				return getLangString('MODIFIER_DATA', newModifiers.bundled_dr);
		// 			},
		// 			//description: "When stunned by an Enemy, gain +5% DR for the remainder of the fight. Activates once per fight.",
		// 			isNegative: false, isSkill: false, tags: ['combat']
		// 		}

		// 		modifierData[newModifiers.levi_heal] = {
		// 			get langDescription() {
		// 				return getLangString('MODIFIER_DATA', newModifiers.levi_heal);
		// 			},
		// 			//description: "When hit by an Enemy, heal for 12% of your max HP and heal for 12% of your max HP at the end of combat. Activates up to 5 times per fight.",
		// 			isNegative: false, isSkill: false, tags: ['combat']
		// 		}

		// 		// Pre v1.1.2 
		// 		// loadedLangJson.MODIFIER_DATA[newModifiers.bundled_heal] = "When stunned by an Enemy, heal for 12% of your max HP. Activates once per fight"
		// 		// loadedLangJson.MODIFIER_DATA[newModifiers.bundled_dr] = "When stunned by an Enemy, gain +5% DR for the remainder of the fight. Activates once per fight"
		// 		// loadedLangJson.MODIFIER_DATA[newModifiers.levi_heal] = "When hit by an Enemy, heal for 12% of your max HP, and heal for 12% of your max HP at the end of combat. Activates up to 5 times per fight"

		// 		// Post v1.1.2
		// 		loadedLangJson[`MODIFIER_DATA_${newModifiers.bundled_heal}`] = "When stunned by an Enemy, heal for 12% of your max HP. Activates once per fight"
		// 		loadedLangJson[`MODIFIER_DATA_${newModifiers.bundled_dr}`] = "When stunned by an Enemy, gain +5% DR for the remainder of the fight. Activates once per fight"
		// 		loadedLangJson[`MODIFIER_DATA_${newModifiers.levi_heal}`] = "When hit by an Enemy, heal for 12% of your max HP, and heal for 12% of your max HP at the end of combat. Activates up to 5 times per fight"
		// 	}

		// 	const patchModifierFunctions = () => {
		// 		ctx.patch(BaseManager, "startFight").before(function (tickOffset) {
		// 			if (!rebalanceButtonValue())
		// 				return
		// 			game.combat.player.mods[newModifiers.bundled_dr].stackCounter = 0 // Reset
		// 			game.combat.player.mods[newModifiers.bundled_heal].stackCounter = 0 // Reset
		// 		})

		// 		ctx.patch(BaseManager, "endFight").before(function () {
		// 			if (!rebalanceButtonValue())
		// 				return
		// 			game.combat.player.mods[newModifiers.bundled_dr].stackCounter = 0 // Reset
		// 			game.combat.player.mods[newModifiers.bundled_heal].stackCounter = 0 // Reset
		// 			if (this.player.modifiers[newModifiers.levi_heal] > 0) {
		// 				const healing = Math.floor(
		// 					(game.combat.player.stats.maxHitpoints * game.combat.player.mods[newModifiers.levi_heal].amount) / 100
		// 				);
		// 				game.combat.player.heal(healing);
		// 				game.combat.player.mods[newModifiers.levi_heal].stackCounter++;
		// 			}
		// 		})

		// 		ctx.patch(Player, "onBeingStunned").after(function () {
		// 			if (!rebalanceButtonValue())
		// 				return

		// 			if (this.stun.flavour === "Stun") {
		// 				if (this.modifiers[newModifiers.bundled_heal] > 0) {
		// 					// this.applyModifierEffect(heal12ForFirstStunEffect, this, this.game.normalAttack);
		// 					if (game.combat.player.mods[newModifiers.bundled_heal].stackCounter < game.combat.player.mods[newModifiers.bundled_heal].maxStacks) {
		// 						const healing = Math.floor((this.stats.maxHitpoints * game.combat.player.mods[newModifiers.bundled_heal].amount) / 100);
		// 						this.heal(healing);
		// 						game.combat.player.mods[newModifiers.bundled_heal].stackCounter++;
		// 					}
		// 				}
		// 				if (this.modifiers[newModifiers.bundled_dr] > 0) {
		// 					if (game.combat.player.mods[newModifiers.bundled_dr].stackCounter < game.combat.player.mods[newModifiers.bundled_dr].maxStacks) {
		// 						game.combat.player.mods[newModifiers.bundled_dr].stackCounter++
		// 					}
		// 					// this.applyModifierEffect(increased5DRAfterStunnedEffect, this, this.game.normalAttack);
		// 				}
		// 			}
		// 		})

		// 		ctx.patch(PlayerModifiers, "getFlatDamageReductionModifier").after(function (returnedValue) {
		// 			if (!rebalanceButtonValue())
		// 				return returnedValue

		// 			return returnedValue +
		// 				game.combat.player.mods[newModifiers.bundled_dr].stackCounter * // How many stacks
		// 				game.combat.player.mods[newModifiers.bundled_dr].amount * // How much DR per stack
		// 				this.increased5DRAfterStunned // Flag for whether modifier is present
		// 		})

		// 		ctx.patch(Player, "onBeingHit").before(function () {
		// 			if (!rebalanceButtonValue())
		// 				return

		// 			if (this.modifiers[newModifiers.levi_heal] > 0) {
		// 				if ([...game.combat.player.reflexiveEffects].filter(x => x[0].name == 'Spiky Skin')[0][1].stacks <= game.combat.player.mods[newModifiers.levi_heal].maxStacks) {
		// 					const healing = Math.floor((this.stats.maxHitpoints * game.combat.player.mods[newModifiers.levi_heal].amount) / 100);
		// 					this.heal(healing);
		// 					game.combat.player.mods[newModifiers.levi_heal].stackCounter++;
		// 					// this.applyModifierEffect(heal12ForFirst5AttacksEffect, this, this.game.normalAttack);
		// 				}
		// 			}
		// 		})
		// 	}

		// 	createNewModifiers()
		// 	patchItemModifiers(rebalanceButtonValue())
		// 	patchModifierFunctions()
		// }
		const patchIngameFunctions = () => {
			ctx.patch(Currency, "add").before(function (amount) {
				if (!rerollEnableButtonValue() || !slayerRerollButtonValue())
					return

				const modifyFlag = slayerRerollButtonValue() === undefined ? false : slayerRerollButtonValue() // check if characterStorage is undefined first
				if (this instanceof SlayerCoins)
					amount = Math.max(Math.floor(amount * (1 - 0.65 * modifyFlag)), 1)
				return [amount];
			})

			ctx.patch(Slayer, 'addXP').before((amount, masteryAction) => {
				if (!rerollEnableButtonValue() || !slayerRerollButtonValue())
					return

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
				if (monsterList.length == 1)
					return monsterList // This distinguishes between whether the user can't meet the requirement for any slayer task vs whether they only have 1 completable task
				else
					return monsterList.filter(x => x != this.monster)
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

				const bannedSkills = game.skills.filter(x => !x.isCombat || x.id == 'melvorD:Summoning').map(x => x.id) // Explicitly include Summoning because Fox cannot be obtained without making tablets
				const unlock = !this.actions.filter(x => x.skills.filter(y => !bannedSkills.includes(y.id)).length > 0).some((mark) => { // Convoluted way to filter to only have combat summon recipes left
					return mark.level <= 99 && this.getMarkCount(mark) < Summoning.markLevels[3];
				})
				if (unlock)
					this.game.petManager.unlockPetByID("melvorF:Mark");
			})
		}
		const removeLootChance = (monsterID) => {
			game.monsters.getObjectByID(monsterID).lootTable.totalWeight *= 100 / game.monsters.getObjectByID(monsterID).lootChance;
			game.monsters.getObjectByID(monsterID).lootChance = 100
		}

		const fixPoisonToad = () => {
			// Fix poison toad drop table by combining the 2 loot rolls into 1 roll. Can do other monsters in future if needed
			removeLootChance("melvorTotH:PoisonToad") // Remove loot chance from poison toad
			game.monsters.getObjectByID("melvorTotH:PoisonToad").lootTable.drops.forEach(x => { if (x.item.id == "melvorTotH:Bitterlyme_Seeds") x.weight = 696 }) // Replace empty drops with bitterlyme seeds
		}

		// initEffectRebalance()
		patchIngameFunctions()
		fixPoisonToad()

		patchUnavailableShopItems(false) // These are to set the correct initial state
		patchShopItemsForSummoning(false)

		ctx.patch(Player, "processDeath").replace(function (o) {
			this.removeAllEffects(true);
			this.setHitpoints(Math.floor(this.stats.maxHitpoints * 0.6)); // Modified this line too
			this.manager.addCombatStat(CombatStats.Deaths);
			this.manager.addMonsterStat(MonsterStats.KilledPlayer);
			this.applyDeathPenalty();
			// this.disableActivePrayers();
		})

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
				this.processCombatEvent(event);
				this.rendersRequired.equipment = true;
			})

			// const patchMarkChance = () => {
			// 	let storedFunction = Summoning.prototype.getChanceForMark
			// 	Summoning.prototype.getChanceForMark = function (mark, skill, modifiedInterval) {
			// 		// let storedFunction = game.summoning.getChanceForMark
			// 		// game.summoning.getChanceForMark = function (mark, skill, modifiedInterval) {
			// 		if (!markButtonValue())
			// 			return storedFunction(mark, skill, modifiedInterval);

			// 		let equippedModifier = 1;
			// 		// if (!this.game.combat.player.equipment.checkForItem(mark.product))
			// 		if (game.combat.player.equipment.slots.Summon1.item !== mark.product && game.combat.player.equipment.slots.Summon2.item !== mark.product)
			// 			equippedModifier = 0
			// 		return (equippedModifier * modifiedInterval) / (2000 * Math.pow(mark.tier + 1, 2));
			// 	}
			// }
			// patchMarkChance()

			// Can't patch this function unfortunately. It would need to be patched in onInterfaceReady for some reason
			// ctx.patch(Summoning, "getChanceForMark").replace(function (o, mark, skill, modifiedInterval) { // Only allow obtaining marks if summon equipped
			// 	console.log(markButtonValue())
			// 	if (!markButtonValue())
			// 		return o(mark, skill, modifiedInterval)

			// 	let equippedModifier = 1;
			// 	// if (!this.game.combat.player.equipment.checkForItem(mark.product))
			// 	if (game.combat.player.equipment.slots.Summon1.item !== mark.product && game.combat.player.equipment.slots.Summon2.item !== mark.product)
			// 		equippedModifier = 0
			// 	return (equippedModifier * modifiedInterval) / (2000 * Math.pow(mark.tier + 1, 2));
			// })
		}
		const patchTownship = () => {
			// Township cleanup. These disable the passive gain aspects of Township.
			if (game.township._xp !== 0) game.township._xp = 0 // Remove accidnetal Township XP from first implementation
			if (game.petManager.isPetUnlocked(game.pets.getObjectByID("melvorF:B"))) game.petManager.unlocked.delete(game.pets.getObjectByID("melvorF:B")) // Remove accidnetal pets
			ctx.patch(Township, "addXP").replace(function (o, amount, masteryAction) { return }) // Make township give no XP
			ctx.patch(Township, "rollForPets").replace(function (o, interval) { return }) // Make township give no pet
		}

		patchTownship()
		patchMarkMechanics()

		if (rebalanceButtonValue())
			coRebalancePatch(rebalanceButtonValue())

		if (summoningButtonValue()) { // Can't run full coSummoningPatch() because UI elements can't be modified this early
			patchSummoningDrops(summoningButtonValue())
			patchShopItemsForSummoning(summoningButtonValue())
			patchSkill(summoningButtonValue(), 'Summoning', "Non-Combat")
			patchSummoningEquipRequirements(summoningButtonValue())
		}

		// coRepeatSlayerTaskButton(rerollEnableButtonValue())
	})

	// Load data

	// await ctx.gameData.addPackage('data/gamemode.json');
	// await ctx.gameData.addPackage('data/mini_max_capes.json');
	// await ctx.gameData.addPackage('data/resupplies.json');

	//await ctx.loadScript('completion_log.js')

	///	const itemEffectMod = await ctx.loadModule('item_effect_mod.js')

	// const idToReadable = (string) => {
	// 	return string.split(":")[1].replace(/_/g, '').match(/([A-Z]?[^A-Z]*)/g).slice(0, -1).join(" ") // First removes the namespace 'melvorTotH:' etc, then splits the string according to capital letters and rejoins them with a space inbetween.
	// }

















	// Lifecycle hooks, so this is where we actually modify the game

	// const loadModdedItems = () => {
	// 	let storedFunction = loadSaveFromString
	// 	loadSaveFromString = function (saveString) {
	// 		if (coGamemodeCheck()) {
	// 			console.log("Loading CO data packages")
	// 			game.registerDataPackage(maxCapeJSONData)
	// 			game.registerDataPackage(resupplyJSONData)
	// 			game.registerDataPackage(modifierJSONData)
	// 		}
	// 		return storedFunction(saveString);
	// 	}
	// }
	// loadModdedItems()


	// ctx.patch(Game, "decode").before(function (reader, version) {
	// 	const tempReader = new SaveWriter('Read', 1);

	// 	// Yield stuff. Spamming to get to the piece of data we need
	// 	tempReader.setDataFromSaveString(this.generateSaveString());
	// 	tempReader.getFloat64();
	// 	tempReader.getFloat64();
	// 	if (tempReader.getBoolean()) tempReader.getNamespacedObject(this.activeActions);
	// 	if (tempReader.getBoolean()) tempReader.getNamespacedObject(this.activeActions);
	// 	tempReader.getBoolean();
	// 	tempReader.getBoolean();

	// 	// The good stuff
	// 	const gamemode = tempReader.getNamespacedObject(this.gamemodes);
	// 	if (typeof gamemode === 'string')
	// 		throw new Error('Error loading save. Gamemode is not registered.');

	// 	// Load custom items, then pass back to the regular decoder to do its thing
	// 	if (coGamemodeCheck(gamemode)) {
	// 		console.warn("Loading CO data packages")
	// 		game.registerDataPackage(maxCapeJSONData)
	// 		game.registerDataPackage(resupplyJSONData)
	// 		game.registerDataPackage(modifierJSONData)

	// 		// Yield these right away to remove them from the queue
	// 		// reader.getNamespacedObject(this.gamemodes);
	// 	}

	// 	return
	// })

	// ctx.patch(Game, "decode").replace(function (o, reader, version) {
	// 	let resetPaused = false;
	// 	this.tickTimestamp = reader.getFloat64();
	// 	this.saveTimestamp = reader.getFloat64();
	// 	if (reader.getBoolean()) {
	// 		const activeAction = reader.getNamespacedObject(this.activeActions);
	// 		if (typeof activeAction !== 'string')
	// 			this.activeAction = activeAction;
	// 	}
	// 	if (reader.getBoolean()) {
	// 		const pausedAction = reader.getNamespacedObject(this.activeActions);
	// 		if (typeof pausedAction === 'string')
	// 			resetPaused = true;
	// 		else
	// 			this.pausedAction = pausedAction;
	// 	}
	// 	this._isPaused = reader.getBoolean();
	// 	this.merchantsPermitRead = reader.getBoolean();
	// 	const gamemode = reader.getNamespacedObject(this.gamemodes);
	// 	if (typeof gamemode === 'string')
	// 		throw new Error('Error loading save. Gamemode is not registered.');
	// 	this.currentGamemode = gamemode;

	// 	// Custom code here
	// 	if (coGamemodeCheck()) {
	// 		console.warn("Loading CO data packages")
	// 		this.registerDataPackage(maxCapeJSONData)
	// 		this.registerDataPackage(resupplyJSONData)
	// 		this.registerDataPackage(modifierJSONData)
	// 	}
	// 	// End custom code

	// 	this.characterName = reader.getString();
	// 	this.bank.decode(reader, version);
	// 	this.combat.decode(reader, version);
	// 	this.golbinRaid.decode(reader, version);
	// 	this.minibar.decode(reader, version);
	// 	this.petManager.decode(reader, version);
	// 	this.shop.decode(reader, version);
	// 	this.itemCharges.decode(reader, version);
	// 	this.tutorial.decode(reader, version);
	// 	this.potions.decode(reader, version);
	// 	this.stats.decode(reader, version);
	// 	this.settings.decode(reader, version);
	// 	this.gp.decode(reader, version);
	// 	this.slayerCoins.decode(reader, version);
	// 	this.raidCoins.decode(reader, version);
	// 	this.readNewsIDs = reader.getArray((reader) => reader.getString());
	// 	this.lastLoadedGameVersion = reader.getString();
	// 	nativeManager.decode(reader, version);
	// 	const numSkills = reader.getUint32();
	// 	for (let i = 0; i < numSkills; i++) {
	// 		const skill = reader.getNamespacedObject(this.skills);
	// 		const skillDataSize = reader.getUint32();
	// 		if (typeof skill === 'string')
	// 			reader.getFixedLengthBuffer(skillDataSize);
	// 		else
	// 			skill.decode(reader, version);
	// 	}
	// 	mod.decode(reader, version);
	// 	if (version >= 26)
	// 		this.completion.decode(reader, version);
	// 	if (resetPaused) {
	// 		if (!this.isGolbinRaid)
	// 			this._isPaused = false;
	// 	}
	// })


	// const patchSynergySearch = (patchFlag) => {
	// 	const nonCombatFamiliarLocations = [3, 4, 5, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22, 23]
	// 	if (patchFlag)
	// 		document.querySelector("#summoning-synergies-search-cont > synergy-search-menu > div.col-12.col-lg-6.text-right.show > div").children.forEach((x, i) => {
	// 			if (nonCombatFamiliarLocations.includes(i))
	// 				x.classList.add('d-none')
	// 		})
	// 	else
	// 		document.querySelector("#summoning-synergies-search-cont > synergy-search-menu > div.col-12.col-lg-6.text-right.show > div").children.forEach((x, i) => {
	// 			if (nonCombatFamiliarLocations.includes(i))
	// 				x.classList.remove('d-none')
	// 		})
	// }

}
