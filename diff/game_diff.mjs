export class GameDiff {
	CreateDiffModal(base_game_data) {
		const debugEnabled = true

		let baseGame = InitialiseGame(base_game_data)
		let modifiedGame = InitialiseGame(base_game_data)
		console.log("Initialised modifiedGame", modifiedGame)
		let diffGame = new SimGame();

		[modifiedGame, diffGame] = ParseDataSet(modifiedGame, item_data, diffGame, baseGame)

		Object.entries(diffGame.monsters).forEach(([monster_id, monster]) => {
			console.log("Monster: ", monster_id)
			console.log("Base game drop table", baseGame.monsters[monster_id])
			console.log("Diff game drop table", monster)
		})

		console.log("Diff game: ", diffGame);

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
							DebugLogging(`(HCCO) Unknown category in initialisation: ${category}`, 2)
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
								console.warn(`(HCCO) Unknown category in dependent data namespace: ${category_data.namespace}`)
								break;
						}
					})
						break;
					default:
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
						console.log(`(HCCO) Skipping data in modification category: ${sub_category}`)
						break;
				}
			})
			return [game, diffGame]

			function ParseMonsterData(game, data, diffGame, baseGame) {
				data.forEach(monster => {
					if (game.monsters[monster.id] == undefined) {
						console.error(`(HCCO) Monster "${monster.id}" not found in modified game data.`)
						return
					}
					const dropTable = RemoveAndAddToDropTable(game.monsters[monster.id].lootTable, monster.lootTable?.remove, monster.lootTable?.add)
					game.monsters[monster.id].lootTable = dropTable
					if (diffGame.monsters[monster.id] == undefined)
						diffGame.monsters[monster.id] = new MonsterLootTable();
					diffGame.monsters[monster.id].lootTable = diffDropTable(dropTable, baseGame, monster.id)
				})
				return [game, diffGame]
			}
			function ParseItemData(game, data, diffGame) {
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
						console.error(`(HCCO) Item "${item.itemID}" was already found on loot table for "${monster.id}". Please remove it before adding it.`)
						return drop_table
					}
					return [...drop_table, item]
				}
				function RemoveFromDropTable(drop_table, item_id) {
					const item_index = drop_table.findIndex(table_item => table_item.itemID == item_id)
					if (item_index == -1) {
						console.error(`(HCCO) Item "${item_id}" not found on loot table for "${monster.id}"`)
						return drop_table
					}
					return [...drop_table.slice(0, item_index), ...drop_table.slice(item_index + 1)]
				}
			}
			function diffDropTable(dropTable, baseGame, monster_id) {
				const diffTable = new DiffTable();
				if (baseGame.monsters[monster_id] == undefined) {
					console.error(`(HCCO) Monster "${monster.id}" not found in base game data.`)
					return
				}
				baseGame.monsters[monster_id].lootTable.forEach(item => {
					Object.entries(item).forEach(([property, value]) => {

						const baseGameItem = baseGame.monsters[monster_id]
					})
				});
				return diffTable
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
