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

	SummoningHTMLModifications = () => {
		document.querySelectorAll(`[lang-id=MENU_TEXT_CREATE_FAMILIAR`).forEach(x => x?.parentElement?.parentElement?.classList?.add('d-none')) // Hide all "create tablet" elements on each of the summoning marks
	}

	// #endregion HTML_changes

	// #region Marks
	PatchMarkMechanics = (ctx) => {
		Object.defineProperty(Summoning, 'markLevels', { // Add 7th mark level
			get: () => { return [1, 6, 16, 31, 46, 61, 121] }
		});
		game.summoning.recipesByProduct.forEach(x => x.maxMarkLevel = x.realm.id == "melvorD:Melvor" ? 7 : 5)
		ctx.patch(Player, "removeSummonCharge").replace(function (o, slotID, interval) {
			const item = this.equipment.getItemInSlot(slotID);
			if (this.game.summoning.getMarkLevel(item) >= Summoning.markLevels.length - 1) { }
			else { return o(slotID, interval); }
		})
		ctx.patch(Summoning, "getChanceForMark").replace(function (o, mark, skill, modifiedInterval) { // Only allow obtaining marks if summon equipped
			let equippedModifier = 2;
			if (!this.game.combat.player.equipment.checkForItem(mark.product))
				equippedModifier = 0
			return (equippedModifier * modifiedInterval) / (2000 * Math.pow(mark.tier + 1, 2));
		})
	}
	// #endregion Marks

	// #region misc

	PatchSkillingFamiliars = () => {
		const bannedSkills = game.skills.filter(x => !x.isCombat || x.id === 'melvorD:Summoning').map(x => x.id)
		markDiscoveryMenus.forEach((v, k) => {
			if (k.skills.some(y => bannedSkills.includes(y.id)))
				v.classList.add('d-none')
		})
	}

	MakeSummoningPetCO = () => {
		game.pets.getObjectByID('melvorF:Mark').isHCCOv2 = true
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