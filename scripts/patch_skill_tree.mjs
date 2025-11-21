export class PatchSkillTree {
	PatchSkillTree = () => {
		class SkillTreeReplacement {
			constructor(nodeId, nodeStats) {
				this.nodeId = nodeId
				this.nodeStats = nodeStats
			}
		}
		// #region Summoning

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

		// #endregion

		// #region Magic
		class RunePreservation {
			static data = {
				"id": "runePreservationChance",
				"allowedScopes": [
					{
						"scopes": {},
						"descriptions": [
							{
								"text": "-${value}% Rune Preservation",
								"lang": "MODIFIER_DATA_decreasedRunePreservation",
								"below": 0,
								"includeSign": false
							},
							{
								"text": "+${value}% Rune Preservation",
								"lang": "MODIFIER_DATA_increasedRunePreservation",
								"above": 0,
								"includeSign": false
							}
						],
						"posAliases": [
							{
								"key": "increasedRunePreservation"
							}
						],
						"negAliases": [
							{
								"key": "decreasedRunePreservation"
							}
						]
					}
				]
			}
		}
		class DoubleRuneProvision {
			static data = {
				"id": "doubleRuneProvision",
				"allowNegative": false,
				"modifyValue": "2^value",
				"allowedScopes": [
					{
						"scopes": {},
						"descriptions": [
							{
								"text": "Rune providing items provide ${value}x as many runes",
								"lang": "MODIFIER_DATA_increasedRuneProvision",
								"above": 0,
								"includeSign": false
							}
						],
						"posAliases": [
							{
								"key": "increasedRuneProvision"
							}
						]
					}
				]
			}
		}
		class MagicMinHitBasedOnMaxHit {
			static data = {
				"id": "magicMinHitBasedOnMaxHit",
				"isCombat": true,
				"allowEnemy": true,
				"allowedScopes": [
					{
						"scopes": {},
						"descriptions": [
							{
								"text": "+${value}% of Magic Maximum Hit added to Minimum Hit",
								"lang": "MODIFIER_DATA_magicMinHitBasedOnMaxHit"
							}
						],
						"posAliases": [
							{
								"key": "increasedMinHitBasedOnMaxHitMagic"
							}
						]
					},
					{
						"scopes": {
							"subcategory": true
						},
						"scopeSource": "melvorD:AttackSpell",
						"descriptions": [
							{
								"text": "${value}5% of Magic Maximum Hit added to Minimum Hit when using ${subcategoryName} Spells",
								"lang": "MODIFIER_DATA_magicMinHitBasedOnMaxHitSubcategory"
							}
						]
					}
				]
			}
		}
		const replacementNodesMagic = [
			new SkillTreeReplacement("melvorItA:D3", [new ModifierValue(new Modifier(namespace, RunePreservation.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:D4", [new ModifierValue(new Modifier(namespace, RunePreservation.data, game), 10)]),
			new SkillTreeReplacement("melvorItA:D5", [new ModifierValue(new Modifier(namespace, RunePreservation.data, game), 15)]),
			new SkillTreeReplacement("melvorItA:BC6", [
				new ModifierValue(new Modifier(namespace, MagicMinHitBasedOnMaxHit.data, game), 10),
				new ModifierValue(new Modifier(namespace, DoubleRuneProvision.data, game), 1),
			]),
		]

		replacementNodesMagic.forEach(x => {
			game.altMagic.skillTrees.getObjectByID("melvorItA:Abyssal").nodes.getObjectByID(x.nodeId).stats.modifiers = x.nodeStats
		})

		// #endregion
	}
}