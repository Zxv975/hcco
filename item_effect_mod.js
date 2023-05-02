//mod.register(ctx => {
ctx = mod.getContext('hcco')
const coGamemodeCheck = () => { // Check if the user is playing a CO game mode
	return (game.currentGamemode.namespace === 'hcco')
}
const buttonNames = { rebalance: 'co-rebalance-button-value' }
const rebalanceButtonValue = () => ctx.characterStorage.getItem(buttonNames.rebalance)

const newModifiers = {
	bundled_heal: "heal12ForFirstStun",
	bundled_dr: "increased5DRAfterStunned",
	levi_heal: "heal12ForFirst5Attacks"
}

const savedItemDescriptions = {
	bundled_protection_body: game.items.getObjectByID("melvorTotH:Bundled_Protection_Body")._customDescription,
	frostspark_amulet: game.items.getObjectByID("melvorTotH:FrostSpark_Amulet")._customDescription,
	leviathan_shield: game.items.getObjectByID("melvorTotH:Leviathan_Shield")._customDescription
}

const heal12ForFirstStunEffect = {
	type: 'Modifier',
	modifiers: {},
	maxStacks: 1,
	stacksToAdd: 1,
	turns: Infinity,
	countsOn: 'Target',
	character: 'Attacker',
	media: dotMedia.Regen
};
const increased5DRAfterStunnedEffect = {
	type: 'Modifier',
	modifiers: {
		increasedDamageReduction: 5,
	},
	maxStacks: 1,
	stacksToAdd: 1,
	turns: Infinity,
	countsOn: 'Target',
	character: 'Attacker',
	media: effectMedia.defenseUp
};
const heal12ForFirst5AttacksEffect = {
	type: 'Modifier',
	modifiers: {},
	maxStacks: 5,
	stacksToAdd: 1,
	turns: Infinity,
	countsOn: 'Target',
	character: 'Attacker',
	media: dotMedia.Regen
};

const checkIfShocked = () => {
	[...game.combat.player.modifierEffects.fromTarget.countSelf].filter(effectMap => [...effectMap[1].keys()].filter(y => y.media === "assets/media/status/shocked.svg") !== []) !== [] || [...game.combat.player.modifierEffects.fromSelf.countSelf].filter(effectMap => [...effectMap[1].keys()].filter(y => y.media === "assets/media/status/shocked.svg") !== []) !== []
}

// Add/remove modifiers
export const patchItemModifiers = (patchFlag) => {
	if (patchFlag) {
		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['increased5DROnBeingHit'] // Base game
		game.items.getObjectByID('melvorTotH:FrostSpark_Amulet').modifiers['increasedHealWhenStunned'] = 7 // Base game

		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers[newModifiers.bundled_heal] = 1
		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers[newModifiers.bundled_dr] = 1
		game.items.getObjectByID('melvorTotH:Leviathan_Shield').modifiers[newModifiers.levi_heal] = 1
	} else {
		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['increased5DROnBeingHit'] = 1 // Base game
		delete game.items.getObjectByID('melvorTotH:FrostSpark_Amulet').modifiers['increasedHealWhenStunned'] // Base game

		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers[newModifiers.bundled_heal]
		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers[newModifiers.bundled_dr]
		delete game.items.getObjectByID('melvorTotH:Leviathan_Shield').modifiers[newModifiers.levi_heal]
	}
}

