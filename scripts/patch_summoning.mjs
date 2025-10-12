

export class PatchSummoning {
	// #region HTML_changes
	RemoveNonCombatRecipes = () => {
		game.summoning.synergies = game.summoning.synergies.filter(x => x.summons.every(y => y.skills.every(z => z.isCombat)))
		game.summoning.recipesBySkillAndRealm = new Map([...game.summoning.recipesBySkillAndRealm].filter(([skill, realmMap]) => skill.isCombat))
		game.summoning.recipesByProduct = new Map([...game.summoning.recipesByProduct].filter(([item, recipe]) => recipe.skills.every(y => y.isCombat)))

		game.summoning.milestones = game.summoning.milestones.filter(x => x.skills?.every(y => y.isCombat)) // Not sure if needed. The nullity check is because there was a null value being returned which was crashing otherwise
		game.summoning.abyssalMilestones = game.summoning.abyssalMilestones.filter(x => x.skills?.every(y => y.isCombat))

		game.summoning.categories.registeredObjects = new Map([...game.summoning.categories.registeredObjects].filter(([categoryID, summoningCategory]) => categoryID != "melvorD:TabletsFamiliars" && categoryID != "melvorItA:AbyssalTabletsFamiliars"))
		game.summoning.actions.registeredObjects = new Map([...game.summoning.actions.registeredObjects].filter(([markID, recipe]) => recipe.skills.every(y => y.isCombat)))
		game.summoning.sortedMasteryActions = game.summoning.sortedMasteryActions.filter(x => x.skills.every(y => y.isCombat))
	}

	SummoningHTMLModifications = (ctx) => {
		document.querySelectorAll(`[lang-id=MENU_TEXT_CREATE_FAMILIAR]`).forEach(x => x?.parentElement?.parentElement?.classList?.add('d-none')) // Hide all "create tablet" elements on each of the summoning marks
		document.querySelector("#summoning-mark-menu > div > div > div:nth-child(2)")?.classList?.add('d-none')
		document.querySelector("#summoning-mark-menu > div > div > div:nth-child(3)")?.classList?.add('d-none')

		ctx.patch(SummoningMarkDiscoveryElement, "setDiscovered").replace(function (o, mark) {
			const markLevel = game.summoning.getMarkLevel(mark);
			this.status.className = 'text-warning';
			this.status.textContent = templateLangString('MENU_TEXT_MARK_LEVEL', { level: `${markLevel}` });
			this.setName(mark.product.name);
			this.image.src = mark.markMedia;
			this.setSkillImages(mark.skills);
			this.updateDiscoveryCount(mark);
			showElement(this.discoveredContent);
			hideElement(this.levelRequired);
			hideElement(this.abyssalLevelRequired);
			// showElement(this.quickCreateButton);
			// this.quickCreateButton.onclick = () => {
			// 	switchSummoningCategory(mark.category);
			// 	game.summoning.selectRecipeOnClick(mark);
			// };

			this.levelRequired.textContent = '';
			const maxText = `[Tier: ${mark.tier} | Max: ${Summoning.markLevels[mark.maxMarkLevel - 1] * mark.tier}]`
			this.levelRequired.textContent = maxText;
			this.abyssalLevelRequired.textContent = maxText;
		})

		// ctx.patch(SummoningMarkDiscoveryElement, "setUndiscovered").replace(function (o, mark) {
		// 	const markLevel = game.summoning.getMarkLevel(mark);
		// 	this.status.className = 'text-warning';
		// 	this.status.textContent = getLangString('MENU_TEXT_NOT_DISCOVERED');
		// 	// this.setName(getLangString('MENU_TEXT_QUESTION_MARKS'));			
		// 	this.status.textContent = templateLangString('MENU_TEXT_MARK_LEVEL', { level: `${markLevel}` });
		// 	this.image.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */);
		// 	this.setSkillImages(mark.skills);
		// 	this.updateDiscoveryCount(mark);
		// 	showElement(this.discoveredContent);
		// 	hideElement(this.levelRequired);
		// 	hideElement(this.abyssalLevelRequired);
		// 	hideElement(this.quickCreateButton);
		// 	this.quickCreateButton.onclick = null;

		// 	this.levelRequired.textContent = '';
		// 	const maxText = `[Tier: ${mark.tier} | Max: ${Summoning.markLevels[mark.maxMarkLevel - 1] * mark.tier}]`
		// 	this.levelRequired.textContent = maxText;
		// 	this.abyssalLevelRequired.textContent = maxText;
		// })

		ctx.patch(Summoning, "resetToDefaultSelectedRecipeBasedOnRealm").replace(function (o, mark) { })
	}

