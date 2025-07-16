export class PatchCompletionLog {
	PatchSkills() {
		game.skills.registeredObjects = new Map([...game.skills.registeredObjects].filter(x => x[1].isCombat))
	}
	PatchMastery() {
		game.masterySkills.registeredObjects = new Map([...game.masterySkills.registeredObjects].filter(x => false))
	}
	PatchMonsters() {
		// TODO patch unavailable monsters for non-Rebalance
	}

	PatchItems(IS_CO_FLAG, bannedShopItemIDs) {
		const getCOItemList = (IS_CO_FLAG, bannedShopItemIDs) => {
			const coRequirementChecker = (requirement, slayerLevelReq = 0) => { // Note that this isn't checking if the requirements are met, but rather whether the requirements are CO-friendly or not
				switch (requirement.type) {
					case 'SkillLevel':
						return game.skills.filter(x => x.isCombat).includes(requirement.skill) // Only CO available skills count
					case 'AllSkillLevels':
						return false // COs cannot unlock all skills
					case 'Completion':
						return true 
					case 'DungeonCompletion':
						return game.dungeons.filter(x => x[IS_CO_FLAG]).includes(requirement.dungeon)
					case 'StrongholdCompletion':
						return game.strongholds.filter(x => x[IS_CO_FLAG]).includes(requirement.stronghold)
					case 'AbyssDepthCompletion':
						return game.abyssDepths.filter(x => x[IS_CO_FLAG]).includes(requirement.depth)
					case 'SlayerItem':
						const coItems = game.items.filter(x => x[IS_CO_FLAG])
						const bypassItems120 = coItems.filter(x => x?.modifiers?.some(x => x.modifier.id == "melvorD:bypassAllSlayerItems"))
						const bypassItems99 = coItems.filter(x => x?.modifiers?.some(x => x.modifier.id == "melvorD:bypassSlayerItems"))
						if (coItems.includes(requirement.item)) return true
						if (slayerLevelReq <= 120 && bypassItems120.length > 0) return true
						if (slayerLevelReq <= 99 && bypassItems99.length > 0) return true
						return false
					case 'SlayerTask':
						return true // I'm just gonna assume COs can do every slayer task tier and if I'm wrong I'll adjust this
					case 'ItemFound':
						return game.items.filter(x => x[IS_CO_FLAG]).includes(requirement.item)
					case 'ShopPurchase':
						return game.shop.purchases.filter(x => x[IS_CO_FLAG]).includes(requirement.purchase)
					// case 'SlayerTask':
					// 	return SlayerTask.data.filter(x => x[IS_CO_FLAG]).map(x => x.id).includes(requirement.tier) // This is just for stuff like Mythical Slayer Gear
					case 'MonsterKilled':
						return game.monsters.filter(x => x[IS_CO_FLAG]).includes(requirement.monster)
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
			const setCO = () => {
				game.combatAreas.filter(x => x.entryRequirements.length == 0).forEach(x => x[IS_CO_FLAG] = true) // CombatAreas now includes *everything*
				game.combatAreas.filter(x => x.entryRequirements.length == 0).forEach(x => x.monsters.forEach(y => y[IS_CO_FLAG] = true))
			}
			setCO();

			// Misc additions / removals
			const bannedItems = [].map(x => game.items.getObjectByID(x)) // Universally banned items
			const coGloves = game.shop.purchases.filter(shopItems => shopItems.contains?.itemCharges !== undefined).map(x => x.contains.itemCharges.item.id) // All gloves
			const bonusItems = ["melvorD:Signet_Ring_Half_B", ...coGloves].map(x => game.items.getObjectByID(x)) // Misc items that don't fit into other categories
			game.items.filter(x => bonusItems.includes(x)).forEach(x => x[IS_CO_FLAG] = true)

			const itemCheck = () => {
				const coMonsters = game.monsters.filter(x => x[IS_CO_FLAG])
				const boneDrops = coMonsters
					.filter(x => x.bones !== undefined) // Remove monsters that don't drop bones
					.map(x => x.bones.item.id)
				const standardLoots = coMonsters
					.map(x => x.lootTable.drops.map(y => y.item.id)) // Next we get standard loots
					.reduce((accumulator, current) => accumulator.concat(current), []) // Reduce to flatten ragged array
				const delveLoots = game.combatAreas.filter(x => x[IS_CO_FLAG]) // Delve = dungeons OR strongholds OR abyss
					.map(x => x.rewards) // Remap to rewards as that's all we care about
					.filter(x => x?.length > 0).flat() // Remove dungeons that don't reward anything
					.map(x =>
						x.dropTable // dropTable is for openable chests
							? x.dropTable.drops.map(y => y.item) // Iterate through chest items and collect ids
							: x).flat() // Other dungeon rewards that aren't chests, e.g. fire cape, infernal core, etc
					.map(x => x.id)
				const delveChests = game.combatAreas.filter(x => x[IS_CO_FLAG]) // Need to add the actual chest items themselves too
					.map(x => x.rewards) // Remap to rewards as that's all we care about
					.filter(x => x?.length > 0).flat() // Remove dungeons that don't reward anything
					.map(x => x.id)
				const oneTimeLoots = game.combatAreas.filter(x => x[IS_CO_FLAG])
					.map(x => x.oneTimeReward)
					.filter(x => x)
					.map(x => x.id)
				const eventLoot = game.dungeons.filter(x => x[IS_CO_FLAG]) // Events such as IDE
					.filter(x => x?.event)
					.map(x => x.event.itemRewards).flat()
					.map(x => x.id)
				const herbLoots = game.items.filter(x => game.farming.getHerbFromSeed(x)).filter(x => x[IS_CO_FLAG]).map(x => game.farming.getHerbFromSeed(x).id)
				const allDrops = new Set([...boneDrops, ...standardLoots, ...delveLoots, ...delveChests, ...oneTimeLoots, ...eventLoot, ...herbLoots])

				game.items.filter(x => [...allDrops].includes(x.id)).forEach(x => x[IS_CO_FLAG] = true) // Set all of these drops to be CO-friendly
			}

			const monsterCheck = () => {
				// Random exceptions that behave weirdly / uniquely
				const bannedAreas = ["melvorD:UnknownArea"].map(x => game.combatAreas.getObjectByID(x))
				const includedMonsters = ["melvorF:Bane", "melvorF:WanderingBard", ...game.combat.spiderLairMonsters.map(x => x.id)].map(x => game.monsters.getObjectByID(x))
				const bannedMonsters = ["melvorTotH:RandomSpiderLair"].map(x => game.monsters.getObjectByID(x))

				const areaList = [...game.combatAreas.allObjects, ...game.slayerAreas.allObjects, ...game.dungeons.allObjects, ...game.strongholds.allObjects].filter(x => !bannedAreas.includes(x))

				var coAreas = areaList.filter(area => area.entryRequirements.every(req => {
					if (req.type === 'SlayerItem')
						return coRequirementChecker(req, area.entryRequirements.filter(x => x.type === "SkillLevel")[0].level) // Also pass the area's level requirement along with the slayer item. This is for 99 slayer cape vs 120 slayer cape checking
					else
						return coRequirementChecker(req)
				}))

				const coMonsterList = new Set([...coAreas.map(area => area.monsters).flat(), ...includedMonsters].filter(x => !bannedMonsters.includes(x)))

				coAreas.forEach(x => x[IS_CO_FLAG] = true)
				coMonsterList.forEach(x => x[IS_CO_FLAG] = true)
			}

			const upgradeCheck = () => {
				const coDrops = new Set(game.items.filter(x => x[IS_CO_FLAG]))
				const upgradeItems = [...game.bank.itemUpgrades].filter(([baseItem, itemUpgrade]) =>
					!(baseItem instanceof PotionItem) // Remove potion upgrades, as these require mastery
					&& itemUpgrade[0].rootItems.every(y => coDrops.has(y)) // Check if the root items for the upgrade are CO items
					&& itemUpgrade[0].itemCosts.every(y => coDrops.has(y.item)) // Check if the item upgrade costs are also CO items
				).map(([baseItem, itemUpgrade]) => itemUpgrade[0].upgradedItem)

				game.items.filter(x => upgradeItems.includes(x)).forEach(x => x[IS_CO_FLAG] = true) // Set all new items to isCO
			}

			const shopCheck = () => {
				const coDrops = new Set(game.items.filter(x => x[IS_CO_FLAG]).map(x => x.id))
				const shopPurchases = game.shop.purchases // These are items that show up in the shop
					.filter(x => !bannedShopItemIDs.includes(x.id)) // No banned shop items
					.filter(x => !x.category.isGolbinRaid) // No Golbin Raid items
					.filter(shopItem => shopItem.purchaseRequirements.every(req => coRequirementChecker(req))) // Check all purchase requirements, e.g. skill reqs, township reqs, etc...
					.filter(x => x.costs.items.every(y => coDrops.has(y.item.id))) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
				const shopPurchaseIDs = shopPurchases.map(x => x.id)
				const shopItems = shopPurchases // These are the actual items that go into your bank
					.map(x => x.contains.items).flat() // Map shop items to the items purchased (e.g. Standard Slayer Resupply => {Crabs, Light Runes, Sapphire Bolts, ...})
					.map(x => x.item.id)

				game.shop.purchases.filter(x => shopPurchaseIDs.includes(x.id)).forEach(x => x[IS_CO_FLAG] = true) // Set all new shop items to isCO
				game.items.filter(x => shopItems.includes(x.id)).forEach(x => x[IS_CO_FLAG] = true)
			}

			const chestCheck = () => {
				const coChests = game.items.filter(x => x[IS_CO_FLAG]).filter(x => x instanceof OpenableItem) // Get all chests, note some chests don't come from dungeons
				const coChestsItems = coChests.map(x => x?.dropTable?.drops?.map(y => y.item)).flat() // Get all chest contents
				const chestsAndChestItems = [...coChests, ...coChestsItems]

				game.items.filter(x => chestsAndChestItems.includes(x)).forEach(x => x[IS_CO_FLAG] = true) // Set all new chests and chest items to isCO
			}

			let currentLength = -1
			// This loop iteratively checks if adding a shop item, an upgrade item or a new monster etc to the running list of CO-obtainable items makes new items accessible. It runs until a check of all the new items doesn't produce new items to check.
			while (currentLength !== game.items.filter(x => x[IS_CO_FLAG]).length) {
				currentLength = game.items.filter(x => x[IS_CO_FLAG]).length

				shopCheck()
				upgradeCheck()
				monsterCheck()
				chestCheck()
				itemCheck()
			}

			return game.items.filter(x => x[IS_CO_FLAG]).filter(x => !bannedItems.includes(x)).map(x => x.id)
		}

		const coItems = getCOItemList(IS_CO_FLAG, bannedShopItemIDs);
		game.items.registeredObjects = new Map([...coItems].map(x => [x, game.items.getObjectByID(x)]))
	}

	PatchPets() {
		const langHints = ["DUNGEON_NAME", "SLAYER_AREA_NAME", "STRONGHOLD_NAME", "THE_ABYSS_NAME"]
		const coPets = game.pets.allObjects.filter(x => x?.skill?.isCombat || langHints.some(y => x?._langHint?.startsWith(y)))
		game.pets.registeredObjects = new Map([...coPets].map(x => [x.id, x]))
	}

	PatchLog(IS_CO_FLAG, bannedShopItemIDs) {
		this.PatchSkills()
		this.PatchMastery()
		this.PatchItems(IS_CO_FLAG, bannedShopItemIDs)
		this.PatchMonsters()
		this.PatchPets()
	}
}