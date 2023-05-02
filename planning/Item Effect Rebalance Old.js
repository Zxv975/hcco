ctx = mod.getDevContext()
const createNewModifiers = () => {
	// Create new modifiers
	game.modifiers.heal12ForFirstStun = 0 // Bundled protection
	game.modifiers.increased5DRAfterStunned = 0 // Bundled protection
	game.modifiers.heal12ForFirst5Attacks = 0 // Leviathan

	// Create new descriptions
	modifierData.heal12ForFirstStun = {
		description: "asdf",
		langDescription: "",
		isNegative: false, isSkill: false, tags: ['combat']
	}
	modifierData.increased5DRAfterStunned = {
		description: "asdf",
		langDescription: "",
		isNegative: false, isSkill: false, tags: ['combat']
	}
	modifierData.heal12ForFirst5Attacks = {
		description: "asdf",
		langDescription: "",
		isNegative: false, isSkill: false, tags: ['combat']
	}
	ModifierID[ModifierID["heal12ForFirstStun"] = 770] = "heal12ForFirstStun";
	ModifierID[ModifierID["increased5DRAfterStunned"] = 771] = "increased5DRAfterStunned";
	ModifierID[ModifierID["heal12ForFirst5Attacks"] = 772] = "heal12ForFirst5Attacks";
}

// Add modifiers
const patchItemModifiers = (patchFlag) => {
	if (patchFlag) {
		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['heal12ForFirstStun'] = 1
		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['increased5DRAfterStunned'] = 1
		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['increased5DROnBeingHit']
		game.items.getObjectByID('melvorTotH:Leviathan_Shield').modifiers['heal12ForFirst5Attacks'] = 1
	} else {
		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['heal12ForFirstStun']
		delete game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['increased5DRAfterStunned']
		game.items.getObjectByID('melvorTotH:Bundled_Protection_Body').modifiers['increased5DROnBeingHit'] = 1
		delete game.items.getObjectByID('melvorTotH:Leviathan_Shield').modifiers['heal12ForFirst5Attacks']
	}
}

let heal12ForFirstStunEffect = {
	type: 'Modifier',
	modifiers: {},
	maxStacks: 1,
	stacksToAdd: 1,
	turns: Infinity,
	countsOn: 'Target',
	character: 'Attacker',
	media: dotMedia.Regen,
	stackCounter: 0
};

let increased5DRAfterStunnedEffect = {
	type: 'Modifier',
	modifiers: {
		increasedDamageReduction: 5,
	},
	maxStacks: 1,
	stacksToAdd: 1,
	turns: Infinity,
	countsOn: 'Target',
	character: 'Attacker',
	media: effectMedia.defenseUp,
	stackCounter: 0
};

let heal12ForFirst5AttacksEffect = {
	type: 'Modifier',
	modifiers: {},
	maxStacks: 5,
	stacksToAdd: 1,
	turns: Infinity,
	countsOn: 'Target',
	character: 'Attacker',
	media: dotMedia.Regen
};

function patchModifierActivations(patchFlag) {
	if (patchFlag) {
		ctx.patch(CombatManager, "startFight").before(function () {
			heal12ForFirstStunEffect.stackCounter = 0 // Reset
			increased5DRAfterStunnedEffect.stackCounter = 0 // Reset
		})
		ctx.patch(CombatManager, "endFight").before(function () {
			heal12ForFirstStunEffect.stackCounter = 0 // Reset
			increased5DRAfterStunnedEffect.stackCounter = 0 // Reset
			if (game.combat.player.modifiers.heal12ForFirst5Attacks > 0) {
				const healing = Math.floor((game.combat.player.stats.maxHitpoints * 12) / 100);
				game.combat.player.heal(healing);
				heal12ForFirst5AttacksEffect.stackCounter++;
			}
		})
		// Bundled protection body
		ctx.patch(Player, "onBeingStunned").before(function () {
			if (this.stun.flavour === "Stun") {
				if (this.modifiers.heal12ForFirstStun > 0) {
					if (heal12ForFirstStunEffect.stackCounter < heal12ForFirstStunEffect.maxStacks) {
						//this.applyModifierEffect(heal12ForFirstStunEffect, this, this.game.normalAttack);
						const healing = Math.floor((this.stats.maxHitpoints * 12) / 100);
						this.heal(healing);
						heal12ForFirstStunEffect.stackCounter++;
					}
				}
				if (this.modifiers.increased5DRAfterStunned) {
					if (increased5DRAfterStunnedEffect.stackCounter < increased5DRAfterStunnedEffect.maxStacks) {
						//this.applyModifierEffect(increased5DRAfterStunnedEffect, this, this.game.normalAttack);
						increased5DRAfterStunnedEffect.stackCounter++
					}
					//this.applyModifierEffect(increased5DRAfterStunnedEffect, this, this.game.normalAttack);
				}
			}
		})
		ctx.patch(PlayerModifiers, "getFlatDamageReductionModifier").after(function (returnedValue) {
			return returnedValue + increased5DRAfterStunnedEffect.stackCounter * increased5DRAfterStunnedEffect.modifiers.increasedDamageReduction * this.increased5DRAfterStunned
		})
		// Leviathan
		ctx.patch(Player, "onBeingHit").before(function () {
			if (this.modifiers.heal12ForFirst5Attacks > 0) {
				if ([...game.combat.player.reflexiveEffects].filter(x => x[0].name == 'Spiky Skin')[0][1].stacks < heal12ForFirst5AttacksEffect.maxStacks) {
					const healing = Math.floor((this.stats.maxHitpoints * 12) / 100);
					this.heal(healing);
					heal12ForFirst5AttacksEffect.stackCounter++;
				}
			}
		})
		// FrostSpark amulet
		game.items.getObjectByID('melvorTotH:FrostSpark_Amulet').modifiers['increasedHealWhenStunned'] = 7
	} else {
		// Bundled protection body
		ctx.patch(Player, "onBeingStunned").before(() => { })
		ctx.patch(PlayerModifiers, "getFlatDamageReductionModifier").after(() => { })
		ctx.patch(Player, "onBeingHit").before(() => { })
		// FrostSpark amulet
		delete game.items.getObjectByID('melvorTotH:FrostSpark_Amulet').modifiers['increasedHealWhenStunned']
	}
}

const checkIfShocked = () => {
	[...game.combat.player.modifierEffects.fromTarget.countSelf].filter(effectMap => [...effectMap[1].keys()].filter(y => y.media === "assets/media/status/shocked.svg") !== []) !== [] || [...game.combat.player.modifierEffects.fromSelf.countSelf].filter(effectMap => [...effectMap[1].keys()].filter(y => y.media === "assets/media/status/shocked.svg") !== []) !== []
 }
 
createNewModifiers()
patchItemModifiers(true)
patchModifierActivations(true)

//game.combat.player.getModifierEffectAttackMap(heal12ForFirst5AttacksEffect).get(attack).get(heal12ForFirst5AttacksEffect).stacks