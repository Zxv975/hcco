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

// ctx.patch(Game, "createOfflineModal").after((html) => {
// 	if (!(townshipButtonValue() || coGamemodeCheck()))
// 		return html
// 	html = html.replace("<span class='text-danger'>Township Health: 100%</span>", "").replace("<h5 class='font-w600 mb-1'></h5>", "") // Remove Township health from the UI and do some cleanup on empty HTML if necessary
// 	return html
// })

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
				// return SlayerTask.data.filter(x => x.isCO).map(x => x.id).includes(requirement.tier) // This is just for stuff like Mythical Slayer Gear
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

