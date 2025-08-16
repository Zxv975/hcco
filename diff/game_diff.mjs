export class GameDiff {
	async CreateDiffModal(base_game_data, item_data, debugEnabled = false, verbose = false) {
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

		const test = CreateFilteredList(baseGame, modifiedGame, diffGame)

		return test

		// #region initialisation
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
						if (debugEnabled && verbose)
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
		// #endregion

		// #region Modification_data
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
				//TODO: BONES
				data.forEach(entity => {
					if (game[category][entity.id] == undefined) {
						console.error(`(HCCO) Monster "${entity.id}" not found in modified game data.`)
						return
					}
					const dropTable = RemoveAndAddToDropTable(game[category][entity.id][tableKey], entity.lootTable?.remove, entity.lootTable?.add)
					game[category][entity.id][tableKey] = dropTable // Utterly insane that chests have a dropTable but monsters have a lootTable btw
					game[category][entity.id].lootChance = entity?.lootChance;
					game[category][entity.id].bones = entity?.bones;
					if (diffGame[category][entity.id] == undefined)
						diffGame[category][entity.id] = true;
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
					// const item_index = drop_table.findIndex(table_item => table_item.itemID == table_item.itemID)
					// console.log("Inputs:", structuredClone(drop_table), item, item_index, drop_table[item_index])
					// if (item_index != -1) { // Idk why but this is bugged and returns 0 instead of -1, indicating the item is found in the array. That shouldn't happen...
					// 	console.error(`(HCCO) Item "${item.itemID}" was already found on this loot table. Please remove it before adding it.`)
					// 	return drop_table
					// }
					return [...drop_table, item]
				}
				function RemoveFromDropTable(drop_table, item_id) {
					const item_index = drop_table.findIndex(table_item => table_item.itemID == item_id)
					// if (item_index == -1) { // As above, I'm disabling this check for now since it seems to be a chrome bug or something?
					// 	console.error(`(HCCO) Item "${item_id}" not found on this loot table.`)
					// 	return drop_table
					// }
					return [...drop_table.slice(0, item_index), ...drop_table.slice(item_index + 1)]
				}
			}
		}
		// #endregion

		// #region Post_processing
		function CreateFilteredList(baseGame, modifiedGame, diffGame) {
			let old_items = FilteredList(baseGame.items, diffGame.items)
			let old_monsters = FilteredList(baseGame.monsters, diffGame.monsters)
			let new_items = FilteredList(modifiedGame.items, diffGame.items)
			let new_monsters = FilteredList(modifiedGame.monsters, diffGame.monsters)

			old_items.forEach(x => { x["lootTable"] = InjectItems(x.dropTable); delete x.dropTable })
			old_monsters.forEach(x => {
				x.lootTable = InjectItems(x.lootTable, x.lootChance);
				x.bones = InjectBones(x.bones)
			})
			new_items.forEach(x => { x["lootTable"] = InjectItems(x.dropTable); delete x.dropTable })
			new_monsters.forEach(x => {
				x.lootTable = InjectItems(x.lootTable, x.lootChance);
				x.bones = InjectBones(x.bones) ?? old_monsters.find(y => y.id == x.id).bones
			})

			const retVal = []
			new_items.forEach(elem => {
				retVal.push({
					name: elem.name,
					old: old_items.find(x => x.id == elem.id),
					new: elem,
				})
			})
			new_monsters.forEach(elem => {
				retVal.push({
					name: elem.name,
					old: old_monsters.find(x => x.id == elem.id),
					new: elem,
				})
			})
			return retVal
		}
		function InjectItems(lootTable, lootChance = 100) {
			return lootTable.toSorted((a, b) => a.itemID.localeCompare(b.itemID)).map(drop => ({
				item: game.items.getObjectByID(drop.itemID),
				minQuantity: drop.minQuantity,
				maxQuantity: drop.maxQuantity,
				weight: ReducedRatio(drop.weight * lootChance, lootTable.reduce((acc, curr) => acc + curr.weight, 0) * 100)
			}))
		}
		function InjectBones(boneData) {
			if (!boneData)
				return undefined
			return {
				item: game.items.getObjectByID(boneData.itemID),
				quantity: boneData.quantity
			}
		}
		function ReducedRatio(numerator, denominator) {
			var gcd = function gcd(a, b) {
				return b ? gcd(b, a % b) : a;
			};
			gcd = gcd(numerator, denominator);
			return [numerator / gcd, denominator / gcd];
		}
		function FilteredList(entities, diffObject) {
			const filtered = [...Object.entries(entities)].filter(([entry_id, entry]) => {
				return diffObject[entry_id]
			}).map(([x, y]) => y)
			return filtered
		}
		// #endregion
	}
}

class SimGame {
	constructor() {
		this.monsters = {};
		this.items = {};
	}
}
