export class PatchCompletionLog {
	PatchSkills() {
		// completionLogMenu.skills = new Map([...completionLogMenu.skills].filter(x => x[0].isCombat))
		buildSkillsLog = function (game) {
			if (!skillsLogLoaded) {
				const container = document.getElementById('skillslog-container');
				container.textContent = '';
				const combatContainer = createElement('div', { className: 'row', parent: container });
				const progressContainer = createElement('div', { className: 'col-12', parent: combatContainer });
				const noncombatContainer = createElement('div', { className: 'row mt-3', parent: container });
				buildCompletionProgress(progressContainer, completionLogMenu.skillLevelProgress, 'LOG_SKILLS_DESC');
				buildCompletionProgress(progressContainer, completionLogMenu.abyssalLevelProgress, 'TOTAL_ABYSSAL_LEVEL');
				game.skills.filter(x => x.isCombat).forEach((skill) => {
					const skillCompletion = new SkillCompletionElement();
					skillCompletion.className = 'col-12 col-md-6 col-xl-4 mb-3';
					skillCompletion.setSkill(skill);
					if (skill.isCombat) {
						combatContainer.append(skillCompletion);
					}
					else {
						noncombatContainer.append(skillCompletion);
					}
					completionLogMenu.skills.set(skill, skillCompletion);
				});
				skillsLogLoaded = true;
			}
		}
	}
	PatchMastery() {
		buildMasteryLog = function (game) {
			if (!masteryLogLoaded) {
				const container = document.getElementById('masterylog-container');
				container.textContent = '';
				const skillsContainer = createElement('div', { className: 'row', parent: container });
				const progressContainer = createElement('div', { className: 'col-12', parent: skillsContainer });
				buildCompletionProgress(progressContainer, completionLogMenu.masteryProgress, 'LOG_MASTERY_DESC');
				// TODO: Consider seperating out expansion/modded skills
				game.masterySkills.filter(x => x.isCombat).forEach((skill) => {
					if (!skill.hasMastery)
						return;
					const masteryCompletion = new MasteryCompletionElement();
					masteryCompletion.className = 'col-12 col-md-6 col-xl-4 mb-3';
					masteryCompletion.setSkill(skill);
					completionLogMenu.masterySkills.set(skill, masteryCompletion);
					skillsContainer.append(masteryCompletion);
				});
				masteryLogLoaded = true;
			}
		}
	}
	PatchMonsters() {

	}

