		const patchSummoningSynergySearch = (patchFlag) => {

			// const bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)
			// const combatRecipes = game.summoning.synergies.filter(x => x.summons[0].skills.some(y => !bannedSkills.includes(y.id)) || x.summons[1].skills.some(y => !bannedSkills.includes(y.id))) // Check neither of the summons are associated with non-combats
			// const combatFamiliars = game.summoning.actions.filter(x => x.skills.some(y => !bannedSkills.includes(y.id)) && x.id !== "melvorTotH:Fox")
			// const combatSynergies = new Map(combatRecipes.map((synergy) => { // Map between combat synergies and their search element
			// 	const searchElement = new SummoningSynergySearch();
			// 	searchElement.className = 'col-12 col-lg-6';
			// 	summoningSearchMenu._content.append(searchElement);
			// 	summoningSearchMenu.visibleSynergies.add(searchElement);
			// 	return [synergy, searchElement];
			// }))

			// // Reset 
			// summoningSearchMenu.visibleSynergies = new Set()
			// summoningSearchMenu.searchElements.forEach((element) => {
			// 	hideElement(element)
			// 	// if (combatSynergies.get(element)) {
			// 	// 	showElement(element);
			// 	// 	summoningSearchMenu.visibleSynergies.add(element);
			// 	// }
			// });

			// combatSynergies.forEach((element) => {
			// 	showElement(element);
			// 	summoningSearchMenu.visibleSynergies.add(element);
			// });

			// // showUnlockedSynergies() { // Reference code
			// // 	this.searchElements.forEach((element, synergy) => {
			// // 		if (game.summoning.isSynergyUnlocked(synergy)) {
			// // 			showElement(element);
			// // 			this.visibleSynergies.add(element);
			// // 		} else {
			// // 			hideElement(element);
			// // 			this.visibleSynergies.delete(element);
			// // 		}
			// // 	}
			// // 	);
			// // }

			// openSynergiesBreakdown
			// openSynergiesBreakdown = () => {
			// 	var _a;
			// 	if (!game.summoning.isUnlocked) {
			// 		lockedSkillAlert(game.summoning, 'SKILL_UNLOCK_OPEN_MENU');
			// 	} else {
			// 		summoningSearchMenu.updateVisibleElementUnlocks();
			// 		summoningSearchMenu.updateVisibleElementQuantities();
			// 		$('#modal-summoning-synergy').modal('show');
			// 		let markToShow;
			// 		if (((_a = game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined) {
			// 			const action = game.openPage.action;
			// 			if (action instanceof Skill)
			// 				markToShow = game.summoning.getMarkForSkill(action);
			// 		}
			// 		if (markToShow !== undefined && game.summoning.getMarkLevel(markToShow) > 0)
			// 			summoningSearchMenu.showSynergiesWithMark(markToShow);
			// 		else
			// 			summoningSearchMenu.showUnlockedSynergies();
			// 	}
			// }


			// // updateFilterOptions() { // Reference code
			// // 	combatFamiliars.forEach((mark)=>{
			// // 		const option = this.filterOptions.get(mark);
			// // 		if (option === undefined)
			// // 			return;
			// // 		const item = mark.product;
			// // 		if (game.summoning.getMarkLevel(mark) > 0) {
			// // 			option.name.textContent = item.name;
			// // 			option.image.src = item.media;
			// // 			option.link.onclick = ()=>this.showSynergiesWithMark(mark);
			// // 		} else {
			// // 			option.name.textContent = getLangString('MENU_TEXT', 'QUESTION_MARKS');
			// // 			option.image.src = cdnMedia('assets/media/main/question.svg');
			// // 			option.link.onclick = null;
			// // 		}
			// // 	}
			// // 	);
			// // }

			// ctx.patch(SynergySearchMenu, "updateSearchArray").replace(function (o) {

			// 	const nonCombatFamiliarLocations = [3, 4, 5, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22, 23]
			// 	document.querySelector("#summoning-synergies-search-cont > synergy-search-menu > div.col-12.col-lg-6.text-right.show > div").children.forEach((x, i) => {
			// 		if (nonCombatFamiliarLocations.includes(i))
			// 			x.classList.add('d-none')
			// 	})

			// 	ctx.patch(Summoning, "updateSearchArray").replace(function (o) {
			// 		if (!summoningButtonValue())
			// 			return o()
			// 		Summoning.searchArray = combatRecipes.map((synergy) => {
			// 			const name1 = synergy.summons[0].product.name;
			// 			const name2 = synergy.summons[1].product.name;
			// 			return {
			// 				synergy,
			// 				description: synergy.description,
			// 				name1,
			// 				name2,
			// 				name1long: templateLangString('MENU_TEXT', 'THE_FAMILIAR', { name: name1 }),
			// 				name2long: templateLangString('MENU_TEXT', 'THE_FAMILIAR', { name: name2 }),
			// 			};
			// 		});
			// 	})
			// })
		}

        
			// ctx.patch(Player, "quickEquipSynergy").before(function (synergy) {
			// 	if (!markButtonValue())
			// 		return

			// 	patchEquipmentQuantity(!atMaxMarkLevel(synergy.summons[0].product), summoningSlots[0])
			// 	patchEquipmentQuantity(!atMaxMarkLevel(synergy.summons[1].product), summoningSlots[1])

			// 	// const mark1 = synergy.summons[0].product;
			// 	// const mark2 = synergy.summons[1].product;

			// 	// if (atMaxMarkLevel(mark1)) equipmentSlotData['Summon1'].allowQuantity = false
			// 	// else equipmentSlotData['Summon1'].allowQuantity = true
			// 	// if (atMaxMarkLevel(mark2)) equipmentSlotData['Summon2'].allowQuantity = false
			// 	// else equipmentSlotData['Summon2'].allowQuantity = true

			// 	return
			// })

			// ctx.patch(Player, "changeEquipmentSet").before(function (setID) {
			// 	if (!markButtonValue())
			// 		return

			// 	patchEquipmentQuantity(!atMaxMarkLevel(this.equipmentSets[setID].equipment.slots.Summon1), summoningSlots[0])
			// 	patchEquipmentQuantity(!atMaxMarkLevel(this.equipmentSets[setID].equipment.slots.Summon2), summoningSlots[1])
			// })