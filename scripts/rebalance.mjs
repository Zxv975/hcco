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
	game.hitpoints._level = Math.min(game.hitpoints.level, game.hitpoints.maxLevelCap)
	// game.combat.player.computeAllStats() // #Reenable this after fixing ITA
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

