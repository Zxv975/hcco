export class PatchCombat {
	PatchHitpointsUntilDW(ctx) {
		ctx.patch(Hitpoints, 'maxLevelCap').get((o) => {
			if (game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Umbora")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Rokken")) + game.stats.monsterKillCount(game.monsters.getObjectByID("melvorF:Kutul")) >= 10000)
				return cloudManager.hasTotHEntitlement ? 120 : 99;
			else
				return 99;
		})
	}

	PatchSpellCosts(ctx) {
		ctx.patch(Player, 'getRuneCosts').replace(function (o, spell) {
			let runeCost = spell.runesRequired;
			const spellCost = [];
			if (this.useCombinationRunes && spell.runesRequiredAlt !== undefined)
				runeCost = spell.runesRequiredAlt;
			let flatModifier = 0;
			if (spell instanceof AttackSpell) {
				flatModifier += this.modifiers.getValue("melvorD:flatAttackSpellRuneCost", spell.modQuery);
			}
			runeCost.forEach((cost) => {
				var _a;
				let modifiedQuantity = cost.quantity - ((_a = this.runesProvided.get(cost.item)) !== null && _a !== void 0 ? _a : 0) + flatModifier;
				modifiedQuantity += this.modifiers.getValue("melvorD:flatSpellRuneCost", cost.item.modQuery);
				// modifiedQuantity = Math.max(0, modifiedQuantity); // Removed check
				if (modifiedQuantity > 0) // Only add spell costs that are above 0
					spellCost.push({
						item: cost.item,
						quantity: modifiedQuantity,
					});
			});
			return spellCost;
		});
	}
}