


	patchChestDropTable("melvorTotH:Ancient_Chest", [{
		"item": game.items.getObjectByID("melvorTotH:Carrion_Bark"),
		"weight": 14
	}, {
		"item": game.items.getObjectByID("melvorTotH:Jungle_Spores"),
		"weight": 5
	}], [{
		"item": game.items.getObjectByID("melvorTotH:Linden_Logs"),
		"minQuantity": 100,
		"maxQuantity": 250,
		"weight": 19
	}])


	patchMonsterDropTable(monsterID, itemsToReduce, itemIDsToAdd) {
		game.monsters.getObjectByID(monsterID).dropTable.drops.forEach(x => {
			if (itemsToReduce.map(x => x.id).includes(x.item.id))
				x.weight -= itemsToReduce.weight
		}
	patchDungeonBoneTable(monsterID, itemsToReduce, itemIDsToAdd) {
			game.items.getObjectByID(monsterID).dropTable.drops.forEach(x => {
				if (itemsToReduce.map(x => x.id).includes(x.item.id))
					x.weight -= itemsToReduce.weight
			}

	game.monsters.getObjectByID("melvorTotH:LightningSpirit").bones = { "item": game.items.getObjectByID("melvorTotH:Lightning_Rune"), "quantity": 21 }
	game.monsters.getObjectByID("melvorTotH:LightningMonkey").bones = { "item": game.items.getObjectByID("melvorTotH:Lightning_Rune"), "quantity": 30 }
	game.monsters.getObjectByID("melvorTotH:LightningGolem").bones = { "item": game.items.getObjectByID("melvorTotH:Lightning_Rune"), "quantity": 23 }
	game.monsters.getObjectByID("melvorTotH:RaZu").bones = { "item": game.items.getObjectByID("melvorTotH:Lightning_Rune"), "quantity": 700 }
	game.dungeons.getObjectByID("melvorTotH:Lightning_Region").dropBones = true

	patchAllDrops = () => {
					game.items.getObjectByID("melvorTotH:Ancient_Chest").dropTable.drops.forEach(x => {
						switch (x.item.id) {
							case "melvorTotH:Carrion_Bark":
								x.weight = 46 // Reduce Carrion Bark drop rate by 14/133 from 60/133 to 46/133
								break;
							case "melvorTotH:Jungle_Spores":
								x.weight = 15 // Reduce Jungle spores drop rate by 5/133 from 20/133 to 15/133
								break;
							default:
						}
					})
					game.items.getObjectByID("melvorTotH:Ancient_Chest").dropTable.drops.push({
						"item": game.items.getObjectByID("melvorTotH:Linden_Logs"), // Add Linden Logs to the drop table at a rate of 19/133, which is the total the other items were reduced by
						"minQuantity": 100,
						"maxQuantity": 250,
						"weight": 19
					})
					game.items.getObjectByID("melvorTotH:Burning_Chest").dropTable.drops.forEach(x => {
						switch (x.item.id) {
							case "melvorTotH:Infernal_Bones":
								x.weight = 20 // Reduce Infernal bones drop rate by 5/41 from 15/41 to 10/41
								break;
							case "melvorF:Ash":
								x.weight = 14 // Reduce Ash drop rate by 3/41 from 10/41 to 7/41
								break;
							case "melvorTotH:Charcoal":
								x.weight = 14 // Reduce Charcoal drop rate by 3/41 from 10/41 to 7/41
								break;
							default:
						}
					})
					game.items.getObjectByID("melvorTotH:Burning_Chest").dropTable.drops.push({
						"item": game.items.getObjectByID("melvorTotH:Palladium_Bar"), // Add Palladium bars to the drop table at a rate of 11/41, which is the total the other items were reduced by
						"minQuantity": 1,
						"maxQuantity": 100,
						"weight": 22
					})

					// game.items.getObjectByID("melvorTotH:Static_Chest").dropTable.drops.forEach(x => {
					// 	switch (x.item.id) {
					// 		case "melvorTotH:Lightning_Amulet":
					// 			x.weight = 19 
					// 			break;
					// 		case "melvorF:Lightning_Boots":
					// 			x.weight = 19 
					// 			break;
					// 		default:
					// 	}
					// })
					// game.items.getObjectByID("melvorTotH:Static_Chest").dropTable.drops.push({
					// 	"item": game.items.getObjectByID("melvorTotH:Lightning_Rune"), 
					// 	"minQuantity": 1,
					// 	"maxQuantity": 1000,
					// 	"weight": 2
					// })




					// game.monsters.getObjectByID("melvorTotH:BurningSnake").bones = {"item": game.items.getObjectByID("melvorTotH:Infernal_Rune"), "quantity": 10}
					// game.monsters.getObjectByID("melvorTotH:InfernalGolem").bones = {"item": game.items.getObjectByID("melvorTotH:Infernal_Rune"), "quantity": 15}
					// game.monsters.getObjectByID("melvorTotH:MagicFireDemon").bones = {"item": game.items.getObjectByID("melvorTotH:Infernal_Rune"), "quantity": 80}
					// game.monsters.getObjectByID("melvorTotH:Manticore").bones = {"item": game.items.getObjectByID("melvorTotH:Infernal_Rune"), "quantity": 30}
					// game.monsters.getObjectByID("melvorTotH:GretYun").bones = {"item": game.items.getObjectByID("melvorTotH:Infernal_Rune"), "quantity": 50}
					// game.monsters.getObjectByID("melvorTotH:Trogark").bones = {"item": game.items.getObjectByID("melvorTotH:Infernal_Rune"), "quantity": 250}
					// game.dungeons.getObjectByID("melvorTotH:Underground_Lava_Lake").dropBones = true

					// game.monsters.getObjectByID("melvorTotH:HungryPlant").bones = {"item": game.items.getObjectByID("melvorTotH:Poison_Rune"), "quantity": 10}
					// game.monsters.getObjectByID("melvorTotH:PoisonToad").bones = {"item": game.items.getObjectByID("melvorTotH:Poison_Rune"), "quantity": 80}
					// game.monsters.getObjectByID("melvorTotH:Kongamato").bones = {"item": game.items.getObjectByID("melvorTotH:Poison_Rune"), "quantity": 15}
					// game.monsters.getObjectByID("melvorTotH:Conda").bones = {"item": game.items.getObjectByID("melvorTotH:Poison_Rune"), "quantity": 30}
					// game.monsters.getObjectByID("melvorTotH:Alraune").bones = {"item": game.items.getObjectByID("melvorTotH:Poison_Rune"), "quantity": 50}
					// game.monsters.getObjectByID("melvorTotH:Morellia").bones = {"item": game.items.getObjectByID("melvorTotH:Poison_Rune"), "quantity": 350}
					// game.dungeons.getObjectByID("melvorTotH:Ancient_Sanctuary").dropBones = true

					game.monsters.getObjectByID("melvorTotH:PoisonToad").lootTable.drops.forEach(x => {
						switch (x.item.id) {
							case "melvorTotH:Bitterlyme_Seeds":
								x.weight = 7
								break;
							default:
						}
					})

					game.monsters.getObjectByID("melvorTotH:PoisonToad").lootTable.drops.push({
						"item": game.items.getObjectByID("melvorTotH:Poison_Rune"),
						"minQuantity": 1,
						"maxQuantity": 15,
						"weight": 3
					})

					game.monsters.getObjectByID("melvorTotH:Phantom").lootTable.drops.forEach(x => {
						switch (x.item.id) {
							case "melvorTotH:Moonwort_Seeds":
								x.weight = 450
								break;
							default:
						}
					})

					game.monsters.getObjectByID("melvorTotH:Phantom").lootTable.drops.push({
						"item": game.items.getObjectByID("melvorTotH:Soul_Rune"),
						"minQuantity": 1,
						"maxQuantity": 15,
						"weight": 50
					})

					game.monsters.getObjectByID("melvorTotH:Banshee").lootTable.drops.forEach(x => {
						switch (x.item.id) {
							case "melvorTotH:Moonwort_Seeds":
								x.weight = 450
								break;
							default:
						}
					})

					game.monsters.getObjectByID("melvorTotH:Banshee").lootTable.drops.push({
						"item": game.items.getObjectByID("melvorTotH:Soul_Rune"),
						"minQuantity": 1,
						"maxQuantity": 15,
						"weight": 50
					})

					game.monsters.getObjectByID("melvorTotH:Spectre").lootTable.drops.forEach(x => {
						switch (x.item.id) {
							case "melvorTotH:Moonwort_Seeds":
								x.weight = 450
								break;
							default:
						}
					})

					game.monsters.getObjectByID("melvorTotH:Spectre").lootTable.drops.push({
						"item": game.items.getObjectByID("melvorTotH:Soul_Rune"),
						"minQuantity": 1,
						"maxQuantity": 15,
						"weight": 50
					})


					game.monsters.getObjectByID("melvorTotH:FrostGolem").lootTable.drops.forEach(x => {
						switch (x.item.id) {
							case "melvorD:Water_Rune":
								x.weight = 100
								break;
							default:
						}
					})

					game.monsters.getObjectByID("melvorTotH:FrostGolem").lootTable.drops.push({
						"item": game.items.getObjectByID("melvorTotH:Archaic_Rune"),
						"minQuantity": 1,
						"maxQuantity": 15,
						"weight": 49
					})