	PatchItems() {
		buildItemLog = function (game) {
			if (!itemLogLoaded) {
				const coItems = GetCOItemList();
				const container = document.getElementById('itemlog-container');
				$(container).html(`<div class="col-12 text-center"><span class="spinner-border text-info skill-icon-md"></span></div>`);
				window.setTimeout(() => {
					container.textContent = '';
					const optionsContainer = createElement('div', { className: 'row', parent: container });
					const progressContainer = createElement('div', { className: 'col-12 col-lg-6', parent: optionsContainer });
					buildCompletionProgress(progressContainer, completionLogMenu.itemProgress, 'LOG_ITEMS_DESC');
					$(optionsContainer).append(`
<div class="col-12 col-md-6">
  <div class="form-group col-12 mb-0">
    <div class="input-group">
      <input type="text" class="form-control text-danger" id="searchTextbox-items" name="searchTextbox-items" placeholder="${getLangString('SEARCH')}">
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
  ${cloudManager.hasExpansionEntitlementAndIsEnabled
							? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(3);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_3')}</button>`
							: ''}
  ${cloudManager.hasTotHEntitlementAndIsEnabled
							? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(4);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_4')}</button>`
							: ''}
  ${cloudManager.hasAoDEntitlementAndIsEnabled
							? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(5);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_AOD')}</button>`
							: ''}
  ${cloudManager.hasItAEntitlementAndIsEnabled
							? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(6);">${getLangString('COMPLETION_LOG_ITEMS_FILTER_ITA')}</button>`
							: ''}
</div>`);
					const baseGameContainer = createElement('div', { className: 'row', parent: container });
					if (cloudManager.hasExpansionEntitlementAndIsEnabled) {
						baseGameContainer;
						baseGameContainer.append(createElement('div', {
							className: 'col-12',
							children: [createElement('h5', { className: 'mb-1 pt-3', text: getLangString('COMPLETION_BASE_GAME') })],
						}));
					}
					completionLogMenu.itemContainers.set("melvorBaseGame" /* Namespaces.BaseGame */, baseGameContainer);
					const namespaceContainers = new Map();
					game.registeredNamespaces.forEach((namespace) => {
						switch (namespace.name) {
							case "melvorD" /* Namespaces.Demo */:
							case "melvorF" /* Namespaces.Full */:
								namespaceContainers.set(namespace.name, baseGameContainer);
								break;
							default: {
								if (!coItems.hasObjectInNamespace(namespace.name))
									break;
								const newContainer = createElement('div', { className: 'row', parent: container });
								newContainer.append(createElement('div', {
									className: 'col-12',
									children: [createElement('h5', { className: 'mb-1 pt-3', text: namespace.displayName })],
								}));
								completionLogMenu.itemContainers.set(namespace.name, newContainer);
								namespaceContainers.set(namespace.name, newContainer);
							}
						}
					});
					coItems.forEach((item) => {
						var _a;
						const itemCompletion = new ItemCompletionElement();
						itemCompletion.className = 'bank-item no-bg btn-light pointer-enabled m-1 resize-48';
						(_a = namespaceContainers.get(item.namespace)) === null || _a === void 0 ? void 0 : _a.append(itemCompletion);
						itemCompletion.updateItem(item, game);
						if (item.ignoreCompletion)
							hideElement(itemCompletion);
						completionLogMenu.items.set(item, itemCompletion);
					});
					game.completion.updateItem(coItems.firstObject); // Trigger UI update
					$('#searchTextbox-items').click(function (e) {
						updateItemLogSearchArray(game);
					});
					$('#searchTextbox-items').keyup(function () {
						const search = $('#searchTextbox-items').val();
						updateItemLogSearch(search);
					});
				}, 1000);
				itemLogLoaded = true;
			}
		}
	}

	PatchPets() {
		const langHints = ["DUNGEON_NAME", "SLAYER_AREA_NAME", "STRONGHOLD_NAME", "THE_ABYSS_NAME"]
		const coPets = game.pets.allObjects.filter(x => x?.skill?.isCombat || langHints.some(y => x?._langHint?.startsWith(y)))

		buildPetLog = function (game) {
			if (!petLogLoaded) {
				const container = document.getElementById('petlog-container');
				container.textContent = '';
				const baseGameContainer = createElement('div', { className: 'row', parent: container });
				const progressContainer = createElement('div', { className: 'col-12', parent: baseGameContainer });
				buildCompletionProgress(progressContainer, completionLogMenu.petProgress, 'LOG_PETS_DESC');
				const namespaceContainers = new Map();
				game.registeredNamespaces.forEach((namespace) => {
					switch (namespace.name) {
						case "melvorD" /* Namespaces.Demo */:
						case "melvorF" /* Namespaces.Full */:
							namespaceContainers.set(namespace.name, baseGameContainer);
							break;
						default: {
							if (!game.pets.hasObjectInNamespace(namespace.name))
								break;
							const newContainer = createElement('div', { className: 'row', parent: container });
							newContainer.append(createElement('div', {
								className: 'col-12',
								children: [createElement('h5', { className: 'mb-1 pt-3', text: namespace.displayName })],
							}));
							namespaceContainers.set(namespace.name, newContainer);
						}
					}
				});
				coPets.forEach((pet) => {
					var _a;
					const petCompletion = new PetCompletionElement();
					petCompletion.className =
						'monster-item no-bg btn-light pointer-enabled m-1 justify-vertical-center pet-log-img-0';
					(_a = namespaceContainers.get(pet.namespace)) === null || _a === void 0 ? void 0 : _a.append(petCompletion);
					petCompletion.updatePet(pet, game);
					completionLogMenu.pets.set(pet, petCompletion);
				});
				petLogLoaded = true;
			}
		}
	}


	GetCOItemList = () => {
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
				case 'StrongholdCompletion':
					return game.strongholds.filter(x => x.isCO).includes(requirement.stronghold)
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
				// case 'SlayerTask':
				// 	return SlayerTask.data.filter(x => x.isCO).map(x => x.id).includes(requirement.tier) // This is just for stuff like Mythical Slayer Gear
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
		const bannedShopPurchases = ["melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire", "melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control", "melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar"].map(x => game.shop.purchases.getObjectByID(x))
		const bannedItems = [].map(x => game.items.getObjectByID(x)) // Universally banned items
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
			const allDrops = [...boneDrops, ...standardLoots, ...dungeonLoots, ...dungeonChests, ...eventLoot, ...herbLoots]

			game.items.filter(x => allDrops.includes(x)).forEach(x => x.isCO = true) // Set all of these drops to be CO-friendly
		}

		const monsterCheck = () => {
			// Random exceptions that behave weirdly / uniquely
			const bannedAreas = ["melvorD:UnknownArea"].map(x => game.combatAreas.getObjectByID(x))
			const includedMonsters = ["melvorF:Bane", "melvorF:WanderingBard", ...game.combat.spiderLairMonsters.map(x => x.id)].map(x => game.monsters.getObjectByID(x))
			const bannedMonsters = ["melvorTotH:RandomSpiderLair"].map(x => game.monsters.getObjectByID(x))

			const areaList = [...game.combatAreas.allObjects, ...game.slayerAreas.allObjects, ...game.dungeons.allObjects, ...game.strongholds.allObjects].filter(x => !bannedAreas.includes(x))

			var coAreas = areaList.filter(area => area.entryRequirements.every(req => {
				if (req.type === 'SlayerItem') return coRequirementChecker(req, area.entryRequirements.filter(x => x.type === "SkillLevel")[0].level) // Also pass the area's level requirement along with the slayer item. This is for 99 slayer cape vs 120 slayer cape checking
				else return coRequirementChecker(req)
			}))

			const coMonsterList = new Set([...coAreas.map(area => area.monsters).flat(), ...includedMonsters].filter(x => !bannedMonsters.includes(x)))

			coAreas.forEach(x => x.isCO = true)
			coMonsterList.forEach(x => x.isCO = true)
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

		return game.items.filter(x => x.isCO).filter(x => !bannedItems.includes(x)).map(x => x.id)
	}


	PatchLog() {
		this.PatchSkills()
		this.PatchMastery()
		this.PatchMonsters()
		this.PatchItems()
		this.PatchPets()
	}
}