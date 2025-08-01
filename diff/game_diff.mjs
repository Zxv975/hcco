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

	async CreateDiffModal(base_game_data, item_data, debugEnabled = false) {
		let baseGame = InitialiseGame(base_game_data)
		let modifiedGame = InitialiseGame(base_game_data)
		console.log("Initialised modifiedGame", modifiedGame)
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

		// console.log("Diff: ", diffGame)
		// Diff + Mod + Base => Filtered Lists (items, monsters)
		// Filtered list => item list

		// console.log("Filtered items", FilteredList(baseGame.items, diffGame.items))
		// console.log("Filtered items", FilteredList(modifiedGame.items, diffGame.items))
		// console.log("Filtered items", FilteredList(baseGame.monsters, diffGame.monsters))
		// console.log("Filtered items", FilteredList(modifiedGame.monsters, diffGame.monsters))

		const test = CreateFilteredList(baseGame, modifiedGame, diffGame)
		console.log("Test: ", test)

		// const dat = CombineLists(FilteredList(baseGame.monsters, diffGame.monsters), FilteredList(modifiedGame.monsters, diffGame.monsters))

		return test

		// function CombineLists(filteredBase, filteredModified) {
		// 	const data = filteredModified.map(x => ({ name: x.name, old: filteredBase.find(y => y.id == x.id) ?? [], new: x }))
		// 	data.forEach((entry) => {
		// 		entry.old.lootTable = entry.old?.lootTable?.toSorted((a, b) => a.itemID.localeCompare(b.itemID)).map(drop => ({
		// 			item: game.items.getObjectByID(drop.itemID),
		// 			minQuantity: drop.minQuantity,
		// 			maxQuantity: drop.maxQuantity,
		// 			weight: ReducedRatio(drop.weight * entry.old.lootChance, entry.old.lootTable.reduce((acc, curr) => acc + curr.weight, 0) * 100)
		// 		}))
		// 		entry.new.lootTable = entry.new?.lootTable?.toSorted((a, b) => a.itemID.localeCompare(b.itemID)).map(drop => ({
		// 			item: game.items.getObjectByID(drop.itemID),
		// 			minQuantity: drop.minQuantity,
		// 			maxQuantity: drop.maxQuantity,
		// 			weight: ReducedRatio(drop.weight * entry.new.lootChance, entry.new.lootTable.reduce((acc, curr) => acc + curr.weight, 0) * 100)
		// 		}))
		// 	})
		// 	return data
		// }

		function CreateFilteredList(baseGame, modifiedGame, diffGame) {
			let old_items = FilteredList(baseGame.items, diffGame.items)
			let old_monsters = FilteredList(baseGame.monsters, diffGame.monsters)
			let new_items = FilteredList(modifiedGame.items, diffGame.items)
			let new_monsters = FilteredList(modifiedGame.monsters, diffGame.monsters)

			old_items.forEach(x => { x["lootTable"] = InjectItems(x.dropTable); delete x.dropTable })
			old_monsters.forEach(x => x.lootTable = InjectItems(x.lootTable, x.lootChance))
			new_items.forEach(x => { x["lootTable"] = InjectItems(x.dropTable); delete x.dropTable })
			new_monsters.forEach(x => x.lootTable = InjectItems(x.lootTable, x.lootChance))

			return {
				old: [...old_items, ...old_monsters],
				new: [...new_items, ...new_monsters],
			}
		}

		function InjectItems(lootTable, lootChance = 100) {
			function ReducedRatio(numerator, denominator) {
				var gcd = function gcd(a, b) {
					return b ? gcd(b, a % b) : a;
				};
				gcd = gcd(numerator, denominator);
				return [numerator / gcd, denominator / gcd];
			}

			return lootTable.toSorted((a, b) => a.itemID.localeCompare(b.itemID)).map(drop => ({
				item: game.items.getObjectByID(drop.itemID),
				minQuantity: drop.minQuantity,
				maxQuantity: drop.maxQuantity,
				weight: ReducedRatio(drop.weight * lootChance, lootTable.reduce((acc, curr) => acc + curr.weight, 0) * 100)
			}))
		}

		function FilteredList(monsterObject, diffObject) {
			const filteredMobs = [...Object.entries(monsterObject)].filter(([monster_id, monster]) => {
				return diffObject[monster_id]
			}).map(([x, y]) => y)
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
						[game, diffGame] = ParseMonsterData(game, sub_category_data, diffGame);
						break;
					case "items":
						[game, diffGame] = ParseItemListData(game, sub_category_data, diffGame);
						break;
					case "dungeons":
						[game, diffGame] = ParseDungeonData(game, sub_category_data, diffGame);
						break;
					default:
						if (debugEnabled)
							console.log(`(HCCO) Skipping data in modification category: ${sub_category}`)
						break;
				}
			})
			return [game, diffGame]

			function ParseMonsterData(game, data, diffGame) {
				return ParseCategoryData(game, data, diffGame, "monsters", "lootTable");
			}
			function ParseItemData(game, data, diffGame, item_id) {
				return ParseCategoryData(game, [{ id: item_id, lootTable: data }], diffGame, "items", "dropTable");
			}

			function ParseItemListData(game, data, diffGame) {
				if (debugEnabled)
					console.warn(`Skipping items data for now`)
				Object.values(data).forEach((item) => {
					Object.entries(item).forEach(([category, category_data]) => {
						switch (category) {
							case "validSlots":
								// [game, diffGame] = ParseCategoryData(game, sub_category_data, diffGame, "item");
								break;
							case "dropTable":
								[game, diffGame] = ParseItemData(game, category_data, diffGame, item.id);
								break;
							case "equipRequirements":
								[game, diffGame] = ParseDungeonData(game, category_data, diffGame);
								break;
							default:
								if (debugEnabled)
									console.log(`(HCCO) Skipping data in item modification category: ${category}`)
								break;
						}
					})
					return [game, diffGame]
				});
				return [game, diffGame]
			}
			function ParseCategoryData(game, data, diffGame, category, tableKey) {
				data.forEach(entity => {
					if (game[category][entity.id] == undefined) {
						if (debugEnabled)
							console.error(`(HCCO) Monster "${entity.id}" not found in modified game data.`)
						return
					}
					const dropTable = RemoveAndAddToDropTable(game[category][entity.id][tableKey], entity[tableKey]?.remove, entity[tableKey]?.add)
					game[category][entity.id].lootTable = dropTable // Utterly insane that chests have a dropTable but monsters have a lootTable btw
					if (diffGame[category][entity.id] == undefined)
						// diffGame.monsters[monster.id] = new MonsterLootTable();
						diffGame[category][entity.id] = true;
					// diffGame.monsters[monster.id].lootTable = DiffDropTable(dropTable, baseGame, monster.id)
				})
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
