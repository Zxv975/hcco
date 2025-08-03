

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
		})

		ctx.patch(Summoning, "resetToDefaultSelectedRecipeBasedOnRealm").replace(function (o, mark) { })
	}

	// #endregion HTML_changes

	// #region Marks
	PatchMarkMechanics = (ctx) => {
		Object.defineProperty(Summoning, 'markLevels', { get: () => { return [1, 6, 16, 31, 46, 61, 121] } }); // Add 7th mark level

		const atMaxMarkLevel = (familiar) => {
			let fam;
			if (familiar instanceof EquipmentItem) // Summoning tablet -> mark
				fam = game.summoning.getRecipeFromProduct(familiar)
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

			if (atMaxMarkLevel(mark)) {
				if (this.damageType.id !== "melvorItA:Eternal" /* DamageTypeIDs.Eternal */)
					this.game.summoning.addXPForTabletConsumption(item, interval);
			} // Only give XP
			else { return o(slotID, interval) }
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
		class AbyssalSkillXP {
			static data = {
				"id": "abyssalSkillXP",
				"allowedScopes": [
					{
						"scopes": {},
						"descriptions": [
							{
								"text": "-${value}% Global Abyssal XP",
								"lang": "MODIFIER_DATA_decreasedGlobalAbyssalSkillXP",
								"below": 0,
								"includeSign": false
							},
							{
								"text": "+${value}% Global Abyssal XP",
								"lang": "MODIFIER_DATA_increasedGlobalAbyssalSkillXP",
								"above": 0,
								"includeSign": false
							}
						],
						"posAliases": [
							{
								"key": "increasedGlobalAbyssalSkillXP"
							}
						],
						"negAliases": [
							{
								"key": "decreasedGlobalAbyssalSkillXP"
							}
						]
					},
					{
						"scopes": {
							"skill": true
						},
						"descriptions": [
							{
								"text": "-${value}% ${skillName} Abyssal XP",
								"lang": "MODIFIER_DATA_decreasedAbyssalSkillXP",
								"below": 0,
								"includeSign": false
							},
							{
								"text": "+${value}% ${skillName} Abyssal XP",
								"lang": "MODIFIER_DATA_increasedAbyssalSkillXP",
								"above": 0,
								"includeSign": false
							}
						],
						"posAliases": [
							{
								"key": "increasedAbyssalSkillXP"
							}
						],
						"negAliases": [
							{
								"key": "decreasedAbyssalSkillXP"
							}
						]
					}
				]
			}
		}
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
		class CurrencyGainBasedOnSummonDamageAP {
			static data = {
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
								"currencyID": "melvorItA:AbyssalPieces"
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
								"currencyID": "melvorItA:AbyssalPieces"
							}
						]
					}
				]
			}
		}
		class CurrencyGainBasedOnSummonDamageAC {
			static data = {
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
								"currencyID": "melvorItA:AbyssalSlayerCoins"
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
								"currencyID": "melvorItA:AbyssalSlayerCoins"
							}
						]
					}
				]
			}
		}
		class CurrencyGainBasedOnBarrierDamageAP {
			static data = {
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
								"currencyID": "melvorItA:AbyssalPieces"
							},
							{
								"key": "increasedCurrencyBasedOnBarrierDamage"
							}
						]
					}
				]
			}
		}
		class CurrencyGainBasedOnBarrierDamageAC {
			static data = {
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
								"currencyID": "melvorItA:AbyssalSlayerCoins"
							},
							{
								"key": "increasedCurrencyBasedOnBarrierDamage"
							}
						]
					}
				]
			}
		}
		const namespace = {
			name: "melvorD",
			displayName: "Demo",
			isModded: false
		}
		const currencyAP = {
			currency: {
				name: "Abyssal Coins"
			}
		}
		const currencyAC = {
			currency: {
				name: "Abyssal Slayer Coins"
			}
		}
		const currencyGP = {
			currency: {
				name: "Gold Coins"
			}
		}

		const replacementNodes = [
			new SkillTreeReplacement("melvorItA:NodeA1", [new ModifierValue(new Modifier(namespace, AbyssalSkillXP.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:NodeB1", [new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 5)]),
			new SkillTreeReplacement("melvorItA:NodeD1", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamageAP.data, game), 10, currencyAP)]),
			new SkillTreeReplacement("melvorItA:NodeE1", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamageAP.data, game), 10, currencyGP)]),

			new SkillTreeReplacement("melvorItA:NodeA2", [new ModifierValue(new Modifier(namespace, AbyssalSkillXP.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:NodeB2", [new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 5)]),
			new SkillTreeReplacement("melvorItA:NodeD2", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamageAP.data, game), 10, currencyAP)]),
			new SkillTreeReplacement("melvorItA:NodeE2", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamageAP.data, game), 10, currencyGP)]),

			new SkillTreeReplacement("melvorItA:NodeAB3", [new ModifierValue(new Modifier(namespace, SummoningMaxHitModifier.data, game), 25)]),
			new SkillTreeReplacement("melvorItA:NodeDE3", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamageAC.data, game), 10, currencyAC)]),

			new SkillTreeReplacement("melvorItA:NodeA4", [new ModifierValue(new Modifier(namespace, AbyssalSkillXP.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:NodeB4", [new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 5)]),
			new SkillTreeReplacement("melvorItA:NodeD4", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamageAP.data, game), 10, currencyAP)]),
			new SkillTreeReplacement("melvorItA:NodeE4", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamageAP.data, game), 10, currencyGP)]),

			new SkillTreeReplacement("melvorItA:NodeA5", [new ModifierValue(new Modifier(namespace, AbyssalSkillXP.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:NodeB5", [new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 5)]),
			new SkillTreeReplacement("melvorItA:NodeC5", [new ModifierValue(new Modifier(namespace, SummoningAttackIntervalModifier.data, game), -5)]),
			new SkillTreeReplacement("melvorItA:NodeD5", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamageAP.data, game), 10, currencyAP)]),
			new SkillTreeReplacement("melvorItA:NodeE5", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnBarrierDamageAP.data, game), 10, currencyGP)]),

			new SkillTreeReplacement("melvorItA:NodeAB6", [new ModifierValue(new Modifier(namespace, SummoningMaxHitModifier.data, game), 25)]),
			new SkillTreeReplacement("melvorItA:NodeDE6", [new ModifierValue(new Modifier(namespace, CurrencyGainBasedOnSummonDamageAC.data, game), 10, currencyAC)]),

			new SkillTreeReplacement("melvorItA:NodeABCDE7", [
				new ModifierValue(new Modifier(namespace, SummoningAttackIntervalModifier.data, game), -8),
				new ModifierValue(new Modifier(namespace, FlatSummoningAttackIntervalModifier.data, game), -100),
				new ModifierValue(new Modifier(namespace, SummoningAttackLifestealModifier.data, game), 15),
				new ModifierValue(new Modifier(namespace, SummoningMaxHitModifier.data, game), 50)
			]),
		]

		replacementNodes.forEach(x => {
			game.summoning.skillTrees.getObjectByID("melvorItA:Abyssal").nodes.getObjectByID(x.nodeId).stats.modifiers = x.nodeStats
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
		ctx.patch(Summoning, "hasMinibar").get((o) => {
			return false
		})
		ctx.patch(Summoning, "hasMastery").get((o) => {
			return false
		})
		ctx.patch(Summoning, "isCombat").get((o) => {
			return true
		})
		Object.defineProperty(game, 'playerNormalCombatLevel', {
			get() {
				const base = 0.25 * (this.defence.level + this.hitpoints.level + Math.floor(this.prayer.level / 2) + Math.floor(this.summoning.level / 2));
				const melee = 0.325 * (this.attack.level + this.strength.level);
				const range = 0.325 * Math.floor((3 * this.ranged.level) / 2);
				const magic = 0.325 * Math.floor((3 * this.altMagic.level) / 2);
				const levels = [melee, range, magic];
				return Math.floor(base + Math.max(...levels));
			}
		});
		Object.defineProperty(game, 'playerAbyssalCombatLevel', {
			get() {
				const base = 0.25 * (this.defence.level + this.defence.abyssalLevel + this.hitpoints.level + this.hitpoints.abyssalLevel + Math.floor((this.prayer.level + this.prayer.abyssalLevel) / 2) + Math.floor((this.summoning.level + this.summoning.abyssalLevel) / 2));
				const melee = 0.325 * (this.attack.level + this.attack.abyssalLevel + this.strength.level + this.strength.abyssalLevel);
				const range = 0.325 * Math.floor((3 * (this.ranged.level + this.ranged.abyssalLevel)) / 2);
				const magic = 0.325 * Math.floor((3 * (this.altMagic.level + this.altMagic.abyssalLevel)) / 2);
				const levels = [melee, range, magic];
				return Math.floor(base + Math.max(...levels));
			}
		});

		game.pages.getObjectByID("melvorD:Summoning").skillSidebarCategoryID = "Combat";
	}
	// #endregion misc

}