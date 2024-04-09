const patchMonsterDrops = (patchFlag) => {
	// Bones
	patchBoneTable("melvorTotH:RaZu", patchFlag, { "id": "melvorTotH:Lightning_Rune", "quantity": 1500 })

	// Chests
	patchDropTable("melvorTotH:Ancient_Chest", "chest", patchFlag, [{ 'id': "melvorTotH:Carrion_Bark", "weight": 14 }, { "id": "melvorTotH:Jungle_Spores", 'weight': 5 }], [{ 'id': "melvorTotH:Linden_Logs", 'weight': 19, 'minQuantity': 150, 'maxQuantity': 300 }])
	patchDropTable("melvorTotH:Burning_Chest", "chest", patchFlag, [{ 'id': "melvorTotH:Infernal_Bones", "weight": 10 }, { "id": "melvorTotH:Charcoal", 'weight': 6 }, { "id": "melvorF:Ash", 'weight': 6 }], [{ 'id': "melvorTotH:Palladium_Bar", 'weight': 22, 'minQuantity': 100, 'maxQuantity': 200 }])
	patchDropTable('melvorD:Magic_Chest', 'chest', patchFlag, [
		{ 'id': "melvorD:Air_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
		{ 'id': "melvorD:Water_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
		{ 'id': "melvorD:Earth_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
		{ 'id': "melvorD:Fire_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
		{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
		{ 'id': "melvorD:Death_Rune", 'minQuantity': 400, 'maxQuantity': 800 },
		{ 'id': "melvorD:Ancient_Rune", 'minQuantity': 500, 'maxQuantity': 1500 }
	], [])
	patchDropTable("melvorF:Miolite_Chest", "chest", patchFlag, [
		{ 'id': "melvorF:Miolite_Boots", 'weight': 47 },
		{ "id": "melvorF:Miolite_Helmet", "weight": 23 },
		{ "id": "melvorF:Miolite_Shield", "weight": 7 },
		{ "id": "melvorF:Miolite_Spore", "weight": 6 },
		{ "id": "melvorF:Miolite_Platelegs", "weight": 5 },
		{ "id": "melvorF:Miolite_Platebody", "weight": 2 }
	], [
		{ 'id': "melvorD:Mist_Rune", 'weight': 20, 'minQuantity': 200, 'maxQuantity': 400 },
		{ "id": "melvorD:Dust_Rune", "weight": 20, "minQuantity": 200, "maxQuantity": 400 },
		{ "id": "melvorF:Mud_Rune", "weight": 20, "minQuantity": 200, "maxQuantity": 400 },
		{ "id": "melvorD:Smoke_Rune", "weight": 10, "minQuantity": 200, "maxQuantity": 400 },
		{ "id": "melvorF:Steam_Rune", "weight": 10, "minQuantity": 200, "maxQuantity": 400 },
		{ "id": "melvorF:Lava_Rune", "weight": 10, "minQuantity": 200, "maxQuantity": 400 }
	])
	patchDropTable('melvorF:Water_Chest', 'chest', patchFlag, [
		{ 'id': "melvorD:Death_Rune", 'minQuantity': 500, 'maxQuantity': 1000 },
		{ 'id': "melvorD:Blood_Rune", 'minQuantity': 500, 'maxQuantity': 1000 },
		{ 'id': "melvorD:Ancient_Rune", 'minQuantity': 500, 'maxQuantity': 1000 }
	], [])

	// Monsters
	patchDropTable("melvorTotH:BurningSnake", "monster", patchFlag, [{ 'id': "melvorTotH:Chilli_Seeds", "weight": 4 }], [
		{ "id": "melvorTotH:Divine_Helmet", "weight": 4, "minQuantity": 1, "maxQuantity": 1 }
	])
	patchDropTable('melvorTotH:InfernalGolem', 'monster', patchFlag,
		[{ 'id': "melvorTotH:Infernal_Rune", 'minQuantity': 25, 'maxQuantity': 35 }, { "id": "melvorTotH:Iridium_Ore", "weight": 58 }],
		[{ "id": "melvorTotH:Iridium_Bar", "minQuantity": 10, "maxQuantity": 25, "weight": 50 }, { "id": "melvorTotH:Divine_Boots", "weight": 8, "minQuantity": 1, "maxQuantity": 1 },]
	)
	patchDropTable('melvorTotH:MagicFireDemon', 'monster', patchFlag,
		[{ 'id': "melvorD:Fire_Rune", 'minQuantity': 10, 'maxQuantity': 30, "weight": 2 }, { 'id': "melvorF:Lava_Rune", 'minQuantity': 20, 'maxQuantity': 50, 'weight': 1 }],
		[{ "id": "melvorTotH:Divine_Shield", "weight": 3, "minQuantity": 1, "maxQuantity": 1 }]
	)
	patchDropTable('melvorTotH:Manticore', 'monster', patchFlag, [{ 'id': "melvorTotH:Palladium_Ore", "weight": 1 }], [{ "id": "melvorTotH:Divine_Platelegs", "weight": 1, "minQuantity": 1, "maxQuantity": 1 }])
	patchDropTable('melvorTotH:GretYun', 'monster', patchFlag, [{ 'id': "melvorTotH:Infernal_Rune", 'minQuantity': 20, 'maxQuantity': 50 }, { 'id': "melvorD:Dragon_Bones", 'weight': 1 }], [{ "id": "melvorTotH:Divine_Platebody", "weight": 1, "minQuantity": 1, "maxQuantity": 1 }])

	// patchDropTable("melvorTotH:PoisonToad", "monster", patchFlag, [{ 'id': "melvorTotH:Bitterlyme_Seeds", "weight": 200 }], [{ 'id': "melvorTotH:Poison_Rune", 'weight': 200, 'minQuantity': 20, 'maxQuantity': 60 }])
	addToDropTableWithEmptySpace("melvorTotH:PoisonToad", patchFlag, { "id": "melvorTotH:Poison_Rune", "minQuantity": 20, "maxQuantity": 60, "lootWeight": 30 })

	patchDropTable("melvorTotH:FrostGolem", "monster", patchFlag, [{ 'id': "melvorD:Water_Rune", "weight": 49, 'minQuantity': 35, 'maxQuantity': 80 }], [{ 'id': "melvorTotH:Archaic_Rune", 'weight': 49, 'minQuantity': 35, 'maxQuantity': 80 }])
	patchDropTable('melvorD:Wizard', 'monster', patchFlag, [
		{ 'id': "melvorD:Air_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
		{ 'id': "melvorD:Water_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
		{ 'id': "melvorD:Earth_Rune", 'minQuantity': 10, 'maxQuantity': 30 },
		{ 'id': "melvorD:Fire_Rune", 'minQuantity': 10, 'maxQuantity': 30 }
	], [])
	patchDropTable('melvorF:Priest', 'monster', patchFlag, [{ 'id': "melvorD:Light_Rune", 'minQuantity': 10, 'maxQuantity': 30, "weight": 5 }], [{ 'id': "melvorF:Prayer_Scroll", 'minQuantity': 1000, 'maxQuantity': 1500, "weight": 5 }])
	patchDropTable('melvorD:DarkWizard', 'monster', patchFlag, [
		{ 'id': "melvorD:Enchanted_Shield", "weight": 5 },
		{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 15, 'maxQuantity': 40 },
		{ 'id': "melvorD:Death_Rune", 'minQuantity': 15, 'maxQuantity': 40 }
	], [{ 'id': "melvorF:Wizards_Scroll", 'minQuantity': 1000, 'maxQuantity': 1500, "weight": 5 }])

	patchDropTable('melvorD:MasterWizard', 'monster', patchFlag, [{ 'id': "melvorD:Mind_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
	patchDropTable('melvorTotH:IceHydra', 'monster', patchFlag, [{ 'id': "melvorTotH:Calamity_Rune", 'minQuantity': 100, 'maxQuantity': 200 }], [])
	patchDropTable('melvorTotH:Siren', 'monster', patchFlag, [{ 'id': "melvorTotH:Despair_Rune", 'minQuantity': 15, 'maxQuantity': 30, "weight": 0 }], [])
	patchDropTable('melvorTotH:PolarBear', 'monster', patchFlag, [{ 'id': "melvorTotH:Frost_Crab", 'minQuantity': 50, 'maxQuantity': 80 }, { 'id': "melvorTotH:Frozen_Manta_Ray", 'minQuantity': 150, 'maxQuantity': 300 }], [])
	patchDropTable('melvorTotH:Cockatrice', 'monster', patchFlag, [{ 'id': "melvorTotH:Decay_Bolts", 'minQuantity': 25, 'maxQuantity': 100 }], [])
	patchDropTable('melvorTotH:PlagueDoctor', 'monster', patchFlag, [
		{ 'id': "melvorF:Hinder_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
		{ 'id': "melvorF:Lethal_Toxins_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
		{ 'id': "melvorTotH:Area_Control_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
		{ 'id': "melvorTotH:Reaper_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
		{ 'id': "melvorF:Famished_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 },
		{ 'id': "melvorTotH:Penetration_Potion_III", 'minQuantity': 1, 'maxQuantity': 5 }
	], [])

	patchDropTable('melvorF:Vampire', 'monster', patchFlag, [
		{ 'id': "melvorD:Air_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
		{ 'id': "melvorD:Water_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
		{ 'id': "melvorD:Earth_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
		{ 'id': "melvorD:Fire_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
		{ 'id': "melvorD:Mind_Rune", 'minQuantity': 5, 'maxQuantity': 10 },
		{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 3, 'maxQuantity': 6 },
		{ 'id': "melvorD:Death_Rune", 'minQuantity': 2, 'maxQuantity': 4 }
	], [])
	patchDropTable('melvorF:Shaman', 'monster', patchFlag, [{ 'id': "melvorD:Chaos_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
	patchDropTable('melvorF:Necromancer', 'monster', patchFlag, [{ 'id': "melvorD:Death_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])
	patchDropTable('melvorF:Elementalist', 'monster', patchFlag, [{ 'id': "melvorF:Havoc_Rune", 'minQuantity': 5, 'maxQuantity': 15 }], [])

	// Soul runes
	const moonwortSeeds = { "id": "melvorTotH:Moonwort_Seeds", "weight": 200 }
	const soulRune = { "id": "melvorTotH:Soul_Rune", "minQuantity": 250, "maxQuantity": 500, "weight": 200 }
	patchDropTable("melvorTotH:Phantom", "monster", patchFlag, [moonwortSeeds], [soulRune])
	patchDropTable("melvorTotH:Spectre", "monster", patchFlag, [moonwortSeeds], [soulRune])

	patchDropTable("melvorTotH:Banshee", "monster", patchFlag, [moonwortSeeds], [soulRune])

	// Absorbing shield

	// addToDropTableWithEmptySpace("melvorF:Valkyrie", patchFlag, { "id": "melvorF:Absorbing_Shield", "minQuantity": 1, "maxQuantity": 1, "weight": 0.01 })
	addToDropTableWithEmptySpace("melvorF:Valkyrie", patchFlag, { "id": "melvorF:Absorbing_Shield", "minQuantity": 1, "maxQuantity": 1, "lootWeight": 1 })


	// patchDropTable("melvorF:Valkyrie", "monster", patchFlag, [], [{ 'id': "melvorF:Absorbing_Shield", 'weight': 1, 'minQuantity': 1, 'maxQuantity': 1 }], true)
	// if (patchFlag) {
	// 	game.monsters.getObjectByID('melvorF:Valkyrie').lootTable.totalWeight = 6
	// 	game.monsters.getObjectByID('melvorF:Valkyrie').lootChance = 6
	// } else {
	// 	game.monsters.getObjectByID('melvorF:Valkyrie').lootTable.totalWeight = 5
	// 	game.monsters.getObjectByID('melvorF:Valkyrie').lootChance = 5
	// }

	// Golbin drop table for shrimp
	patchDropTable("melvorD:Golbin", "monster", patchFlag, [{ 'id': "melvorD:Raw_Shrimp", "weight": 1 }], [{ 'id': "melvorD:Shrimp", 'weight': 1, 'minQuantity': 1, 'maxQuantity': 1 }])

	// GCM
	// if (patchFlag) {
	// 	game.monsters.getObjectByID('melvorTotH:Torvair').lootTable.totalWeight = 20
	// 	game.monsters.getObjectByID('melvorTotH:Torvair').lootChance = 100
	// 	game.monsters.getObjectByID('melvorTotH:Arctair').lootTable.totalWeight = 20
	// 	game.monsters.getObjectByID('melvorTotH:Arctair').lootChance = 100
	// 	game.monsters.getObjectByID('melvorTotH:Harkair').lootTable.totalWeight = 20
	// 	game.monsters.getObjectByID('melvorTotH:Harkair').lootChance = 100
	// } else {
	// 	game.monsters.getObjectByID('melvorTotH:Torvair').lootTable.totalWeight = 1
	// 	game.monsters.getObjectByID('melvorTotH:Torvair').lootChance = 5
	// 	game.monsters.getObjectByID('melvorTotH:Arctair').lootTable.totalWeight = 1
	// 	game.monsters.getObjectByID('melvorTotH:Arctair').lootChance = 5
	// 	game.monsters.getObjectByID('melvorTotH:Harkair').lootTable.totalWeight = 1
	// 	game.monsters.getObjectByID('melvorTotH:Harkair').lootChance = 5
	// }
	// patchDropTable("melvorTotH:Torvair", "monster", patchFlag, [], [{ 'id': "melvorF:Damage_Reduction_Potion_III", 'weight': 19, 'minQuantity': 5, 'maxQuantity': 10 }], true)
	// patchDropTable("melvorTotH:Arctair", "monster", patchFlag, [], [{ 'id': "melvorF:Damage_Reduction_Potion_III", 'weight': 19, 'minQuantity': 5, 'maxQuantity': 10 }], true)
	// patchDropTable("melvorTotH:Harkair", "monster", patchFlag, [], [{ 'id': "melvorF:Damage_Reduction_Potion_III", 'weight': 19, 'minQuantity': 5, 'maxQuantity': 10 }], true)
}

const addToDropTableWithEmptySpace = (monsterID, patchFlag, itemToAdd) => {
	// lootWeight is always given as a whole number percentage, as that's how lootChance is defined. This means it has a minimum of 1% drop rate. Might fix in future but oh well.
	/* 	
		n = game.monsters.getObjectByID(monsterID).lootChance
		v = itemToAdd.lootWeight
		T = game.monsters.getObjectByID(monsterID).lootTable.totalWeight
		w = game.monsters.getObjectByID(monsterID).lootTable.drops.map(drop => drop.weight)
		x = Tv/n
	*/
	let oldItemsToPatch = game.monsters.getObjectByID(monsterID).lootTable.drops.map(drop => ({ "id": drop.item.id, "weight": -drop.weight })) // This line is wrong. Need to get -95 from 100
	const totalWeight = game.monsters.getObjectByID(monsterID).lootTable.totalWeight // T
	const tableChance = game.monsters.getObjectByID(monsterID).lootChance // n
	let adjustedDropRate = totalWeight * itemToAdd.lootWeight / tableChance // x = Tv/n

	if (!Number.isInteger(adjustedDropRate)) { // Keep things as integers (not fractions) by multiplying a common denominator through everything if necessary
		oldItemsToPatch = game.monsters.getObjectByID(monsterID).lootTable.drops.map(drop => ({ "id": drop.item.id, "weight": -(tableChance * drop.weight - drop.weight) })) // Trying an additive method for manipulating weights
		// w = (w1, w2, ..., x)
		// If x is non-integer, substitute w' -> nw' = (nw1, nw2, ..., nx). This gives T' -> nT' which cancels out in nw'/nT' = w'/T'
		adjustedDropRate *= tableChance
	}
	// console.log(adjustedDropRate, "inside empty space, after")
	patchDropTable(monsterID, "monster", patchFlag, oldItemsToPatch, [{ ...itemToAdd, "weight": adjustedDropRate }], true, itemToAdd.lootWeight)
}


const gcd = function (a, b) { return b ? gcd(b, a % b) : a }
const gcdArray = (arr) => arr.reduce((a, c) => gcd(a, c), 0) // 0 is the identity for the gcd function

const gcd = function (a, b) { return b ? gcd(b, a % b) : a }
const gcdArray = (arr) => arr.reduce((a, c) => gcd(a, c), 0) // 0 is the identity for the gcd function
const simplify = (numerators, denominator) => {
	gcd = gcdArray([...numerators, denominator]);
	return `${numerator / gcd}/${denominator / gcd}`;
}

// const rationalise = (x) => {
// 	let len = x.toString().length - 2;

// 	let denominator = Math.pow(10, len);
// 	let numerator = x * denominator;
// 	let divisor = gcd(numerator, denominator);

// 	return [numerator / divisor, denominator / divisor]
// }

		// Cartography additions
		// Eye-conic cave -> Mucky Cave
		addToDropTable('melvorAoD:BlindWarrior', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 3 }])
		addToDropTable('melvorAoD:BlindArcher', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 3 }])
		addToDropTable('melvorAoD:BlindMage', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 3 }])
		addToDropTable('melvorAoD:BlindGhost', 'monster', patchFlag, [{ "id": "melvorAoD:City_Map", "minQuantity": 1, "maxQuantity": 1, "weight": 3 }])
		// Mucky Cave -> Tree Overgrowth
		addToDropTable('melvorAoD:SlimeShooter', 'monster', patchFlag, [{ "id": "melvorAoD:Old_Route_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 5 }])
		// Tree Overgrowth -> Dark Quarry + Collapsed City
		addToDropTable('melvorAoD:AngryTeak', 'monster', patchFlag, [{ "id": "melvorAoD:Ancient_Stone_Tablet", "minQuantity": 1, "maxQuantity": 1, "weight": 20 }])
		addToDropTable('melvorAoD:RagingMaple', 'monster', patchFlag, [{ "id": "melvorAoD:Dusty_Book_of_Knowledge", "minQuantity": 1, "maxQuantity": 1, "weight": 20 }])
		// Dark Quarry -> Collapsed City
		addToDropTable('melvorAoD:MagicGolem', 'monster', patchFlag, [{ "id": "melvorAoD:Navigation_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 20 }])
		// Collapsed city -> Lost Temple
		addToDropTable('melvorAoD:PoisonBloater', 'monster', patchFlag, [{ "id": "melvorAoD:Torn_Scrolls", "minQuantity": 1, "maxQuantity": 1, "weight": 2 }])
		// Lost Temple -> Ritual Site
		addToDropTable('melvorAoD:PossessedBarrel', 'monster', patchFlag, [{ "id": "melvorAoD:Lost_Cursed_Text", "minQuantity": 1, "maxQuantity": 1, "weight": 1 }])
		// Ritual Site -> Shipwreck Cove
		addToDropTable('melvorAoD:CultMonster', 'monster', patchFlag, [{ "id": "melvorAoD:Misty_Jewel", "minQuantity": 1, "maxQuantity": 1, "weight": 1 }])
		// Cult Grounds -> Underwater Ruins
		addToDropTable('melvorAoD:Ritual_Chest', 'chest', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_1", "minQuantity": 1, "maxQuantity": 1, "weight": 2 }])
		// Shipwreck Cove -> Underwater Ruins
		addToDropTable('melvorAoD:ShipwreckBeast', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_2", "minQuantity": 1, "maxQuantity": 1, "weight": 1 }])
		addToDropTable('melvorAoD:CursedPirateCaptain', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_3", "minQuantity": 1, "maxQuantity": 1, "weight": 1 }])
		// Crystal Depths -> Underwater Ruins
		addToDropTable('melvorAoD:CrystalBehemoth', 'monster', patchFlag, [{ "id": "melvorAoD:Melantis_Clue_4", "minQuantity": 1, "maxQuantity": 1, "weight": 1 }])