export function initEffectRebalance() {
	const createNewModifiers = () => {
		// Create new modifiers 
		// Idk why these exist really
		game.modifiers[newModifiers.bundled_heal] = 0 // Bundled protection
		game.modifiers[newModifiers.bundled_dr] = 0 // Bundled protection
		game.modifiers[newModifiers.levi_heal] = 0 // Leviathan

		game.combat.player.mods = {}
		game.combat.player.mods[newModifiers.bundled_heal] = { maxStacks: 1, stackCounter: 0, amount: 12 } // Bundled protection
		game.combat.player.mods[newModifiers.bundled_dr] = { maxStacks: 1, stackCounter: 0, amount: 5 } // Bundled protection
		game.combat.player.mods[newModifiers.levi_heal] = { maxStacks: 5, stackCounter: 0, amount: 12 } // Leviathan

		// Create new descriptions
		modifierData[newModifiers.bundled_heal] = {
			description: "Heal for 12% of your max HP the first time you are stunned in combat. Activates once per fight.",
			langDescription: "Heal for 12% of your max HP the first time you are stunned in combat. Activates once per fight.",
			isNegative: false, isSkill: false, tags: ['combat']
		}
		modifierData[newModifiers.bundled_dr] = {
			description: "Gain +5% DR for the remainder of the fight after you are stunned in combat. Activates once per fight.",
			langDescription: "Gain +5% DR for the remainder of the fight after you are stunned in combat. Activates once per fight.",
			isNegative: false, isSkill: false, tags: ['combat']
		}
		modifierData[newModifiers.levi_heal] = {
			description: "Heal for 12% of your max HP each time you are damaged in combat, and heal for 12% of your max HP after combat ends. Activates up to 5 times.",
			langDescription: "Heal for 12% of your max HP each time you are damaged in combat, and heal for 12% of your max HP after combat ends. Activates up to 5 times.",
			isNegative: false, isSkill: false, tags: ['combat']
		}
		ModifierID[ModifierID[newModifiers.bundled_heal] = 10000] = newModifiers.bundled_dr;
		ModifierID[ModifierID[newModifiers.bundled_heal] = 10001] = newModifiers.bundled_heal;
		ModifierID[ModifierID[newModifiers.levi_heal] = 10002] = newModifiers.levi_heal;
	}

	const patchModifierFunctions = () => {
		ctx.patch(CombatManager, "startFight").before(function () {
			if (!rebalanceButtonValue())
				return
			game.combat.player.mods[newModifiers.bundled_dr].stackCounter = 0 // Reset
			game.combat.player.mods[newModifiers.bundled_heal].stackCounter = 0 // Reset
		})

		ctx.patch(CombatManager, "endFight").before(function () {
			if (!rebalanceButtonValue())
				return
			game.combat.player.mods[newModifiers.bundled_dr].stackCounter = 0 // Reset
			game.combat.player.mods[newModifiers.bundled_heal].stackCounter = 0 // Reset
			if (this.player.modifiers[newModifiers.levi_heal] > 0) {
				const healing = Math.floor(
					(game.combat.player.stats.maxHitpoints * game.combat.player.mods[newModifiers.levi_heal].amount) / 100
				);
				game.combat.player.heal(healing);
				game.combat.player.mods[newModifiers.levi_heal].stackCounter++;
			}
		})
		ctx.patch(Player, "onBeingStunned").before(function () {
			if (!rebalanceButtonValue())
				return

			if (this.stun.flavour === "Stun") {
				if (this.modifiers[newModifiers.bundled_heal] > 0) {
					if (game.combat.player.mods[newModifiers.bundled_heal].stackCounter < game.combat.player.mods[newModifiers.bundled_heal].maxStacks) {
						//this.applyModifierEffect(heal12ForFirstStunEffect, this, this.game.normalAttack);
						const healing = Math.floor((this.stats.maxHitpoints * game.combat.player.mods[newModifiers.bundled_heal.amount]) / 100);
						this.heal(healing);
						game.combat.player.mods[newModifiers.bundled_heal].stackCounter++;
					}
				}
				if (this.modifiers[newModifiers.bundled_dr] > 0) {
					if (game.combat.player.mods[newModifiers.bundled_dr].stackCounter < game.combat.player.mods[newModifiers.bundled_dr].maxStacks) {
						//this.applyModifierEffect(increased5DRAfterStunnedEffect, this, this.game.normalAttack);
						game.combat.player.mods[newModifiers.bundled_dr].stackCounter++
					}
					//this.applyModifierEffect(increased5DRAfterStunnedEffect, this, this.game.normalAttack);
				}
			}
		})
		ctx.patch(PlayerModifiers, "getFlatDamageReductionModifier").after(function (returnedValue) {
			if (!rebalanceButtonValue())
				return returnedValue
			return returnedValue +
				game.combat.player.mods[newModifiers.bundled_dr].stackCounter * // How many stacks
				game.combat.player.mods[newModifiers.bundled_dr].amount * // How much DR per stack
				this.increased5DRAfterStunned // Flag for whether modifier is present
		})
		ctx.patch(Player, "onBeingHit").before(function () {
			if (!rebalanceButtonValue())
				return
			if (this.modifiers[newModifiers.levi_heal] > 0) {
				if ([...game.combat.player.reflexiveEffects].filter(x => x[0].name == 'Spiky Skin')[0][1].stacks < game.combat.player.mods[newModifiers.levi_heal].maxStacks) {
					const healing = Math.floor((this.stats.maxHitpoints * game.combat.player.mods[newModifiers.levi_heal].amount) / 100);
					this.heal(healing);
					game.combat.player.mods[newModifiers.levi_heal].stackCounter++;
				}
			}
		})
	}

	createNewModifiers()
	patchModifierFunctions()
}

	// ctx.onCharacterLoaded(c => {
	// 	if (!coGamemodeCheck())
	// 		return
	// 	patchItemModifiers(true)
	// 	initEffectRebalance()
	// })
//})