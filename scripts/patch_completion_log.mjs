export class PatchCompletionLog {

	// #region Overwrites
	OverwriteBuildSkillsLog(ctx) {
		buildSkillsLog = function (game) {
			if (!skillsLogLoaded) {
				const container = document.getElementById('skillslog-container');
				container.textContent = '';
				const combatContainer = createElement('div', { className: 'row', parent: container });
				const progressContainer = createElement('div', { className: 'col-12', parent: combatContainer });
				const noncombatContainer = createElement('div', { className: 'row mt-3', parent: container });
				buildCompletionProgress(progressContainer, completionLogMenu.skillLevelProgress, 'LOG_SKILLS_DESC');
				buildCompletionProgress(progressContainer, completionLogMenu.abyssalLevelProgress, 'TOTAL_ABYSSAL_LEVEL');
				game.skills.filter(x => x.isCombat).forEach((skill) => { // Changed this line
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
		ctx.patch(Completion, "updateSkillProgress").replace(function (o) {
			this.skillProgress.currentCount.clear();
			this.skillProgress.maximumCount.clear();
			this.skillLevelProgress.currentCount.clear();
			this.skillLevelProgress.maximumCount.clear();
			this.abyssalLevelProgress.currentCount.clear();
			this.abyssalLevelProgress.maximumCount.clear();
			this.game.skills.filter(x => x.isCombat).forEach((skill) => {
				let totalLevel = 0;
				skill.levelCompletionBreakdown.forEach(({ namespace, levels }) => {
					if (namespace === "melvorTotH" /* Namespaces.Throne */ && !cloudManager.hasTotHEntitlementAndIsEnabled)
						return;
					const current = clampValue(skill.level - totalLevel, 0, levels);
					this.skillProgress.maximumCount.add(namespace, levels);
					this.skillProgress.currentCount.add(namespace, current);
					this.skillLevelProgress.maximumCount.add(namespace, levels);
					this.skillLevelProgress.currentCount.add(namespace, current);
					totalLevel += levels;
				});
				let totalAbyssalLevel = 0;
				skill.abyssalLevelCompletionBreakdown.forEach(({ namespace, levels }) => {
					const current = clampValue(skill.abyssalLevel - totalAbyssalLevel, 0, levels);
					this.skillProgress.maximumCount.add(namespace, levels);
					this.skillProgress.currentCount.add(namespace, current);
					this.abyssalLevelProgress.maximumCount.add(namespace, levels);
					this.abyssalLevelProgress.currentCount.add(namespace, current);
					totalAbyssalLevel += levels;
				});
			});
		});
	}
	OverwriteBuildMasteryLog(ctx) {
		buildMasteryLog = function (game) {
			if (!masteryLogLoaded) {
				const container = document.getElementById('masterylog-container');
				container.textContent = '';
				const skillsContainer = createElement('div', { className: 'row', parent: container });
				const progressContainer = createElement('div', { className: 'col-12', parent: skillsContainer });
				buildCompletionProgress(progressContainer, completionLogMenu.masteryProgress, 'LOG_MASTERY_DESC');
				// TODO: Consider seperating out expansion/modded skills
				game.masterySkills.filter(x => x.isCombat).forEach((skill) => { // Changed this line
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
		ctx.patch(Completion, "updateMasteryProgress").replace(function (o) {
			this.masteryProgress.currentCount.clear();
			this.masteryProgress.maximumCount.clear();
			this.game.masterySkills.filter(x => x.isCombat).forEach((skill) => {
				if (skill.hasMastery) {
					skill.addTotalCurrentMasteryToCompletion(this.masteryProgress.currentCount);
					skill.totalMasteryActions.forEach((total, namespace) => {
						this.masteryProgress.maximumCount.add(namespace, total * skill.masteryLevelCap);
					});
				}
			});
		})
	}
	OverwriteBuildMonsterLog(IS_CO) {
		buildMonsterLog = function (game) {
			if (!monsterLogLoaded) {
				const container = document.getElementById('monsterlog-container');
				container.textContent = '';
				const createColContainer = () => {
					return createElement('div', { className: 'col-12', parent: container });
				};
				const createExpacContainer = (name) => {
					const col = createColContainer();
					col.append(createElement('h5', { className: 'mb-1 pt-3', text: name }));
					col.append(createElement('h2', {
						className: 'font-w600 mb-2 text-primary text-center',
						text: getLangString('COMPLETION_LOG_MONSTERS_0'),
					}));
					const normalMonsters = createElement('div', { className: 'row' });
					col.append(normalMonsters);
					col.append(createElement('h2', {
						className: 'font-w600 mb-2 text-primary text-center',
						text: getLangString('COMPLETION_LOG_MONSTERS_1'),
					}));
					const bossMonsters = createElement('div', { className: 'row' });
					col.append(bossMonsters);
					return { normalMonsters, bossMonsters };
				};
				const progressContainer = createColContainer();
				buildCompletionProgress(progressContainer, completionLogMenu.monsterProgress, 'LOG_MONSTERS_DESC');
				// Create Base Game Container
				const baseGameContainer = createExpacContainer(getLangString('COMPLETION_BASE_GAME'));
				const namespaceContainers = new Map();
				game.registeredNamespaces.forEach((namespace) => {
					switch (namespace.name) {
						case "melvorD" /* Namespaces.Demo */:
						case "melvorF" /* Namespaces.Full */:
							namespaceContainers.set(namespace.name, baseGameContainer);
							break;
						default: {
							if (!game.monsters.hasObjectInNamespace(namespace.name))
								break;
							const newContainer = createExpacContainer(namespace.displayName);
							namespaceContainers.set(namespace.name, newContainer);
						}
					}
				});
				game.monsters.filter(x => x[IS_CO]).forEach((monster) => { // Changed this line
					var _a, _b;
					const monsterCompletion = new MonsterCompletionElement();
					monsterCompletion.className = `monster-item${monster.isBoss ? '-boss' : ''} no-bg btn-light pointer-enabled m-1 justify-vertical-center`;
					if (monster.isBoss) {
						(_a = namespaceContainers.get(monster.namespace)) === null || _a === void 0 ? void 0 : _a.bossMonsters.append(monsterCompletion);
					}
					else {
						(_b = namespaceContainers.get(monster.namespace)) === null || _b === void 0 ? void 0 : _b.normalMonsters.append(monsterCompletion);
					}
					monsterCompletion.updateMonster(monster, game);
					completionLogMenu.monsters.set(monster, monsterCompletion);
					if (monster.ignoreCompletion)
						hideElement(monsterCompletion);
				});
				monsterLogLoaded = true;
			}
		}

	}
	// #endregion

	PatchSkills(ctx) {
		game.skills.registeredObjects = new Map([...game.skills.registeredObjects].filter(x => x[1].isCombat || x[1] instanceof Archaeology))
		game.skillTreesDisplayOrder = new NamespacedArray(game.skillTreesDisplayOrder.registery, ...game.skillTreesDisplayOrder.registery.allObjects)
		this.OverwriteBuildSkillsLog(ctx);
	}
	PatchMastery(ctx) {
		game.masterySkills.registeredObjects = new Map([...game.masterySkills.registeredObjects].filter(x => false))
		this.OverwriteBuildMasteryLog(ctx);
	}
	PatchMonsters(IS_CO, IS_RECO_FLAG) {
		if (!IS_RECO_FLAG) // Remove barrier monsters for non rebalance / summoners
			game.monsters.forEach(x => { if (x.hasBarrier) x[IS_CO] = false })
		this.OverwriteBuildMonsterLog(IS_CO, IS_RECO_FLAG);
	}

	PatchItems(IS_CO, bannedShopItemIDs) {
		const getCOItemList = (IS_CO, bannedShopItemIDs) => {
			const coRequirementChecker = (requirement, slayerLevelReq = 0) => { // Note that this isn't checking if the requirements are met, but rather whether the requirements are CO-friendly or not
				switch (requirement.type) {
					case 'SkillLevel':
						return game.skills.filter(x => x.isCombat).includes(requirement.skill) // Only CO available skills count
					case 'AllSkillLevels':
						return false // COs cannot unlock all skills
					case 'Completion':
						return true
					case 'DungeonCompletion':
						return game.dungeons.filter(x => x[IS_CO]).includes(requirement.dungeon)
					case 'StrongholdCompletion':
						return game.strongholds.filter(x => x[IS_CO]).includes(requirement.stronghold)
					case 'AbyssDepthCompletion':
						return game.abyssDepths.filter(x => x[IS_CO]).includes(requirement.depth)
					case 'SlayerItem':
						const coItems = game.items.filter(x => x[IS_CO])
						const bypassItems120 = coItems.filter(x => x?.modifiers?.some(x => x.modifier.id == "melvorD:bypassAllSlayerItems"))
						const bypassItems99 = coItems.filter(x => x?.modifiers?.some(x => x.modifier.id == "melvorD:bypassSlayerItems"))
						if (coItems.includes(requirement.item)) return true
						if (slayerLevelReq <= 120 && bypassItems120.length > 0) return true
						if (slayerLevelReq <= 99 && bypassItems99.length > 0) return true
						return false
					case 'SlayerTask':
						return true // I'm just gonna assume COs can do every slayer task tier and if I'm wrong I'll adjust this
					case 'ItemFound':
						return game.items.filter(x => x[IS_CO]).includes(requirement.item)
					case 'ShopPurchase':
						return game.shop.purchases.filter(x => x[IS_CO]).includes(requirement.purchase)
					// case 'SlayerTask':
					// 	return SlayerTask.data.filter(x => x[IS_CO]).map(x => x.id).includes(requirement.tier) // This is just for stuff like Mythical Slayer Gear
					case 'MonsterKilled':
						return game.monsters.filter(x => x[IS_CO]).includes(requirement.monster)
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
				game.combatAreas.filter(x => x.entryRequirements.length == 0).forEach(x => x[IS_CO] = true) // CombatAreas now includes *everything*
				game.combatAreas.filter(x => x.entryRequirements.length == 0).forEach(x => x.monsters.forEach(y => y[IS_CO] = true))
			}
			setCO();

			// Misc additions / removals
			const bannedItems = [].map(x => game.items.getObjectByID(x)) // Universally banned items
			const coGloves = game.shop.purchases.filter(shopItems => shopItems.contains?.itemCharges !== undefined).map(x => x.contains.itemCharges.item.id) // All gloves
			const bonusItems = ["melvorD:Signet_Ring_Half_B", ...coGloves].map(x => game.items.getObjectByID(x)) // Misc items that don't fit into other categories
			game.items.filter(x => bonusItems.includes(x)).forEach(x => x[IS_CO] = true)

			const itemCheck = () => {
				const coMonsters = game.monsters.filter(x => x[IS_CO])
				const boneDrops = coMonsters
					.filter(x => x.bones) // Remove monsters that don't drop bones
					.map(x => x.bones.item.id)
				const barrierDustDrops = coMonsters.some(x => x.hasBarrier) ? ["melvorAoD:Barrier_Dust"] : []
				const standardLoots = coMonsters
					.map(x => x.lootTable.drops.map(y => y.item.id)) // Next we get standard loots
					.reduce((accumulator, current) => accumulator.concat(current), []) // Reduce to flatten ragged array
				const delveLoots = game.combatAreas.filter(x => x[IS_CO]) // Delve = dungeons OR abyss
					.map(x => x.rewards) // Remap to rewards as that's all we care about
					.filter(x => x?.length > 0).flat() // Remove dungeons that don't reward anything
					.map(x =>
						x.dropTable // dropTable is for openable chests
							? x.dropTable.drops.map(y => y.item) // Iterate through chest items and collect ids
							: x).flat() // Other dungeon rewards that aren't chests, e.g. fire cape, infernal core, etc
					.map(x => x.id)
				const delveChests = game.combatAreas.filter(x => x[IS_CO]) // Need to add the actual chest items themselves too
					.map(x => x.rewards) // Remap to rewards as that's all we care about
					.filter(x => x?.length > 0).flat() // Remove dungeons that don't reward anything
					.map(x => x.id)
				const strongholdChests = game.strongholds.filter(x => x[IS_CO])
					.map(x => Object.values(x.tiers) // Standard / Augmented / Superior
						.map(y => y.rewards)).flat() // Grab the gem rewards
					.map(x => x.items).flat()
					.map(x => x.item.id)
				const oneTimeLoots = game.combatAreas.filter(x => x[IS_CO])
					.map(x => x.oneTimeReward)
					.filter(x => x)
					.map(x => x.id)
				const eventLoot = game.dungeons.filter(x => x[IS_CO]) // Events such as IDE
					.filter(x => x?.event)
					.map(x => x.event.itemRewards).flat()
					.map(x => x.id)
				const herbLoots = game.items.filter(x => game.farming.getHerbFromSeed(x)).filter(x => x[IS_CO]).map(x => game.farming.getHerbFromSeed(x).id)
				const allDrops = new Set([...boneDrops, ...barrierDustDrops, ...standardLoots, ...delveLoots, ...delveChests, ...strongholdChests, ...oneTimeLoots, ...eventLoot, ...herbLoots])

				game.items.filter(x => [...allDrops].includes(x.id)).forEach(x => x[IS_CO] = true) // Set all of these drops to be CO-friendly
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

				coAreas.forEach(x => x[IS_CO] = true)
				coMonsterList.forEach(x => x[IS_CO] = true)
			}

			const upgradeCheck = () => {
				const coDrops = new Set(game.items.filter(x => x[IS_CO]))
				const upgradeItems = [...game.bank.itemUpgrades].filter(([baseItem, itemUpgrade]) =>
					!(baseItem instanceof PotionItem) // Remove potion upgrades, as these require mastery
					&& itemUpgrade[0].rootItems.every(y => coDrops.has(y)) // Check if the root items for the upgrade are CO items
					&& itemUpgrade[0].itemCosts.every(y => coDrops.has(y.item)) // Check if the item upgrade costs are also CO items
				).map(([baseItem, itemUpgrade]) => itemUpgrade[0].upgradedItem)

				game.items.filter(x => upgradeItems.includes(x)).forEach(x => x[IS_CO] = true) // Set all new items to isCO
			}

			const shopCheck = () => {
				const coDrops = new Set(game.items.filter(x => x[IS_CO]).map(x => x.id))
				const shopPurchases = game.shop.purchases // These are items that show up in the shop
					.filter(x => !bannedShopItemIDs.includes(x.id)) // No banned shop items
					.filter(x => !x.category.isGolbinRaid) // No Golbin Raid items
					.filter(shopItem => shopItem.purchaseRequirements.every(req => coRequirementChecker(req))) // Check all purchase requirements, e.g. skill reqs, township reqs, etc...
					.filter(x => x.costs.items.every(y => coDrops.has(y.item.id))) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
				const shopPurchaseIDs = shopPurchases.map(x => x.id)
				const shopItems = shopPurchases // These are the actual items that go into your bank
					.map(x => x.contains.items).flat() // Map shop items to the items purchased (e.g. Standard Slayer Resupply => {Crabs, Light Runes, Sapphire Bolts, ...})
					.map(x => x.item.id)

				game.shop.purchases.filter(x => shopPurchaseIDs.includes(x.id)).forEach(x => x[IS_CO] = true) // Set all new shop items to isCO
				game.items.filter(x => shopItems.includes(x.id)).forEach(x => x[IS_CO] = true)
			}

			const chestCheck = () => {
				const coChests = game.items.filter(x => x[IS_CO]).filter(x => x instanceof OpenableItem) // Get all chests, note some chests don't come from dungeons
				const coChestsItems = coChests.map(x => x?.dropTable?.drops?.map(y => y.item)).flat() // Get all chest contents
				const chestsAndChestItems = [...coChests, ...coChestsItems]

				game.items.filter(x => chestsAndChestItems.includes(x)).forEach(x => x[IS_CO] = true) // Set all new chests and chest items to isCO
			}

			let currentLength = -1
			// This loop iteratively checks if adding a shop item, an upgrade item or a new monster etc to the running list of CO-obtainable items makes new items accessible. It runs until a check of all the new items doesn't produce new items to check.
			while (currentLength !== game.items.filter(x => x[IS_CO]).length) {
				currentLength = game.items.filter(x => x[IS_CO]).length

				shopCheck()
				upgradeCheck()
				monsterCheck()
				chestCheck()
				itemCheck()
			}

			return game.items.filter(x => x[IS_CO]).filter(x => !bannedItems.includes(x)).map(x => x.id)
		}

		const coItems = getCOItemList(IS_CO, bannedShopItemIDs);
		game.items.forEach(x => { if (!coItems.includes(x.id)) x.ignoreCompletion = true })
		// game.items.registeredObjects = new Map([...coItems].map(x => [x, game.items.getObjectByID(x)])) // This line to delete non-CO items
	}

	PatchPets(IS_CO, IS_RECO_FLAG) {
		const langHints = ["DUNGEON_NAME", "SLAYER_AREA_NAME", "STRONGHOLD_NAME", "THE_ABYSS_NAME"]
		const coPets = game.pets.allObjects.filter(x =>
			(x?.skill?.isCombat
				|| langHints.some(y => x?._langHint?.startsWith(y))
				|| x[IS_CO])
			&& x[IS_CO] !== false
		)
		if (!IS_RECO_FLAG) // Remove barrier pets for non rebalance / summoners
			game.combatAreas.forEach(x => {
				if (x.hasBarrierMonsters)
					coPets.forEach((y, index) => {
						if (x.pet?.pet?.id == y.id)
							coPets.splice(index, 1);
					})
			})
		game.pets.registeredObjects = new Map([...coPets].map(x => [x.id, x]))
	}

	PatchLog(IS_CO, IS_RECO_FLAG, bannedShopItemIDs, ctx) {
		this.PatchSkills(ctx)
		this.PatchMastery(ctx)
		this.PatchItems(IS_CO, bannedShopItemIDs)
		this.PatchMonsters(IS_CO, IS_RECO_FLAG)
		this.PatchPets(IS_CO, IS_RECO_FLAG)
	}
}