	// #endregion HTML_changes

	// #region Marks
	MakeSummoningMarksDeterministic = ctx => {
		Object.defineProperty(Summoning, 'markLevels', { get: () => { return [1, 1000, 3000, 6000, 9000, 12000, 25000] } });
		ctx.patch(Summoning, "getMarkLevel").replace(function (o, mark) {
			const count = this.getMarkCount(mark);
			// const index = Summoning.markLevels.findIndex((countRequired) => count < countRequired * mark.tier);
			const index = GetCurrentMarkLevel(count, mark)
			return index;
		})
		ctx.patch(Summoning, "getMarkCount").replace(function (o, mark) {
			if (!mark)
				return 0
			const result = Math.min(
				Math.max(
					RetroactiveTabletConsumptionCalculation(mark),
					game.stats.Items.get(mark.product, ItemStats.AmountUsedInCombat)
				),
				Summoning.markLevels[mark.maxMarkLevel - 1] * mark.tier)
			return result;
		})
		function RetroactiveTabletConsumptionCalculation(mark) {
			if (!mark)
				return 0
			const result = game.stats.Items.get(mark.product, ItemStats.TimesFound)
				- game.stats.Items.get(mark.product, ItemStats.TimesSold)
				- game.combat.player.equipmentSets.reduce((acc, curr) => {
					const slot1Quantity = curr.equipment.equippedItems["melvorD:Summon1"].item.id == mark.product.id ? curr.equipment.equippedItems["melvorD:Summon1"].quantity : 0
					const slot2Quantity = curr.equipment.equippedItems["melvorD:Summon2"].item.id == mark.product.id ? curr.equipment.equippedItems["melvorD:Summon2"].quantity : 0
					return acc + slot1Quantity + slot2Quantity
				}, 0)
				- (game.bank.items.get(mark.product)?.quantity || 0)
				- game.stats.Items.get(mark.product, ItemStats.TimesLostToDeath) // Tablets consumed + tablets owned + tablets lost = total tablets. Solve for consumed.
			return result
		}
		this.RemoveMarkDrop(ctx)
		ctx.patch(Summoning, "getMarkName").replace(function (o, mark) {
			if (this.level < mark.level) {
				return getLangString('MENU_TEXT_QUESTION_MARKS');
			} else {
				return templateString(getLangString('MENU_TEXT_MARK_OF_THE'), { familiarName: mark.product.name });
			}
		})
		ctx.patch(SummoningMarkDiscoveryElement, "updateDiscoveryCount").replace(function (o, mark) {
			const markLevel = game.summoning.getMarkLevel(mark);
			const totalCount = game.summoning.getMarkCount(mark);
			const nextMarkCount = Summoning.markLevels[Math.min(game.summoning.getMarkLevel(mark), mark.maxMarkLevel - 1, Summoning.markLevels.length - 1)] * mark.tier
			const maxMarkCount = Summoning.markLevels[Summoning.markLevels.length - 1] * mark.tier
			if (markLevel >= mark.maxMarkLevel) {
				this.progressBar.style.width = '100%';
				this.progressBar.classList.remove('bg-summoning');
				this.progressBar.classList.add('bg-success');
			}
			else {
				let countToNext = totalCount;
				let nextCountRequired = Summoning.markLevels[0] * mark.tier;
				if (markLevel > 0) {
					nextCountRequired = (Summoning.markLevels[markLevel] - Summoning.markLevels[markLevel - 1]) * mark.tier;
					countToNext -= Summoning.markLevels[markLevel - 1] * mark.tier;
				}
				this.progressBar.style.width = `${((100 * countToNext) / nextCountRequired).toFixed(2)}%`;
				this.progressBar.classList.add('bg-summoning');
				this.progressBar.classList.remove('bg-success');
			}
			// this.discoveryTotal.textContent = templateLangString('MENU_TEXT_DISCOVERY_COUNT', {
			// 	count: `${formatNumber(totalCount)}`,
			// 	maxCount: `${formatNumber(Summoning.markLevels[mark.maxMarkLevel - 1] * mark.tier)}`,
			// });
			this.discoveryTotal.textContent = `Tablets Consumed: ${formatNumber(totalCount)} / ${formatNumber(nextMarkCount)}`
			// this.discoveredContent = `Maximum: ${formatNumber(maxMarkCount)}`
		})
		ctx.patch(Summoning, "discoverMark").replace(function (o, mark) {
			// const prevLevel = this.getMarkLevel(mark);
			// this.marksUnlocked.set(mark, this.getMarkCount(mark) + 1);
			// const curLevel = this.getMarkLevel(mark);
			const prevCount = this.getMarkCount(mark) - 1;
			const prevLevel = GetCurrentMarkLevel(prevCount, mark);
			const curCount = prevCount + 1;
			const curLevel = this.getMarkLevel(mark);
			this.queueMarkDiscoveryModal(mark);
			if (prevLevel !== curLevel) {
				this.queueMarkLevelUpModal(mark);
				this.renderQueue.markState.add(mark);
				this.renderQueue.synergyUnlock = true;
				// Update player stats if the mark is equipped
				if (this.game.combat.player.equipment.checkForItem(mark.product))
					this.game.combat.computeAllStats();
				// if (curLevel === 1)
				this.renderQueue.selectionTabs = false;
			}
			else {
				this.renderQueue.markCount.add(mark);
			}
			this.checkForPetMark();
		})
		ctx.patch(Summoning, "queueMarkLevelUpModal").replace(function (o, mark) {
			const markLevel = this.getMarkLevel(mark);
			const title = templateLangString('MENU_TEXT_MARK_LEVEL', { level: `${markLevel}` });
			let html = `<small>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT0', {
				markName: `<span class="font-w700 text-success">${this.getMarkName(mark)}</span>`,
			})}</span></small>`;
			if (markLevel >= 2) {
				html = `<small>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT3', {
					markName: `<span class="font-w700 text-success">${this.getMarkName(mark)}</span>`,
				})}<br><br>${templateLangString('MENU_TEXT_MARK_LEVELUP_TEXT4', {
					tierNum: `${markLevel - 1}`,
					markLevel: `${markLevel}`,
				})}</small>`;
			}
			const modal = {
				title: title,
				html: html,
				imageUrl: mark.markMedia,
				imageWidth: 64,
				imageHeight: 64,
				imageAlt: title,
			};
			addModalToQueue(modal);
		})
		// ctx.patch(SummoningMarkDiscoveryElement, "updateState").replace(function (o, mark) {
		// 	this.setDiscovered(mark);
		// })
		ctx.patch(SummoningMarkDiscoveryElement, "setSkillImages").replace(function (o, skills) {
			this.skillImageContainer.textContent = '';
			const combatIcon = createElement('img', {
				className: 'skill-icon-xs mr-1',
				attributes: [['src', game.combat.media]],
			});
			this.skillImageContainer.append(combatIcon);
			this.quickCreateButton?.classList?.add('d-none')
		})
		function GetCurrentMarkLevel(count, mark) {
			const index = Summoning.markLevels.findIndex((countRequired) => count < countRequired * mark.tier)
			if (index === -1)
				return Summoning.markLevels.length;
			else
				return index;
		}
	}

