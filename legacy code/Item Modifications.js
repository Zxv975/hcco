
// 	## Item rebalance
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

// Add / remove modifiers
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

// 	// Setup functions
// 	function initEffectRebalance() {
// 		const createNewModifiers = () => {
// 			// Create new modifiers 
// 			// Idk why these exist really

// 			game.modifiers[newModifiers.bundled_heal] = 0 // Bundled protection
// 			game.modifiers[newModifiers.bundled_dr] = 0 // Bundled protection
// 			game.modifiers[newModifiers.levi_heal] = 0 // Leviathan

// 			game.combat.player.mods = {}
// 			game.combat.player.mods[newModifiers.bundled_heal] = { maxStacks: 1, stackCounter: 0, amount: 12 } // Bundled protection
// 			game.combat.player.mods[newModifiers.bundled_dr] = { maxStacks: 1, stackCounter: 0, amount: 5 } // Bundled protection
// 			game.combat.player.mods[newModifiers.levi_heal] = { maxStacks: 5, stackCounter: 0, amount: 12 } // Leviathan

// 			// Create new descriptions
// 			modifierData[newModifiers.bundled_heal] = {
// 				get langDescription() {
// 					return getLangString('MODIFIER_DATA', newModifiers.bundled_heal);
// 				},
// 				//description: "When stunned by an Enemy, heal for 12% of your max HP. Activates once per fight.",
// 				isNegative: false, isSkill: false, tags: ['combat']
// 			}

// 			modifierData[newModifiers.bundled_dr] = {
// 				get langDescription() {
// 					return getLangString('MODIFIER_DATA', newModifiers.bundled_dr);
// 				},
// 				//description: "When stunned by an Enemy, gain +5% DR for the remainder of the fight. Activates once per fight.",
// 				isNegative: false, isSkill: false, tags: ['combat']
// 			}

// 			modifierData[newModifiers.levi_heal] = {
// 				get langDescription() {
// 					return getLangString('MODIFIER_DATA', newModifiers.levi_heal);
// 				},
// 				//description: "When hit by an Enemy, heal for 12% of your max HP and heal for 12% of your max HP at the end of combat. Activates up to 5 times per fight.",
// 				isNegative: false, isSkill: false, tags: ['combat']
// 			}

// 			// Pre v1.1.2 
// 			// loadedLangJson.MODIFIER_DATA[newModifiers.bundled_heal] = "When stunned by an Enemy, heal for 12% of your max HP. Activates once per fight"
// 			// loadedLangJson.MODIFIER_DATA[newModifiers.bundled_dr] = "When stunned by an Enemy, gain +5% DR for the remainder of the fight. Activates once per fight"
// 			// loadedLangJson.MODIFIER_DATA[newModifiers.levi_heal] = "When hit by an Enemy, heal for 12% of your max HP, and heal for 12% of your max HP at the end of combat. Activates up to 5 times per fight"

// 			// Post v1.1.2
// 			loadedLangJson[`MODIFIER_DATA_${newModifiers.bundled_heal}`] = "When stunned by an Enemy, heal for 12% of your max HP. Activates once per fight"
// 			loadedLangJson[`MODIFIER_DATA_${newModifiers.bundled_dr}`] = "When stunned by an Enemy, gain +5% DR for the remainder of the fight. Activates once per fight"
// 			loadedLangJson[`MODIFIER_DATA_${newModifiers.levi_heal}`] = "When hit by an Enemy, heal for 12% of your max HP, and heal for 12% of your max HP at the end of combat. Activates up to 5 times per fight"
// 		}

// 		const patchModifierFunctions = () => {
// 			ctx.patch(BaseManager, "startFight").before(function (tickOffset) {
// 				if (!rebalanceButtonValue())
// 					return
// 				game.combat.player.mods[newModifiers.bundled_dr].stackCounter = 0 // Reset
// 				game.combat.player.mods[newModifiers.bundled_heal].stackCounter = 0 // Reset
// 			})

// 			ctx.patch(BaseManager, "endFight").before(function () {
// 				if (!rebalanceButtonValue())
// 					return
// 				game.combat.player.mods[newModifiers.bundled_dr].stackCounter = 0 // Reset
// 				game.combat.player.mods[newModifiers.bundled_heal].stackCounter = 0 // Reset
// 				if (this.player.modifiers[newModifiers.levi_heal] > 0) {
// 					const healing = Math.floor(
// 						(game.combat.player.stats.maxHitpoints * game.combat.player.mods[newModifiers.levi_heal].amount) / 100
// 					);
// 					game.combat.player.heal(healing);
// 					game.combat.player.mods[newModifiers.levi_heal].stackCounter++;
// 				}
// 			})

// 			ctx.patch(Player, "onBeingStunned").after(function () {
// 				if (!rebalanceButtonValue())
// 					return

// 				if (this.stun.flavour === "Stun") {
// 					if (this.modifiers[newModifiers.bundled_heal] > 0) {
// 						// this.applyModifierEffect(heal12ForFirstStunEffect, this, this.game.normalAttack);
// 						if (game.combat.player.mods[newModifiers.bundled_heal].stackCounter < game.combat.player.mods[newModifiers.bundled_heal].maxStacks) {
// 							const healing = Math.floor((this.stats.maxHitpoints * game.combat.player.mods[newModifiers.bundled_heal].amount) / 100);
// 							this.heal(healing);
// 							game.combat.player.mods[newModifiers.bundled_heal].stackCounter++;
// 						}
// 					}
// 					if (this.modifiers[newModifiers.bundled_dr] > 0) {
// 						if (game.combat.player.mods[newModifiers.bundled_dr].stackCounter < game.combat.player.mods[newModifiers.bundled_dr].maxStacks) {
// 							game.combat.player.mods[newModifiers.bundled_dr].stackCounter++
// 						}
// 						// this.applyModifierEffect(increased5DRAfterStunnedEffect, this, this.game.normalAttack);
// 					}
// 				}
// 			})

// 			ctx.patch(PlayerModifiers, "getFlatDamageReductionModifier").after(function (returnedValue) {
// 				if (!rebalanceButtonValue())
// 					return returnedValue

// 				return returnedValue +
// 					game.combat.player.mods[newModifiers.bundled_dr].stackCounter * // How many stacks
// 					game.combat.player.mods[newModifiers.bundled_dr].amount * // How much DR per stack
// 					this.increased5DRAfterStunned // Flag for whether modifier is present
// 			})

// 			ctx.patch(Player, "onBeingHit").before(function () {
// 				if (!rebalanceButtonValue())
// 					return

// 				if (this.modifiers[newModifiers.levi_heal] > 0) {
// 					if ([...game.combat.player.reflexiveEffects].filter(x => x[0].name == 'Spiky Skin')[0][1].stacks <= game.combat.player.mods[newModifiers.levi_heal].maxStacks) {
// 						const healing = Math.floor((this.stats.maxHitpoints * game.combat.player.mods[newModifiers.levi_heal].amount) / 100);
// 						this.heal(healing);
// 						game.combat.player.mods[newModifiers.levi_heal].stackCounter++;
// 						// this.applyModifierEffect(heal12ForFirst5AttacksEffect, this, this.game.normalAttack);
// 					}
// 				}
// 			})
// 		}

// 		createNewModifiers()
// 		patchItemModifiers(rebalanceButtonValue())
// 		patchModifierFunctions()
// 	}