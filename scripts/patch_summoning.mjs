

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
			
			if (atMaxMarkLevel(mark)) { } // Do nothing at max level
			else { return o(slotID, interval) }
		})
		ctx.patch(Summoning, "getChanceForMark").before(function (mark, skill, modifiedInterval) { // Experimental approach
			if (!this.game.combat.player.equipment.checkForItem(mark.product))
				return [mark, skill, 0];
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

	MakeSummoningPetCO = (IS_CO_FLAG) => {
		game.pets.getObjectByID('melvorF:Mark')[IS_CO_FLAG] = true
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