	PatchMarkMechanics = (ctx) => {
		Object.defineProperty(Summoning, 'markLevels', { get: () => { return [1, 6, 16, 31, 46, 61, 121] } }); // Add 7th mark level

		// const temp = Summoning.getTabletConsumptionXP
		// Summoning.getTabletConsumptionXP = function (summon, interval) {
		// 	return temp(summon, interval) / 1000; // Nerfing by a factor of 2 since it's way too strong with unlimited summons
		// }
		// ctx.patch(Summoning, "getTabletConsumptionXP").after(function (xp) {
		// 	return xp / 2;
		// })

		const atMaxMarkLevel = (familiar) => {
			let fam;
			if (!familiar) // Null check
				return false;
			else if (familiar instanceof EquipmentItem) // Summoning tablet -> mark
				if (game.summoning.getRecipeFromProduct(familiar))
					fam = game.summoning.getRecipeFromProduct(familiar)
				else
					return false; // An empty equipment item was supplied
			else if (familiar instanceof SummoningRecipe) // Mark was given directly, so do nothing
				fam = familiar
			return game.summoning.getMarkLevel(fam) >= fam?.maxMarkLevel
		}

		const patchEquipmentQuantity = (item, slot) => {
			if (atMaxMarkLevel(item)) {
				slot.allowQuantity = false
				// game.combat.player.equipment.equippedItems[slot].qtyElements.forEach(x => x.classList.add('d-none'))
			} else {
				slot.allowQuantity = true
				// game.combat.player.equipment.equippedItems[slot].qtyElements.forEach(x => x.classList.remove('d-none'))
			}
		}

		const slotIDs = ["melvorD:Summon1", "melvorD:Summon2"]

		ctx.patch(Player, "equipItem").before(function (item, set, slot = item.validSlots[0], quantity = 1) {
			if (slotIDs.includes(slot.id))
				patchEquipmentQuantity(item, slot)
		})

		ctx.patch(BankSelectedItemMenuElement, "setItem").before(function (bankItem, bank) {
			const item = bankItem.item
			if (item instanceof EquipmentItem)
				if (item.validSlots.some(x => slotIDs.includes(x.id))) // Only apply to Summon equip items in the bank
					patchEquipmentQuantity(item, item.validSlots[0])
		})

		ctx.patch(Player, "updateForEquipmentChange").before(function () {
			slotIDs.forEach(slotID => {
				const item = this.equipment.equippedItems[slotID].item
				const slot = this.equipment.equippedItems[slotID].slot;
				patchEquipmentQuantity(item, slot)
			})
		})

		game.summoning.recipesByProduct.forEach(x => x.maxMarkLevel = x.realm.id == "melvorD:Melvor" ? 7 : 5)

		ctx.patch(Player, "removeSummonCharge").replace(function (o, slotID, interval) {
			const tablet = this.equipment.getItemInSlot(slotID);
			const mark = this.game.summoning.getRecipeFromProduct(tablet);
			const item = this.equipment.getItemInSlot(slotID);

			if (item.id === "melvorD:Empty_Equipment") // 2 charges can be used at once if a synergy is active, and if the player has 1 Summon charge left then this function will active twice. The second time will have an empty items lot.
				return;

			if (atMaxMarkLevel(mark)) {
				if (this.damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */)
					this.game.summoning.addXPForTabletConsumption(item, interval);
			} // Only give XP
			else {
				this.trackItemUsage([{ item: tablet, quantity: 1 }]);
				game.summoning.discoverMark(mark)
				return o(slotID, interval)
			}
		})
		ctx.patch(Summoning, "getChanceForMark").before(function (mark, skill, modifiedInterval) {
			if (!this.game.combat.player.equipment.checkForItem(mark.product))
				return [mark, skill, 0];
			if (this.game.summoning.getUnlockedSynergy(this.game.combat.player.equipment.getItemInSlot("melvorD:Summon1"), this.game.combat.player.equipment.getItemInSlot("melvorD:Summon2")))
				return [mark, skill, modifiedInterval * 2];
			else
				return [mark, skill, modifiedInterval];
		})
	}
	RemoveMarkDrop(ctx) {
		ctx.patch(Summoning, "rollForMark").replace(function (o, mark, skill, modifiedInterval) { // Remove mark drops from Non-rebalance mode
			return;
		})
	}
	// #endregion Marks

