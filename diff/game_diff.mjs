export class GameDiff {
	CreateDiffModal2(base_game_data, item_data) {
		// console.log(base_game_data)
		// console.log(item_data)
		// Object.entries(base_game_data).forEach(([namespace, category_data]) => {

		// 	newGame.registerDataPackage(category_data);
		// })
		const newGame = structuredClone(game.monsters)
		console.log(newMonsters)
		newGame.registerDataPackage(item_data.data);
		const baseMonsters = structuredClone(newGame.monsters)
		// const newMonsters = structuredClone(newGame.monsters)

		console.log(baseMonsters)
		console.log(newMonsters)

		// Object.entries(data).forEach(([namespace, category_data]) => {
		// 	switch (namespace) {
		// 		case "melvorD":
		// 			game = ImportMonstersAndItems(game, category_data.data, namespace)
		// 			break;
		// 		case "melvorF":
		// 			if (cloudManager.hasFullVersionEntitlement) game = ImportMonstersAndItems(game, category_data.data, namespace)
		// 			break;
		// 		case "melvorTotH":
		// 			if (cloudManager.hasTotHEntitlementAndIsEnabled) game = ImportMonstersAndItems(game, category_data.data, namespace)
		// 			break;
		// 		case "melvorAoD":
		// 			if (cloudManager.hasAoDEntitlementAndIsEnabled) game = ImportMonstersAndItems(game, category_data.data, namespace)
		// 			break;
		// 		case "melvorItA":
		// 			if (cloudManager.hasItAEntitlementAndIsEnabled) game = ImportMonstersAndItems(game, category_data.data, namespace)
		// 			break;
		// 		default:
		// 			if (debugEnabled)
		// 				console.warn(`(HCCO) Unknown category dependent data namespace: ${namespace}`, 2)
		// 			break;
		// 	}
		// })
	}

	CreateDiffModal(base_game_data, item_data, debugEnabled = true) {
		let baseGame = InitialiseGame(base_game_data)
		let modifiedGame = InitialiseGame(base_game_data)
		// console.log("Initialised modifiedGame", modifiedGame)
		let diffGame = new SimGame();

		[modifiedGame, diffGame] = ParseDataSet(modifiedGame, item_data, diffGame, baseGame)

		if (debugEnabled)
			Object.entries(diffGame.monsters).forEach(([monster_id, monster]) => {
				console.log("Monster: ", monster_id)
				console.log("Base game drop table", baseGame.monsters[monster_id])
				console.log("Diff game drop table", monster)
			})

		// console.log("Mod game: ", modifiedGame.monsters);
		// console.log("Base game: ", baseGame.monsters);
		// console.log("Diff game: ", diffGame.monsters);
		// console.log("Filtered mobs: ", FilterMonsters(modifiedGame.monsters, diffGame.monsters));
		const dat = CombineLists(FilterMonsters(baseGame.monsters, diffGame.monsters), FilterMonsters(modifiedGame.monsters, diffGame.monsters))

		return dat

		function CombineLists(filteredBase, filteredModified) {
			const data = filteredModified.map(x => ({ name: x.name, old: filteredBase.find(y => y.id == x.id) ?? [], new: x }))
			data.forEach((entry) => {
				entry.old.lootTable = entry.old?.lootTable?.toSorted((a, b) => a.itemID.localeCompare(b.itemID)).map(drop => ({
					item: game.items.getObjectByID(drop.itemID),
					minQuantity: drop.minQuantity,
					maxQuantity: drop.maxQuantity,
					weight: CalcFrac(drop.weight, entry.old.lootTable.reduce((acc, curr) => acc + curr.weight, 0), entry.old.lootChance)
				}))
				entry.new.lootTable = entry.new?.lootTable?.toSorted((a, b) => a.itemID.localeCompare(b.itemID)).map(drop => ({
					item: game.items.getObjectByID(drop.itemID),
					minQuantity: drop.minQuantity,
					maxQuantity: drop.maxQuantity,
					weight: CalcFrac(drop.weight, entry.new.lootTable.reduce((acc, curr) => acc + curr.weight, 0), entry.new.lootChance)
				}))
			})
			return data
		}


		function CalcFrac(weight, totalWeight, lootChance) {
			function reduce(numerator, denominator) {
				var gcd = function gcd(a, b) {
					return b ? gcd(b, a % b) : a;
				};
				gcd = gcd(numerator, denominator);
				return [numerator / gcd, denominator / gcd];
			}
			return reduce(lootChance * weight, totalWeight * 100)
		}

		function FilterMonsters(monsterObject, diffObject) {
			const filteredMobs = [...Object.entries(monsterObject)].filter(([monster_id, monster]) => {
				return diffObject[monster_id]
			}).map(([x, y]) => y)
			// console.log("y:", y)
			return filteredMobs
		}

		function InitialiseGame(data) {
			let game = new SimGame();
			Object.entries(data).forEach(([namespace, category_data]) => {
				switch (namespace) {
					case "melvorD":
						game = ImportMonstersAndItems(game, category_data.data, namespace)
						break;
					case "melvorF":
						if (cloudManager.hasFullVersionEntitlement) game = ImportMonstersAndItems(game, category_data.data, namespace)
						break;
					case "melvorTotH":
						if (cloudManager.hasTotHEntitlementAndIsEnabled) game = ImportMonstersAndItems(game, category_data.data, namespace)
						break;
					case "melvorAoD":
						if (cloudManager.hasAoDEntitlementAndIsEnabled) game = ImportMonstersAndItems(game, category_data.data, namespace)
						break;
					case "melvorItA":
						if (cloudManager.hasItAEntitlementAndIsEnabled) game = ImportMonstersAndItems(game, category_data.data, namespace)
						break;
					default:
						if (debugEnabled)
							console.warn(`(HCCO) Unknown category dependent data namespace: ${namespace}`, 2)
						break;
				}
			})
			function ImportMonstersAndItems(game, data, namespace) {
				Object.entries(data).forEach(([category, category_data]) => {
					switch (category) {
						case "monsters":
							category_data.forEach(monster => {
								game.monsters[`${namespace}:${monster.id}`] = structuredClone(monster)
							})
							break;
						case "items":
							category_data.forEach(item => {
								game.items[`${namespace}:${item.id}`] = structuredClone(item)
							})
							break;
						default:
							if (debugEnabled)
								console.warn(`(HCCO) Unknown category in initialisation: ${category}`)
					}
				});
				return game;
			}
			return game;
		}
		function ParseDataSet(game, data, diffGame, baseGame) {
			Object.entries(data).forEach(([category, category_data]) => {
				switch (category) {
					case "modifications":
						[game, diffGame] = ParseModificationData(game, category_data, diffGame, baseGame)
						break;
					case "dependentData": category_data.forEach(dependent_data => {
						switch (dependent_data.namespace) {
							case "melvorF":
								if (cloudManager.hasFullVersionEntitlement) [game, diffGame] = ParseDataSet(game, dependent_data, diffGame, baseGame)
								break;
							case "melvorTotH":
								if (cloudManager.hasTotHEntitlementAndIsEnabled) [game, diffGame] = ParseDataSet(game, dependent_data, diffGame, baseGame)
								break;
							case "melvorAoD":
								if (cloudManager.hasAoDEntitlementAndIsEnabled) [game, diffGame] = ParseDataSet(game, dependent_data, diffGame, baseGame)
								break;
							case "melvorItA":
								if (cloudManager.hasItAEntitlementAndIsEnabled) [game, diffGame] = ParseDataSet(game, dependent_data, diffGame, baseGame)
								break;
							default:
								if (debugEnabled)
									console.warn(`(HCCO) Unknown category in dependent data namespace: ${category_data.namespace}`)
								break;
						}
					})
						break;
					default:
						if (debugEnabled)
							console.warn(`(HCCO) Skipping data in category: ${category}`)
						break;
				}
			})
			return [game, diffGame];
		}

		function ParseModificationData(game, modification_data, diffGame, baseGame) {
			Object.entries(modification_data).forEach(([sub_category, sub_category_data]) => {
				switch (sub_category) {
					case "monsters":
						[game, diffGame] = ParseMonsterData(game, sub_category_data, diffGame, baseGame);
						break;
					case "items":
						[game, diffGame] = ParseItemData(game, sub_category_data, diffGame, baseGame);
						break;
					case "dungeons":
						[game, diffGame] = ParseDungeonData(game, sub_category_data, diffGame, baseGame);
						break;
					default:
						if (debugEnabled)
							console.log(`(HCCO) Skipping data in modification category: ${sub_category}`)
						break;
				}
			})
			return [game, diffGame]

			function ParseMonsterData(game, data, diffGame, baseGame) {
				data.forEach(monster => {
					if (game.monsters[monster.id] == undefined) {
						if (debugEnabled)
							console.error(`(HCCO) Monster "${monster.id}" not found in modified game data.`)
						return
					}
					const dropTable = RemoveAndAddToDropTable(game.monsters[monster.id].lootTable, monster.lootTable?.remove, monster.lootTable?.add)
					game.monsters[monster.id].lootTable = dropTable
					if (diffGame.monsters[monster.id] == undefined)
						// diffGame.monsters[monster.id] = new MonsterLootTable();
						diffGame.monsters[monster.id] = true;
					// diffGame.monsters[monster.id].lootTable = DiffDropTable(dropTable, baseGame, monster.id)
				})
				return [game, diffGame]
			}
			function ParseItemData(game, data, diffGame) {
				if (debugEnabled)
					console.warn(`Skipping items data for now`)
				// This is all wrong, need to parse other types of modifications other than just drop table mods. need a switch in here
				// data.forEach(modification => {
				// 	if (game.items[modification.id] == undefined) {
				// 		console.error(`Item "${item.id}" not found in base game data.`)
				// 		return
				// 	}
				// 	game.items[modification.id].dropTable = RemoveAndAddToDropTable(game.items[modification.id].dropTable, modification?.dropTable?.remove, modification?.dropTable?.add)
				// })
				return [game, diffGame]
			}
			function ParseDungeonData(game, data, diffGame) {
				if (debugEnabled)
					console.warn(`Skipping dungeon data for now`)
				return [game, diffGame]
			}
			// #region Util
			function RemoveAndAddToDropTable(drop_table, remove_array, add_array) {
				remove_array?.forEach(item_id => { drop_table = RemoveFromDropTable(drop_table, item_id) })
				add_array?.forEach(item => { drop_table = AddToDropTable(drop_table, item) })
				return drop_table

				function AddToDropTable(drop_table, item) {
					const itemIndex = drop_table.findIndex(monster_item => monster_item.itemID == item.itemID)
					if (itemIndex != -1) {
						if (debugEnabled)
							console.error(`(HCCO) Item "${item.itemID}" was already found on loot table for "${monster.id}". Please remove it before adding it.`)
						return drop_table
					}
					return [...drop_table, item]
				}
				function RemoveFromDropTable(drop_table, item_id) {
					const item_index = drop_table.findIndex(table_item => table_item.itemID == item_id)
					if (item_index == -1) {
						if (debugEnabled)
							console.error(`(HCCO) Item "${item_id}" not found on loot table for "${monster.id}"`)
						return drop_table
					}
					return [...drop_table.slice(0, item_index), ...drop_table.slice(item_index + 1)]
				}
			}
			function DiffDropTable(dropTable, baseGame, monster_id) {
				// const diffTable = new DiffTable();
				// if (baseGame.monsters[monster_id] == undefined) {
				// 	if (debugEnabled)
				// 		console.error(`(HCCO) Monster "${monster.id}" not found in base game data.`)
				// 	return
				// }
				// console.log(baseGame.monsters[monster_id].lootTable, dropTable)
				// baseGame.monsters[monster_id].lootTable.forEach(item => {
				// 	console.log(item, )
				// 	throw new Error()
				// });
				// return diffTable
			}
			function DropTableContains(dropTable, item) {
				const drop = dropTable.find(x => x.itemID == item.itemID)
				if (drop == []) // Item was removed
					return false
				return dropTable
			}
		}
	}
}

class SimGame {
	constructor() {
		this.monsters = {};
		this.items = {};
	}
}
class MonsterLootTable {
	constructor() {
		this.lootTable = [];
	}
}
class DiffTable {
	constructor() {
		this.lootTable = [];
	}
}
class Loot {
	constructor() {
		this.itemID;
		this.maxQuantity;
		this.minQuantity;
		this.weight;
	}
}
