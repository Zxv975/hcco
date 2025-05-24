
// ## Summoning
const patchShopItemsForSummoning = (patchFlag) => {
	let shopMaxCapeItem = Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id === `${ctx.namespace}:Combat_Max_Skillcape`)
	let shopSuperiorMaxCapeItem = Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id === `${ctx.namespace}:Combat_Superior_Max_Skillcape`)
	let shopItemsToModify = [`${ctx.namespace}:Critter_Pack`, `${ctx.namespace}:Companion_Pack`, `${ctx.namespace}:Familiar_Pack`, `${ctx.namespace}:Beast_Pack`]
	if (patchFlag) {
		// Add summoning requirements
		if (!game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).purchaseRequirements.map(x => x.skill.id).includes('melvorD:Summoning')) {
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).purchaseRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 99 });
			game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).equipRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 99 });
		}
		if (!game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).purchaseRequirements.map(x => x.skill.id).includes('melvorD:Summoning')) {
			game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).purchaseRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 120 });
			game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).equipRequirements.push({ "type": "SkillLevel", "skill": game.summoning, "level": 120 });
		}
		// Modify cape stats
		game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).modifiers.increasedSummoningChargePreservation = 0
		game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.increasedSummoningChargePreservation = 0
		game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.increasedSummoningMaxHit = 0

		// Reveal shop requirements
		if (shopMaxCapeItem.length > 0) { // This is false if the item is not in the shop, which shouldn't happen...? But it's good practice I guess
			// Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.remove('d-none'); // Show skill requirement in shop front
			Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes)[shopMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.remove('d-none'); // Repeat of above function to not use .at()
			Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id === 'melvorF:Summoning_Skillcape')[0][1].container.classList.remove('d-none') // Reveal in shop
		}
		if (shopSuperiorMaxCapeItem.length > 0) { // This is false if the item is not in the shop, which shouldn't happen...? But it's good practice I guess
			// Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.remove('d-none');
			Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes)[shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.remove('d-none');// Repeat of above function to not use .at()
			Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id === 'melvorTotH:Superior_Summoning_Skillcape')[0][1].container.classList.remove('d-none')
		}
		// Reveal other shop items

		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (shopItemsToModify.includes(y.item.purchase.id)) y.container.classList.remove('d-none') }))
	} else {
		// Add summoning requirements
		game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`)._purchaseRequirements.set(game.currentGamemode, game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).purchaseRequirements.filter(x => x.skill.id !== "melvorD:Summoning")); // Remove summoning req
		game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`)._purchaseRequirements.set(game.currentGamemode, game.shop.purchases.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).purchaseRequirements.filter(x => x.skill.id !== "melvorD:Summoning"));
		game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).equipRequirements = game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).equipRequirements.filter(x => x.skill.id !== "melvorD:Summoning"); // Remove summoning req
		game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).equipRequirements = game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).equipRequirements.filter(x => x.skill.id !== "melvorD:Summoning");

		// Modify cape stats
		game.items.getObjectByID(`${ctx.namespace}:Combat_Max_Skillcape`).modifiers.increasedSummoningChargePreservation = 10
		game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.increasedSummoningChargePreservation = 15
		game.items.getObjectByID(`${ctx.namespace}:Combat_Superior_Max_Skillcape`).modifiers.increasedSummoningMaxHit = 10
		// Hide shop requirements
		if (shopMaxCapeItem.length > 0) {
			// Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.add('d-none'); // Hide skill req in shop front
			Array.from(shopMaxCapeItem[0][1].item.mediaBody.childNodes)[shopMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.add('d-none'); // Repeat of above function to not use .at()
			Array.from(Array.from(shopMenu.tabs.values())[3]?.menu?.items).filter(x => x[0]?.id === 'melvorF:Summoning_Skillcape')[0][1].container.classList.add('d-none')
		}
		if (shopSuperiorMaxCapeItem.length > 0) {
			// Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes).at(-1).childNodes[8].classList.add('d-none');
			Array.from(shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes)[shopSuperiorMaxCapeItem[0][1].item.mediaBody.childNodes.length - 1].childNodes[8].classList.add('d-none'); // Repeat of above function to not use .at()
			Array.from(Array.from(shopMenu.tabs.values())[8]?.menu?.items).filter(x => x[0]?.id === 'melvorTotH:Superior_Summoning_Skillcape')[0][1].container.classList.add('d-none')
		}
		// Hide other shop items
		shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (shopItemsToModify.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
	}
}
const patchSummoningEquipRequirements = (patchFlag) => {
	if (patchFlag) {
		game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 1 })]
		game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 5 })]
		game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 15 })]
		game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 25 })]
		game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 35 })]
		game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 55 })]
		game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 65 })]
		game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 80 })]
		game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements = [...game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 90 })]
		game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 100 })]
		game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 105 })]
		game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 110 })]
		game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements = [...game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning'), ({ 'type': 'SkillLevel', 'skill': game.summoning, 'level': 115 })]
	} else {
		game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Golbin_Thief").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Occultist").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Wolf").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Minotaur").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Centaur").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Cyclops").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Yak").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Unicorn").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements = game.items.getObjectByID("melvorF:Summoning_Familiar_Dragon").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Lightning_Spirit").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Siren").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spider").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
		game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements = game.items.getObjectByID("melvorTotH:Summoning_Familiar_Spectre").equipRequirements.filter(x => x.skill.id !== 'melvorD:Summoning')
	}
}
const patchSummoningDrops = (patchFlag) => {
	// Bones
	game.dungeons.getObjectByID("melvorTotH:Lightning_Region").dropBones = patchFlag || rebalanceButtonValue()
	game.dungeons.getObjectByID("melvorTotH:Lair_of_the_Spider_Queen").dropBones = patchFlag
	game.dungeons.getObjectByID("melvorTotH:Necromancers_Palace").dropBones = patchFlag
	// Lightning spirit
	patchBoneTable("melvorTotH:LightningSpirit", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 50 })
	patchBoneTable("melvorTotH:LightningMonkey", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 55 })
	patchBoneTable("melvorTotH:LightningGolem", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 60 })
	// Spider familiar
	// patchBoneTable("melvorTotH:RandomSpiderLair", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
	patchBoneTable("melvorTotH:ScouterSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
	patchBoneTable("melvorTotH:TrapperSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
	patchBoneTable("melvorTotH:WickedSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
	patchBoneTable("melvorTotH:BasherSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
	patchBoneTable("melvorTotH:EnforcerSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
	patchBoneTable("melvorTotH:GuardianSpider", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 50 })
	patchBoneTable("melvorTotH:SpiderQueen", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 350 })
	// Necromancer palace
	patchBoneTable("melvorTotH:CursedSkeletonWarrior", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Lightning_Spirit", "quantity": 120 })
	patchBoneTable("melvorTotH:Beholder", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Siren", "quantity": 150 })
	patchBoneTable("melvorTotH:DarkKnight", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spider", "quantity": 200 })
	patchBoneTable("melvorTotH:Fiozor", patchFlag, { "id": "melvorTotH:Summoning_Familiar_Spectre", "quantity": 600 })

	// Monsters
	addToDropTable('melvorF:LotsofEyes', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Golbin_Thief", 'weight': 300, 'minQuantity': 10, 'maxQuantity': 50 }])
	addToDropTable('melvorF:ManyEyedMonster', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Occultist", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Wolf", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }])
	addToDropTable('melvorF:StrangeEyedMonster', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Minotaur", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Witch", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }])
	addToDropTable('melvorF:Eyes', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Centaur", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Cyclops", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }])
	addToDropTable('melvorF:SuperiorEyedMonster', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Yak", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }, { 'id': "melvorF:Summoning_Familiar_Unicorn", 'weight': 600, 'minQuantity': 10, 'maxQuantity': 50 }])
	addToDropTable('melvorF:EyeOfFear', 'monster', patchFlag, [{ 'id': "melvorF:Summoning_Familiar_Dragon", 'weight': 300, 'minQuantity': 10, 'maxQuantity': 50 }])
	addToDropTable('melvorTotH:Siren', 'monster', patchFlag, [{ 'id': "melvorTotH:Summoning_Familiar_Siren", 'weight': 13800, 'minQuantity': 15, 'maxQuantity': 75 }])
	addToDropTable('melvorTotH:Phantom', 'monster', patchFlag, [{ "id": "melvorTotH:Summoning_Familiar_Spectre", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
	addToDropTable('melvorTotH:Banshee', 'monster', patchFlag, [{ "id": "melvorTotH:Summoning_Familiar_Spectre", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
	addToDropTable('melvorTotH:Spectre', 'monster', patchFlag, [{ "id": "melvorTotH:Summoning_Familiar_Spectre", "minQuantity": 250, "maxQuantity": 500, "weight": 20000 }])
	// Cartography additions
	// Eye-conic cave -> Mucky Cave
	addToDropTable('melvorAoD:BlindWarrior', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 20 }])
	addToDropTable('melvorAoD:BlindArcher', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 16 }])
	addToDropTable('melvorAoD:BlindMage', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 16 }])
	addToDropTable('melvorAoD:BlindGhost', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 24 }])
	// Mucky Cave -> Tree Overgrowth
	addToDropTable('melvorAoD:SlimeShooter', 'monster', patchFlag, [{ "id": "melvorAoD:Old_Route_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 1780 }])
	// Tree Overgrowth -> Dark Quarry + Collapsed City
	addToDropTable('melvorAoD:AngryTeak', 'monster', patchFlag, [{ "id": "melvorAoD:Ancient_Stone_Tablet", "minQuantity": 1, "maxQuantity": 1, "weight": 2000 }])
	addToDropTable('melvorAoD:RagingMaple', 'monster', patchFlag, [{ "id": "melvorAoD:Dusty_Book_of_Knowledge", "minQuantity": 1, "maxQuantity": 1, "weight": 2000 }])
	// Dark Quarry -> Collapsed City
	addToDropTable('melvorAoD:MagicGolem', 'monster', patchFlag, [{ "id": "melvorAoD:Navigation_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 2000 }])
	// Collapsed city -> Lost Temple
	addToDropTable('melvorAoD:PoisonBloater', 'monster', patchFlag, [{ "id": "melvorAoD:Torn_Scrolls", "minQuantity": 1, "maxQuantity": 1, "weight": 100 }])
	// Lost Temple -> Ritual Site
	addToDropTable('melvorAoD:PossessedBarrel', 'monster', patchFlag, [{ "id": "melvorAoD:Lost_Cursed_Text", "minQuantity": 1, "maxQuantity": 1, "weight": 200 }])
	// Ritual Site -> Shipwreck Cove
	addToDropTable('melvorAoD:CultMonster', 'monster', patchFlag, [{ "id": "melvorAoD:Misty_Jewel", "minQuantity": 1, "maxQuantity": 1, "weight": 160 }])
	// Cult Grounds -> Underwater Ruins
	addToDropTable('melvorAoD:Ritual_Chest', 'chest', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_1", "minQuantity": 1, "maxQuantity": 1, "weight": 1 }])
	// Shipwreck Cove -> Underwater Ruins
	addToDropTable('melvorAoD:ShipwreckBeast', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_2", "minQuantity": 1, "maxQuantity": 1, "weight": 675 }])
	addToDropTable('melvorAoD:CursedPirateCaptain', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_3", "minQuantity": 1, "maxQuantity": 1, "weight": 150 }])
	// Crystal Depths -> Underwater Ruins
	addToDropTable('melvorAoD:CrystalBehemoth', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_4", "minQuantity": 1, "maxQuantity": 1, "weight": 10 }])
	//Summoning
	addToDropTable('melvorAoD:PoisonLeecher', 'monster', patchFlag, [{ "id": "melvorAoD:Summoning_Familiar_Barrier", "minQuantity": 10, "maxQuantity": 50, "weight": 2030 }])
	addToDropTable('melvorAoD:PoisonRoamer', 'monster', patchFlag, [{ "id": "melvorAoD:Summoning_Familiar_Barrier", "minQuantity": 10, "maxQuantity": 50, "weight": 1080 }])
	addToDropTable('melvorAoD:PoisonSlime', 'monster', patchFlag, [{ "id": "melvorAoD:Summoning_Familiar_Barrier", "minQuantity": 10, "maxQuantity": 50, "weight": 2550 }])
	addToDropTable('melvorAoD:PoisonBloater', 'monster', patchFlag, [{ "id": "melvorAoD:Summoning_Familiar_Barrier", "minQuantity": 10, "maxQuantity": 50, "weight": 2450 }])

	// Secondary modifications to counteract items that were unintentionally nerfed a bit too hard
	modifyDropTable("melvorTotH:Phantom", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Longbow", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
	modifyDropTable("melvorTotH:Spectre", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Greataxe", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
	modifyDropTable("melvorTotH:Banshee", "monster", patchFlag, [{ "id": "melvorTotH:Ethereal_Staff", "minQuantity": 0, "maxQuantity": 0, "weight": 40 }])
}

const patchCartographyEntryRequirements = (patchFlag) => {
	// 5 / 30 / 50 / 65 / 75 / 95 / 100 / 105
	if (patchFlag) {
		// Combat Areas
		game.combatAreas.getObjectByID("melvorAoD:EyeConicCave")._entryRequirements = [{ "level": 5, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }]
		game.combatAreas.getObjectByID("melvorAoD:MuckyCave")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:City_Map"), "type": "ItemFound" },
			{ "level": 30, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
		]
		game.combatAreas.getObjectByID("melvorAoD:TreeOvergrowth")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Old_Route_Chart"), "type": "ItemFound" },
			{ "level": 50, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
		]
		game.combatAreas.getObjectByID("melvorAoD:CollapsedCity")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Dusty_Book_of_Knowledge"), "type": "ItemFound" },
			{ "item": game.items.getObjectByID("melvorAoD:Navigation_Chart"), "type": "ItemFound" },
			{ "level": 65, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
		]
		game.combatAreas.getObjectByID("melvorAoD:LostTemple")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Torn_Scrolls"), "type": "ItemFound" },
			{ "level": 75, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
		]
		game.combatAreas.getObjectByID("melvorAoD:RitualSite")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Lost_Cursed_Text"), "type": "ItemFound" },
			{ "level": 95, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
		]
		game.combatAreas.getObjectByID("melvorAoD:ShipwreckCove")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Misty_Jewel"), "type": "ItemFound" },
			{ "level": 100, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
		]
		game.combatAreas.getObjectByID("melvorAoD:UnderwaterRuins")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_1"), "type": "ItemFound" },
			{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_2"), "type": "ItemFound" },
			{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_3"), "type": "ItemFound" },
			{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_4"), "type": "ItemFound" },
			{ "level": 110, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" }
		]

		// Slayer areas
		game.slayerAreas.getObjectByID("melvorAoD:CrystalCaves")._entryRequirements = [
			{ "level": 50, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" },
			{ "level": 40, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }
		]
		game.slayerAreas.getObjectByID("melvorAoD:DarkQuarry")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Ancient_Stone_Tablet"), "type": "ItemFound" },
			{ "level": 55, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" },
			{ "level": 45, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }
		]
		game.slayerAreas.getObjectByID("melvorAoD:CrystalDepths")._entryRequirements = [
			{ "level": 95, "skill": game.skills.getObjectByID("melvorD:Summoning"), "type": "SkillLevel" },
			{ "level": 85, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }
		]

		// Dungeons
		game.dungeons.getObjectByID("melvorAoD:Underwater_City")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_1"), "type": "ItemFound" },
			{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_2"), "type": "ItemFound" },
			{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_3"), "type": "ItemFound" },
			{ "item": game.items.getObjectByID("melvorAoD:Melantis_Clue_4"), "type": "ItemFound" },
		]
	} else {
		game.combatAreas.getObjectByID("melvorAoD:EyeConicCave")._entryRequirements = [
			{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:EyeConicCave")], "type": "CartographyPOIDiscovery" }
		]
		game.combatAreas.getObjectByID("melvorAoD:MuckyCave")._entryRequirements = [
			{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:MuckyCave")], "type": "CartographyPOIDiscovery" }
		]
		game.combatAreas.getObjectByID("melvorAoD:TreeOvergrowth")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Old_Route_Chart"), "type": "ItemFound" },
		]
		game.combatAreas.getObjectByID("melvorAoD:CollapsedCity")._entryRequirements = [
			{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:GlaciaDungeonRuins")], "type": "CartographyPOIDiscovery" }
		]
		game.combatAreas.getObjectByID("melvorAoD:LostTemple")._entryRequirements = [{ "item": game.items.getObjectByID("melvorAoD:Torn_Scrolls"), "type": "ItemFound" }]
		game.combatAreas.getObjectByID("melvorAoD:RitualSite")._entryRequirements = [{ "item": game.items.getObjectByID("melvorAoD:Lost_Cursed_Text"), "type": "ItemFound" }]
		game.combatAreas.getObjectByID("melvorAoD:ShipwreckCove")._entryRequirements = [{ "item": game.items.getObjectByID("melvorAoD:Misty_Jewel"), "type": "ItemFound" }]
		game.combatAreas.getObjectByID("melvorAoD:UnderwaterRuins")._entryRequirements = [
			{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:Melantis")], "type": "CartographyPOIDiscovery" }
		]

		// Slayer areas
		game.slayerAreas.getObjectByID("melvorAoD:CrystalCaves")._entryRequirements = [{ "level": 40, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }]
		game.slayerAreas.getObjectByID("melvorAoD:DarkQuarry")._entryRequirements = [
			{ "item": game.items.getObjectByID("melvorAoD:Ancient_Stone_Tablet"), "type": "ItemFound" },
			{ "level": 45, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }
		]
		game.slayerAreas.getObjectByID("melvorAoD:CrystalDepths")._entryRequirements = [{ "level": 85, "skill": game.skills.getObjectByID("melvorD:Slayer"), "type": "SkillLevel" }]

		// Dungeons
		game.dungeons.getObjectByID("melvorAoD:Underwater_City")._entryRequirements = [
			{ "worldMap": game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor"), "pois": [game.cartography.worldMaps.getObjectByID("melvorAoD:Melvor").pointsOfInterest.getObjectByID("melvorAoD:Melantis")], "type": "CartographyPOIDiscovery" }
		]
	}
	Object.keys(areaMenus).forEach(areaID => areaMenus[areaID].updateRequirements())
}

const patchSummoningSkillProgress = (patchFlag) => {
	if (patchFlag) {
		document.getElementById("combat-menu-item-6").classList.remove("d-none") // summoning combat menu
		document.getElementById('summoning-row').classList.remove('d-none')
		// Level
		document.querySelector("#combat-skill-progress-menu > table > tbody:nth-child(10) > tr > td:nth-child(2)").appendChild(document.querySelector("#skill-progress-level-melvorD\\:Summoning"))
		document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList)
		document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(1) > span").classList.add('d-none')
		// Xp
		document.querySelector("#combat-skill-progress-menu > table > tbody:nth-child(10) > tr > td.font-w600.font-size-sm.d-none.d-sm-table-cell").appendChild(document.querySelector("#skill-progress-xp-melvorD\\:Summoning"))
		document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList)
		document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(2) > span.font-w600").classList.add('d-none')
		// Progress bar
		document.querySelector("#skill-progress-xp-tooltip-melvorD\\:Summoning").appendChild(document.querySelector("#skill-progress-bar-melvorD\\:Summoning"))

		// Adding these as additional steps well after the fact to not confuse myself lol
		document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML.replace("span", "small")
		document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML.replace("span", "small")
	} else {
		document.getElementById("combat-menu-item-6").classList.add("d-none") // summoning combat menu
		document.getElementById('summoning-row').classList.add('d-none')
		// Level
		document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(1)").appendChild(document.querySelector("#skill-progress-level-melvorD\\:Summoning"))
		document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList)
		document.querySelector("#skill-progress-level-melvorD\\:Summoning").classList.add('p-1', 'bg-success', 'rounded', 'font-w600')
		document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(1) > span").classList.remove('d-none')
		// Xp
		document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(2)").appendChild(document.querySelector("#skill-progress-xp-melvorD\\:Summoning"))
		document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.remove(...document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList)
		document.querySelector("#skill-progress-xp-melvorD\\:Summoning").classList.add('p-1', 'bg-info', 'rounded', 'font-w600')
		document.querySelector("#skill-header-melvorD\\:Summoning > div.block-header.text-center.pt-0.pb-0 > ul > li:nth-child(2) > span.font-w600").classList.remove('d-none')
		//Progress bar
		document.querySelector("#skill-header-melvorD\\:Summoning > div.progress.active.mb-1.border.border-top.border-1x.border-dark").appendChild(document.querySelector("#skill-progress-bar-melvorD\\:Summoning"))

		// Adding these as additional steps well after the fact to not confuse me lol
		document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-xp-melvorD\\:Summoning").outerHTML.replace("small", "span")
		document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML = document.querySelector("#skill-progress-level-melvorD\\:Summoning").outerHTML.replace("small", "span")
	}
}
const patchSkillingFamiliars = (patchFlag) => {
	if (patchFlag) {
		// console.log(document.querySelector("#mark-discovery-elements").childNodes)
		const bannedSkills = game.skills.filter(x => !x.isCombat || x.id === 'melvorD:Summoning').map(x => x.id)
		markDiscoveryMenus.forEach((v, k) => {
			if (k.skills.some(y => bannedSkills.includes(y.id)))
				v.classList.add('d-none')
		})
	} else {
		document.querySelector("#mark-discovery-elements").childNodes.forEach(x => x?.classList?.remove('d-none'))
	}
}

ctx.patch(CombatManager, "getMonsterDropsHTML").replace(function (o, monster, respectArea) {
	if (!(coGamemodeCheck() || !dropsButtonValue()))
		return o(monster, respectArea)

	const simplify = (numerator, denominator) => {
		var gcd = function gcd(a, b) {
			return b ? gcd(b, a % b) : a;
		};
		gcd = gcd(numerator, denominator);
		return `${numerator / gcd}/${denominator / gcd}`;
	}

	let drops = '';
	const localeSettings = {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	};
	if (monster.lootTable.size > 1 && !(respectArea && this.areaType === CombatAreaType.Dungeon)) { // Modified "lootTable.size > 0" to be "lootTable.size > 1" because I'm adding an empty drop to every drop table, and removed lootChance
		drops = monster.lootTable.sortedDropsArray.map((drop) => {
			let dropText = ``
			if (drop.minQuantity === drop.maxQuantity) dropText += `${numberWithCommas(drop.maxQuantity)}`
			else dropText += `(${numberWithCommas(drop.minQuantity)} – ${numberWithCommas(drop.maxQuantity)})`
			dropText += ` × <img class="skill-icon-xs mr-2" src="${drop.item.media}">${drop.item.name}`
			dropText += ` <b style='color: rgb(255, 204, 0)'>[${(100 * drop.weight / monster.lootTable.weight).toLocaleString(undefined, localeSettings)}%]</b> <b style='color: rgb(255, 204, 0)'>[${simplify(drop.weight, monster.lootTable.weight)}]</b>`;
			return dropText;
		}
		).join('<br>');
	}
	let bones = '';
	const dropsBones = monster.bones !== undefined && !(respectArea && this.selectedArea instanceof Dungeon && !this.selectedArea.dropBones);
	const dropsBarrierDust = monster.hasBarrier;
	if (dropsBarrierDust || dropsBones) {
		bones = `${getLangString('MISC_STRING_7')}`;
		if (dropsBones && monster.bones !== undefined) {
			bones += `<br><img class="skill-icon-xs mr-2" src="${monster.bones.item.media}">${monster.bones.item.name}`;
		}
		if (dropsBarrierDust) {
			const barrierDustItem = this.game.items.getObjectByID("melvorAoD:Barrier_Dust");
			if (barrierDustItem !== undefined) {
				bones += `<br><img class="skill-icon-xs mr-2" src="${barrierDustItem.media}">${barrierDustItem.name}`;
			}
		}
		bones += `<br><br>`;
	} else {
		bones = getLangString('COMBAT_MISC_107') + '<br><br>';
	}
	let html = `<span class="text-dark">${bones}<br>`;
	if (drops !== '') {
		html += `${getLangString('MISC_STRING_8')}<br><small>${getLangString('MISC_STRING_9')}</small><br>${drops}`;
	}
	html += '</span>';
	return html;
})
viewItemContents = function (item) {
	const dropsOrdered = item.dropTable.sortedDropsArray;
	const simplify = (numerator, denominator) => {
		var gcd = function gcd(a, b) {
			return b ? gcd(b, a % b) : a;
		};
		gcd = gcd(numerator, denominator);
		return `${numerator / gcd}/${denominator / gcd}`;
	}

	const localeSettings = {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	};
	let drops
	if (!(coGamemodeCheck() || dropsButtonValue())) { // Default functionality
		drops = dropsOrdered.map((drop) => {
			return templateString(getLangString('BANK_STRING_40'), {
				qty: `${numberWithCommas(drop.maxQuantity)}`,
				itemImage: `<img class="skill-icon-xs mr-2" src="${drop.item.media}">`,
				itemName: drop.item.name,
			});
		}).join('<br>');
		SwalLocale.fire({
			title: item.name,
			html: getLangString('BANK_STRING_39') + '<br><small>' + drops,
			imageUrl: item.media,
			imageWidth: 64,
			imageHeight: 64,
			imageAlt: item.name,
			showCancelButton: true
		})
	} else {
		drops = dropsOrdered.map((drop) => {
			let dropText = ``
			if (drop.minQuantity === drop.maxQuantity) dropText += `${numberWithCommas(drop.maxQuantity)}`
			else dropText += `(${numberWithCommas(drop.minQuantity)} – ${numberWithCommas(drop.maxQuantity)})`
			dropText += ` × <img class="skill-icon-xs mr-2" src="${drop.item.media}">${drop.item.name}`
			dropText += ` <b style='color: rgb(255, 204, 0)'>[${(100 * drop.weight / item.dropTable.weight).toLocaleString(undefined, localeSettings)}%]</b> <b style='color: rgb(255, 204, 0)'>[${simplify(drop.weight, item.dropTable.weight)}]</b>`;
			return dropText;
		}).join('<br>');
		SwalLocale.fire({
			title: item.name,
			html: getLangString('BANK_STRING_39') + '<br><small>' + drops,
			imageUrl: item.media,
			imageWidth: 64,
			imageHeight: 64,
			imageAlt: item.name,
		})
	}
}


const togglePetMarkUnlockRequirements = (patchFlag) => { game.pets.getObjectByID('melvorF:Mark').isCO = patchFlag }
const coSummoningPatch = (patchFlag) => {
	if (!coGamemodeCheck())
		return

	// Called in onCharacterLoaded
	patchSummoningDrops(patchFlag)
	patchShopItemsForSummoning(patchFlag)
	patchSummoningEquipRequirements(patchFlag)
	patchSkill(patchFlag, 'melvorD:Summoning', 'Non-Combat')

	// Called in onInterfaceReady
	patchSummoningSkillProgress(patchFlag)
	togglePetMarkUnlockRequirements(patchFlag)
	patchSkillingFamiliars(patchFlag)
	patchCartographyEntryRequirements(patchFlag)

	// patchSkill(patchFlag, 'melvorD:Summoning', 'Combat', 'Non-Combat')
	// unlockSkill(patchFlag, 'melvorD:Summoning', "Non-Combat")
	// makeSkillCombatOnly(patchFlag, 'melvorD:Summoning', 'Non-Combat')
	// moveSkillSidebarToCategoryFromCategory(patchFlag, 'melvorD:Summoning', 'Combat', 'Non-Combat')
	// patchSidebar(patchFlag, "melvorD:Summoning", "Non-Combat")
	// patchSynergySearch(patchFlag)
}