	// #region Skill_trees
	PatchSummoningSkillTree = () => {
		class SkillTreeReplacement {
			constructor(nodeId, nodeStats) {
				this.nodeId = nodeId
				this.nodeStats = nodeStats
			}
		}
		// class AbyssalSkillXP {
		// 	static data = {
		// 		"id": "abyssalSkillXP",
		// 		"allowedScopes": [
		// 			{
		// 				"scopes": {
		// 					"skill": true
		// 				},
		// 				"scopeSource": "melvorD:Summoning",
		// 				"descriptions": [
		// 					{
		// 						"text": "-${value}% ${skillName} Abyssal XP",
		// 						"lang": "MODIFIER_DATA_decreasedAbyssalSkillXP",
		// 						"below": 0,
		// 						"includeSign": false
		// 					},
		// 					{
		// 						"text": "+${value}% ${skillName} Abyssal XP",
		// 						"lang": "MODIFIER_DATA_increasedAbyssalSkillXP",
		// 						"above": 0,
		// 						"includeSign": false
		// 					}
		// 				],
		// 				"posAliases": [
		// 					{
		// 						"key": "increasedAbyssalSkillXP"
		// 					}
		// 				],
		// 				"negAliases": [
		// 					{
		// 						"key": "decreasedAbyssalSkillXP"
		// 					}
		// 				]
		// 			}
		// 		]
		// 	}
		// }
		class SummoningAttackLifestealModifier {
			static data = {
				"id": "summoningAttackLifesteal",
				"allowNegative": false,
				"allowedScopes": [
					{
						"scopes": {},
						"descriptions": [
							{
								"text": "+${value}% Lifesteal for Summoning attacks",
								"lang": "MODIFIER_DATA_increasedSummoningAttackLifesteal",
								"above": 0,
								"includeSign": false
							}
						],
						"posAliases": [
							{
								"key": "increasedSummoningAttackLifesteal"
							}
						]
					}
				]
			}
		}
		class SummoningMaxHitModifier {
			static data = {
				"id": "summoningMaxHit",
				"isCombat": true,
				"allowEnemy": true,
				"allowedScopes": [
					{
						"scopes": {},
						"descriptions": [
							{
								"text": "-${value}% Summoning Max Hit",
								"lang": "MODIFIER_DATA_decreasedSummoningMaxHit",
								"below": 0,
								"includeSign": false
							},
							{
								"text": "+${value}% Summoning Max Hit",
								"lang": "MODIFIER_DATA_increasedSummoningMaxHit",
								"above": 0,
								"includeSign": false
							}
						],
						"posAliases": [
							{
								"key": "increasedSummoningMaxHit"
							}
						],
						"negAliases": [
							{
								"key": "decreasedSummoningMaxHit"
							}
						]
					}
				]
			}
		}
		class SummoningAttackIntervalModifier {
			static data = {
				"id": "summoningAttackInterval",
				"inverted": true,
				"allowPositive": false,
				"allowEnemy": true,
				"allowedScopes": [
					{
						"scopes": {},
						"descriptions": [
							{
								"text": "-${value}% Summoning Familiar Attack Interval",
								"lang": "MODIFIER_DATA_decreasedSummoningAttackIntervalPercent",
								"below": 0,
								"includeSign": false
							}
						],
						"negAliases": [
							{
								"key": "decreasedSummoningAttackIntervalPercent"
							}
						]
					}
				]
			}
		}
		class FlatSummoningAttackIntervalModifier {
			static data = {
				"id": "flatSummoningAttackInterval",
				"inverted": true,
				"allowEnemy": true,
				"modifyValue": "value/1000",
				"allowedScopes": [
					{
						"scopes": {},
						"descriptions": [
							{
								"text": "${value}s Summoning Familiar Attack Interval",
								"lang": "MODIFIER_DATA_flatSummoningAttackInterval"
							}
						]
					}
				]
			}
		}
		class CurrencyGainBasedOnSummonDamage {
			static template(currency) {
				return {
					"id": "currencyGainBasedOnSummonDamage",
					"modifyValue": "value/hpMultiplier",
					"allowedScopes": [
						{
							"scopes": {
								"currency": true
							},
							"descriptions": [
								{
									"text": "-${value}% of damage dealt to Hitpoints by Summoning Familiars gained as ${currencyName}",
									"lang": "MODIFIER_DATA_decreasedCurrencyBasedOnSummonDamage",
									"below": 0,
									"includeSign": false
								},
								{
									"text": "+${value}% of damage dealt to Hitpoints by Summoning Familiars gained as ${currencyName}",
									"lang": "MODIFIER_DATA_increasedCurrencyBasedOnSummonDamage",
									"above": 0,
									"includeSign": false
								}
							],
							"posAliases": [
								{
									"key": "increasedGPBasedOnSummonDamage",
									"currencyID": currency.id
								},
								{
									"key": "increasedCurrencyBasedOnSummonDamage"
								}
							],
							"negAliases": [
								{
									"key": "decreasedCurrencyBasedOnSummonDamage"
								},
								{
									"key": "decreasedGPBasedOnSummonDamage",
									"currencyID": currency.id
								}
							]
						}
					]
				}
			}
			static gp = this.template(game.gp)
			static sc = this.template(game.slayerCoins)
			static ap = this.template(game.abyssalPieces)
			static ac = this.template(game.abyssalSlayerCoins)
		}
		class CurrencyGainBasedOnBarrierDamage {
			static template(currency) {
				return {
					"id": "currencyGainBasedOnBarrierDamage",
					"allowNegative": false,
					"modifyValue": "value/hpMultiplier",
					"allowedScopes": [
						{
							"scopes": {
								"currency": true
							},
							"descriptions": [
								{
									"text": "+${value}% of damage dealt to Barrier by Summoning Familiars gained as ${currencyName}",
									"lang": "MODIFIER_DATA_increasedCurrencyBasedOnBarrierDamage",
									"above": 0,
									"includeSign": false
								}
							],
							"posAliases": [
								{
									"key": "increasedGPFromBarrierDamage",
									"currencyID": currency.id
								},
								{
									"key": "increasedCurrencyBasedOnBarrierDamage"
								}
							]
						}
					]
				}
			}
			static gp = this.template(game.gp)
			static sc = this.template(game.slayerCoins)
			static ap = this.template(game.abyssalPieces)
			static ac = this.template(game.abyssalSlayerCoins)
		}
		const namespace = game.registeredNamespaces.getNamespace("melvorD")
		const currencyGP = {
			currency: game.gp
		}
		const currencySC = {
			currency: game.slayerCoins
		}
		const currencyAP = {
			currency: game.abyssalPieces
		}
		const currencyAC = {
			currency: game.abyssalSlayerCoins
		}

		const replacementNodes = [
			// new SkillTreeReplacement("melvorItA:NodeA1", [new ModifierValue(new Modifier(namespace, AbyssalSkillXP.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:NodeB1", [new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 5)]),
			new SkillTreeReplacement("melvorItA:NodeD1", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamage.gp, game), 100, currencyAP)]),
			new SkillTreeReplacement("melvorItA:NodeE1", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamage.ap, game), 100, currencyGP)]),

			// new SkillTreeReplacement("melvorItA:NodeA2", [new ModifierValue(new Modifier(namespace, AbyssalSkillXP.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:NodeB2", [new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 5)]),
			new SkillTreeReplacement("melvorItA:NodeD2", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamage.gp, game), 100, currencyAP)]),
			new SkillTreeReplacement("melvorItA:NodeE2", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamage.ap, game), 100, currencyGP)]),

			new SkillTreeReplacement("melvorItA:NodeAB3", [new ModifierValue(new Modifier(namespace, SummoningMaxHitModifier.data, game), 25)]),
			new SkillTreeReplacement("melvorItA:NodeDE3", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamage.sc, game), 100, currencySC)]),

			// new SkillTreeReplacement("melvorItA:NodeA4", [new ModifierValue(new Modifier(namespace, AbyssalSkillXP.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:NodeB4", [new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 5)]),
			new SkillTreeReplacement("melvorItA:NodeD4", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamage.gp, game), 100, currencyAP)]),
			new SkillTreeReplacement("melvorItA:NodeE4", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamage.ac, game), 100, currencyGP)]),

			// new SkillTreeReplacement("melvorItA:NodeA5", [new ModifierValue(new Modifier(namespace, AbyssalSkillXP.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:NodeB5", [new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 5)]),
			new SkillTreeReplacement("melvorItA:NodeC5", [new ModifierValue(new Modifier(namespace, SummoningAttackIntervalModifier.data, game), -5)]),
			new SkillTreeReplacement("melvorItA:NodeD5", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamage.gp, game), 100, currencyAP)]),
			new SkillTreeReplacement("melvorItA:NodeE5", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamage.ac, game), 100, currencyGP)]),

			new SkillTreeReplacement("melvorItA:NodeAB6", [new ModifierValue(new Modifier(namespace, SummoningMaxHitModifier.data, game), 25)]),
			new SkillTreeReplacement("melvorItA:NodeDE6", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamage.ac, game), 100, currencyAC)]),

			new SkillTreeReplacement("melvorItA:NodeABCDE7", [
				new ModifierValue(new Modifier(namespace, SummoningAttackIntervalModifier.data, game), -9),
				new ModifierValue(new Modifier(namespace, FlatSummoningAttackIntervalModifier.data, game), -100),
				new ModifierValue(new Modifier(namespace, SummoningMaxHitModifier.data, game), 50)
			]),
		]

		replacementNodes.forEach(x => {
			game.summoning.skillTrees.getObjectByID("melvorItA:Abyssal").nodes.getObjectByID(x.nodeId).stats.modifiers = x.nodeStats
		})
	}
	// #endregion

	// # Barrier_Rebalance
	PatchBarrierMechanics = (ctx) => {
		ctx.patch(Character, "damage").replace(function (o, amount, source, thieving = false) {
			// Not working yet
			// Replaced following:
			// if (this.isBarrierActive && this.canDamageBarrier(source))
			//     this.damageBarrier(amount, source); //Only attacks from a summon can damage the barrier
			// else if (this.isBarrierActive)
			//     this.damageBarrier(0, source); //Only attacks from a summon can damage the barrier. Deal 0 dmg for the splash
			// With next 4 lines
			if (this.isBarrierActive)
				if (this.canDamageBarrier(source))
					this.damageBarrier(amount, source);
				else
					this.damageBarrier(Math.floor(amount / 10), source);
			// end modified
			else {
				if (source === 'Burn' && this.target.modifiers.maxHPBurnDamage > 0)
					amount += Math.floor((this.stats.maxHitpoints * (this.target.modifiers.maxHPBurnDamage / 100)) / 10);
				this.addHitpoints(-amount);
				this.splashManager.add({
					source: source,
					amount: -amount,
					xOffset: this.hitpointsPercent,
				});
				if (this.hitpoints <= 0 && rollPercentage(this.modifiers.rebirthChance)) {
					this.heal(this.stats.maxHitpoints);
					this._events.emit('rebirth', new CharacterRebirthEvent());
				}
			}
			this.renderQueue.damageSplash = true;
		})
		ctx.patch(Character, "clampDamageValue").replace(function (o, damage, target) {
			if (target.isBarrierActive)
				return Math.min(damage, target.barrier);
			return Math.min(damage, target.hitpoints);
		})
		ctx.patch(Character, "modifyAttackDamage").replace(function (o, target, attack, damage, applyReduction = true) {
			if (this.modifiers.disableAttackDamage > 0)
				return 0; //No damage if there is a barrier or modifier.
			// Apply Damage Modifiers
			damage = this.applyDamageModifiers(target, damage);
			if (attack.isDragonbreath)
				damage *= 1 + target.modifiers.dragonBreathDamage / 100;
			// Apply Target Damage Reduction
			damage *= 1 - target.stats.getResistance(this.damageType) / 100;
			return Math.floor(damage);
		})
	}

	// #endregion
	// #region Misc

	PatchSkillingFamiliars = () => {
		const bannedSkills = game.skills.filter(x => !x.isCombat || x.id === 'melvorD:Summoning').map(x => x.id)
		markDiscoveryMenus.forEach((v, k) => {
			if (k.skills.some(y => bannedSkills.includes(y.id)))
				v.classList.add('d-none')
		})
	}

	MakeSummoningPetCO = (IS_CO_FLAG) => {
		game.pets.getObjectByID('melvorF:Mark')[IS_CO_FLAG] = true
		game.pets.getObjectByID('melvorF:TimTheWolf')[IS_CO_FLAG] = false
	}

	MakeSummoningCombatSkill = (ctx) => {
		ctx.patch(Summoning, "hasMinibar").get((o) => { return false })
		ctx.patch(Summoning, "hasMastery").get((o) => { return false })
		ctx.patch(Summoning, "isCombat").get((o) => { return true })
		ctx.patch(Game, "playerNormalCombatLevel").get((o) => {
			return o() + Math.floor(0.25 * game.summoning.level / 2);
			// const base = 0.25 * (this.defence.level + this.hitpoints.level + Math.floor(this.prayer.level / 2) + Math.floor(this.summoning.level / 2));
			// const melee = 0.325 * (this.attack.level + this.strength.level);
			// const range = 0.325 * Math.floor((3 * this.ranged.level) / 2);
			// const magic = 0.325 * Math.floor((3 * this.altMagic.level) / 2);
			// const levels = [melee, range, magic];
			// return Math.floor(base + Math.max(...levels));
		})
		ctx.patch(Game, "playerAbyssalCombatLevel").get((o) => {
			return o() + Math.floor(0.25 * (game.summoning.level + game.summoning.abyssalLevel) / 2);
			// const base = 0.25 * (this.defence.level + this.defence.abyssalLevel + this.hitpoints.level + this.hitpoints.abyssalLevel + Math.floor((this.prayer.level + this.prayer.abyssalLevel) / 2) + Math.floor((this.summoning.level + this.summoning.abyssalLevel) / 2));
			// const melee = 0.325 * (this.attack.level + this.attack.abyssalLevel + this.strength.level + this.strength.abyssalLevel);
			// const range = 0.325 * Math.floor((3 * (this.ranged.level + this.ranged.abyssalLevel)) / 2);
			// const magic = 0.325 * Math.floor((3 * (this.altMagic.level + this.altMagic.abyssalLevel)) / 2);
			// const levels = [melee, range, magic];
			// return Math.floor(base + Math.max(...levels));
		})

		game.pages.getObjectByID("melvorD:Summoning").skillSidebarCategoryID = "Combat";
	}
	// #endregion misc

}