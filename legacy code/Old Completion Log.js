
	## Completion Log
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
		const bannedShopPurchases = ["melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire", "melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control", "melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar"]
		game.shop.purchases.forEach(x => x.isCO = false)
		let shopItems = game.shop.purchases
			.filter(x => !bannedShopPurchases.includes(x.id))
			.filter(x => !x.category.isGolbinRaid).filter(x => !x.purchaseRequirements.some(y => y.type == 'TownshipBuilding'))
			.filter(shopItem =>
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
				shopItemsList = shopItems.filter(x =>
					x.costs.items.every(y =>
						coDrops.has(y.item.id) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
					)
				)
				shopItemsList.forEach(x => x.isCO = true)
				coDrops = new Set([...coDrops, ...shopItemsList.map(x => x.contains.items).flat().map(x => x.item.id)])
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



	const getCOItemList = () => {
		game.monsters.forEach(x => x.isCO = false)

		game.combatAreas.forEach(x => x.monsters.forEach(y => y.isCO = true))
		game.slayerAreas.filter(x => x.id !== "melvorTotH:FoggyLake").forEach(x => x.monsters.forEach(y => y.isCO = true))
		game.dungeons.forEach(x => x.monsters.forEach(y => y.isCO = true))

		// Get standard drops first
		let coDrops = new Set( // Using a set to elimnate duplicates
			[...game.monsters.filter(x => x.isCO)
				.filter(x => x.bones != undefined) // Remove monsters that don't drop bones
				.map(x => x.bones.item.id),
			...game.monsters.filter(x => x.isCO)
				.map(x => x.lootTable.drops.map(y => y.item.id)) // Next we get standard loots
				.reduce((accumulator, current) => accumulator.concat(current)), // Reduce to flatten ragged array
			...game.dungeons.filter(x => x.isCO)
				.map(x => x.rewards)// Remap to rewards as that's all we care about
				.filter(x => x.length > 0) // Remove dungeons that don't reward anything
				.flat()
				.map(x =>
					x.dropTable != undefined ? // dropTable is for openable chests
						x.dropTable.drops.map(y => y.item.id) : // Iterate through chest items and collect ids
						x.id // Other dungeon rewards that aren't chests, e.g. fire cape, infernal core, etc
				).flat(),
			...game.items.filter(x => x.type == "Herb").map(x => x.id) // Add all herbs as they can be obtained from Lucky Herb potion from Rancora
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
		const bannedShopPurchases = ["melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire", "melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control", "melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar"]
		game.shop.purchases.forEach(x => x.isCO = false)
		let shopItems = game.shop.purchases
			.filter(x => !bannedShopPurchases.includes(x.id))
			.filter(x => !x.category.isGolbinRaid).filter(x => !x.purchaseRequirements.some(y => y.type == 'TownshipBuilding'))
			.filter(shopItem =>
				shopItem.purchaseRequirements.length == 0 || // If no purchase requirements then include it
				shopItem.purchaseRequirements.every(reqs =>
					!bannedSkills.includes(reqs?.skill?.id) && reqs?.type != 'AllSkillLevels' && reqs?.type != 'Completion'
				)
			)


		// Remove shop items that cannot be purchased as a CO
		const shopCheck = (coDrops) => {
			let currentLength = -1
			while (currentLength !== coDrops.size) { // Loop to make sure there aren't shop items that require other shop items to purchase
				currentLength = coDrops.size
				let shopItemsList = shopItems.filter(x =>
					x.costs.items.every(y =>
						coDrops.has(y.item.id) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
					)
				)
				shopItemsList.forEach(x => x.isCO = true)
				coDrops = new Set([...coDrops, ...shopItemsList.map(x => x.contains.items).flat().map(x => x.item.id)])
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



	const getCOItemList = () => {
		const coRequirementChecker = (requirement) => { // Note that this isn't checking if the requirements are met, but rather whether the requirements are CO-friendly or not
			switch (requirement.type) {
				case 'SkillLevel':
					return game.skills.filter(x => !x.isCombat).includes(requirement.skill.id) // Only CO available skills count
				case 'AllSkillLevels':
					return false // COs cannot unlock all skills
				case 'Completion':
					return false // COs cannot get full completion
				case 'DungeonCompletion':
					return game.dungeons.filter(x => x.isCO).includes(requirement.dungeon)
				case 'SlayerItem':
					return game.items.filter(x => x.isCO).includes(requirement.item)
				case 'ItemFound':
					return game.items.filter(x => x.isCO).includes(requirement.item)
				case 'ShopPurchase':
					return game.shop.purchases.filter(x => x.isCO).includes(requirement.purchase)
				case 'SlayerTask':
					return SlayerTask.data.filter(x => x.isCO).includes(requirement.tier) // This is just for stuff like Mythical Slayer Gear
				case 'MonsterKilled':
					return game.monsters.filter(x => x.isCO).includes(requirement.monster)
				// CO do not have Township so auto-fail these
				case 'TownshipTask':
					return false
				case 'TownshipTutorialTask':
					return false
				case 'TownshipBuilding':
					return false
			}
		}
		// Reset all: shop purchases, monsters, areas, dungeons, items, upgrades, slayer tasks
		const reset = () => {
			game.shop.purchases.forEach(x => x.isCO = false)
			game.monsters.forEach(x => x.isCO = false)
			game.dungeons.forEach(x => x.isCO = false)
			game.items.forEach(x => x.isCO = false)
			game.bank.itemUpgrades.forEach((baseItem, upgradeItem) => upgradeItem.isCO = false)
			SlayerTask.data.forEach((taskTier, tierID) => { taskTier.id = tierID; taskTier.isCO = false }) // Make each slayer tier aware of its own tier ID
		}

		reset()

		// Monsters with no requirements are always accessible
		game.combatAreas.filter(x => Array.isArray(x.entryRequirements)).forEach(x => x.monsters.forEach(y => y.isCO = true))
		game.slayerAreas.filter(x => Array.isArray(x.entryRequirements)).forEach(x => x.monsters.forEach(y => y.isCO = true))
		game.dungeons.filter(x => Array.isArray(x.entryRequirements)).forEach(x => x.monsters.forEach(y => y.isCO = true))


		// Misc additions / removals
		const bannedShopPurchases = ["melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire", "melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control", "melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar"]
		const bannedItems = ["mini_max_cape:Combat_Superior_Max_Skillcape", "mini_max_cape:Combat_Max_Skillcape"] // Universally banned items
		const coGloves = game.shop.purchases.filter(shopItems => shopItems.contains?.itemCharges != undefined).map(x => x.contains.itemCharges.item.id) // All gloves
		const bonusItems = ["melvorD:Signet_Ring_Half_B", ...coGloves] // Misc items that don't fit into other categories
		game.items.filter(x => bonusItems.includes(x.id)).forEach(x => x.isCO = true)

		const itemCheck = () => {
			const coMonsters = game.monsters.filter(x => x.isCO)
			const boneDrops = coMonsters
				.filter(x => x.bones !== undefined) // Remove monsters that don't drop bones
				.map(x => x.bones.item.id)
			const standardLoots = coMonsters
				.map(x => x.lootTable.drops.map(y => y.item.id)) // Next we get standard loots
				.reduce((accumulator, current) => accumulator.concat(current), []) // Reduce to flatten ragged array
			const dungeonLoots = game.dungeons.filter(x => x.isCO)
				.map(x => x.rewards) // Remap to rewards as that's all we care about
				.filter(x => x.length > 0) // Remove dungeons that don't reward anything
				.flat()
				.map(x =>
					x.dropTable !== undefined ? // dropTable is for openable chests
						x.dropTable.drops.map(y => y.item.id) : // Iterate through chest items and collect ids
						x.id // Other dungeon rewards that aren't chests, e.g. fire cape, infernal core, etc
				).flat()
			const herbLoots = game.items.filter(x => game.farming.getHerbFromSeed(x)).filter(x => x.isCO).map(x => game.farming.getHerbFromSeed(x).id)
			const allDrops = [...boneDrops, ...standardLoots, ...dungeonLoots, ...herbLoots]

			game.items.filter(x => allDrops.includes(x.id)).forEach(x => x.isCO = true) // Set all of these drops to be CO-friendly
		}

		const monsterCheck = () => {
			const bannedAreas = ["melvorD:UnknownArea"]
			const includedMonsters = ["melvorF:WanderingBard", ...game.combat.spiderLairMonsters.map(x => x.id)].map(x => game.monsters.getObjectByID(x))
			const bannedMonsters = ["melvorTotH:RandomSpiderLair"]

			const areaList = [...game.combatAreas.allObjects, ...game.slayerAreas.allObjects, ...game.dungeons.allObjects].filter(x => !bannedAreas.includes(x.id))

			const coAreas = areaList.filter(area => {
				if (!Array.isArray(area.entryRequirements)) return true
				return area.entryRequirements.every(req => coRequirementChecker(req))
			})

			const coMonsterList = new Set([...areaList.map(area => area.monsters).flat(), ...includedMonsters].filter(x => !bannedMonsters.includes(x.id)))
			const coSlayerTaskList = new Set([...coMonsterList].filter(x => x.canSlayer).map(monster => SlayerTask.data.filter(tier => tier.minLevel <= monster.combatLevel && monster.combatLevel < tier.maxLevel))[0])

			coAreas.forEach(x => x.isCO = true)
			coMonsterList.forEach(x => x.isCO = true)

			coSlayerTaskList.forEach(tier => {
				SlayerTask.data[tier.id].isCO = true
			})
		}

		const upgradeCheck = () => {
			const coDrops = new Set(game.items.filter(x => x.isCO).map(x => x.id))
			const upgradeItems = [...game.bank.itemUpgrades].filter(([baseItem, itemUpgrade]) =>
				!(baseItem instanceof PotionItem) && // Remove potion upgrades, as these require mastery
				itemUpgrade[0].rootItems.every(y => coDrops.has(y.id)) && // Check if the root items for the upgrade are CO items
				itemUpgrade[0].itemCosts.every(y => coDrops.has(y.item.id)) // Check if the item upgrade costs are also CO items
			).map(([baseItem, itemUpgrade]) => itemUpgrade[0].upgradedItem.id)

			game.items.filter(x => upgradeItems.includes(x.id)).forEach(x => x.isCO = true) // Set all new items to isCO
		}


		const shopCheck = () => {
			const coDrops = new Set(game.items.filter(x => x.isCO).map(x => x.id))

			const shopPurchases = game.shop.purchases // These are items that show up in the shop
				.filter(x => !bannedShopPurchases.includes(x.id)) // No banned shop items
				.filter(x => !x.category.isGolbinRaid) // No Golbin Raid items
				.filter(shopItem => shopItem.purchaseRequirements.every(reqs => coRequirementChecker(reqs))) // Check all purchase requirements, e.g. skill reqs, township reqs, etc...
				.filter(x => x.costs.items.every(y => coDrops.has(y.item.id))) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
			const shopItems = shopPurchases // These are the actual items that go into your bank
				.map(x => x.contains.items).flat() // Map shop items to the items purchased (e.g. Standard Slayer Resupply => {Crabs, Light Runes, Sapphire Bolts, ...})
				.map(x => x.item.id) // Keep only item IDs


			game.shop.purchases.filter(x => shopItems.includes(x.id)).forEach(x => x.isCO = true) // Set all new shop items to isCO
			game.items.filter(x => shopItems.includes(x.id)).forEach(x => x.isCO = true)
		}

		const chestCheck = () => {
			const coChests = game.items.filter(x => x.isCO).filter(x => x instanceof OpenableItem) // Get all chests, note some chests don't come from dungeons
			const coChestsItems = coChests.map(x => x?.dropTable?.drops?.map(y => y.item.id)) // Get all chest contents
			const chestsAndChestItems = [...coChests, ...coChestsItems]

			game.items.filter(x => chestsAndChestItems.includes(x.id)).forEach(x => x.isCO = true) // Set all new chests and chest items to isCO
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
		}

		return game.items.filter(x => x.isCO).map(x => x.id).filter(x => !bannedItems.includes(x))
	}