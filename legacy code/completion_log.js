// ctx = mod.getContext("hcco")

//export async function setup(ctx) {

mod.register(ctx => {
	const coGamemodeCheck = () => { // Check if the user is playing a CO game mode
		return (game.currentGamemode.namespace === 'hcco')
	}

	const getCOItemList = () => {
		// Get standard drops first
		let coDrops = new Set( // Using a set to elimnate duplicates
			[
				...game.monsters.allObjects.filter(x =>  // Get bones first
					x.bones != undefined // Remove monsters that don't drop bones
				).map(x =>
					x.bones.item.id // Populate with all bones dropped
				),
				...game.monsters.allObjects.map(x =>
					x.lootTable.drops.map(y => y.item.id) // Next we get standard loots
				).reduce((accumulator, current) => accumulator.concat(current)), // Reduce to flatten ragged array
				...game.dungeons.allObjects.map(x => // Dungeon rewards
					x.rewards // Remap to rewards as that's all we care about
				).filter(x =>
					x.length > 0 // Remove dungeons that don't reward anything
				).flat().map(x =>
					x.dropTable != undefined ? // dropTable is for openable chests
						x.dropTable.drops.map(y => y.item.id) : // Iterate through chest items and collect ids
						x.id // Other dungeon rewards that aren't chests, e.g. fire cape, infernal core, etc
				).flat(),
				...game.items.allObjects.filter(x => x.type == "Herb").map(x => x.id) // Add all herbs as they can be obtained from Lucky Herb potion from Rancora
			]
		)

		// Add upgrades to the list
		const upgradeCheck = (coDrops) => {
			upgradeItems = game.bank.itemUpgrades; // Grab all upgradeable items in the game
			let currentLength = -1
			while (currentLength != coDrops.size) { // We loop to check upgrade paths that require several steps, e.g. DFS requiring 3 loops
				currentLength = coDrops.size
				upgradeItems2 = []
				upgradeItems.forEach((v, k) => {
					if (!(k instanceof PotionItem)) // Remove potion upgrades, as these require mastery
						if (v[0].rootItems.every(y => coDrops.has(y.id))) // Check if the root items for the upgrade are CO items
							upgradeItems2.push(v)
				})
				upgradeItems2 = upgradeItems2.map(x => x[0].upgradedItem.id)
				coDrops = new Set([...coDrops, ...upgradeItems2])
			}

			return coDrops
		}

		coDrops = upgradeCheck(coDrops)

		// Add shop items to the list
		//	let bannedSkills = game.skills.allObjects.filter(x => !x.isCombat).map(x => x.id)

		const bannedSkills = game.skills.filter(x => !x.isCombat).map(x => x.id)
		let shopItems = game.shop.purchases.filter(shopItems =>
			shopItems.contains.items.length > 0  // Remove shop items that don't give a bank item
		).filter(x => !x.category.isGolbinRaid).filter(x =>
			!x.purchaseRequirements.some(y => y.type == 'TownshipBuilding')
		).filter(shopItem =>
			shopItem.purchaseRequirements.length == 0 || // If no purchase requirements then include it
			shopItem.purchaseRequirements.every(reqs =>
				!bannedSkills.includes(reqs?.skill?.id) && reqs?.type != 'AllSkillLevels' && reqs?.type != 'Completion'
			)
		)


		//.map(x => x.contains.items).flat().map(x => x.item)

		//	flatten(shopItems).map(x => x.item)

		// Remove shop items that cannot be purchased as a CO
		const shopCheck = (coDrops) => {
			let currentLength = -1
			while (currentLength !== coDrops.size) { // Loop to make sure there aren't shop items that require other shop items to purchase
				currentLength = coDrops.size
				coDrops = new Set([...coDrops, ...shopItems.filter(x =>
					x.costs.items.every(y =>
						coDrops.has(y.item.id) // Check if every item required in the purchase cost are a CO obtainable item (e.g. weird gloop, slayer torch etc fail this test)
					)
				).map(x => x.contains.items).flat().map(x => x.item.id)
				])
			}
			return coDrops
		}

		coDrops = shopCheck(coDrops)
		coDrops = upgradeCheck(coDrops) // Repeat check again after adding shop items


		let coChests = [...coDrops].map(x => game.items.getObjectByID(x)).filter(x => x instanceof OpenableItem) // Double check chests, because some don't come from dungeons lol
		let coChestsItems = coChests.flat().map(x => x?.dropTable?.drops?.map(y => y.item.id)).flat() // Same steps as above to map chests to their contents
		let bonusItems = ["melvorD:Signet_Ring_Half_B"] // Misc items that don't fit into other categories
		coDrops = new Set([...coDrops, ...game.shop.purchases.filter(shopItems => shopItems.contains?.itemCharges != undefined).map(x => x.contains.itemCharges.item.id), ...coChestsItems, ...bonusItems]) // Add in gloves manually: they hvae itemCharges instead of an item. Also add signet and chest items
		let bannedItems = ["mini_max_cape:Combat_Superior_Max_Skillcape", "mini_max_cape:Combat_Max_Skillcape"]
		return [...coDrops].filter(x => !bannedItems.includes(x))
	}

	const setCOFlags = () => {
		game.pets.forEach(x => x['isCO'] = false) // Reset
		game.items.forEach(x => x['isCO'] = false) // Reset

		getCOItemList().map(x => game.items.getObjectByID(x)).forEach(x => x['isCO'] = true)
		game.pets.filter(x => x?.skill?.isCombat || x?._langHint?.id === "Combat" || x?._langHint?.category === "DUNGEON" || x?._langHint?.category === "SLAYER_AREA").forEach(x => x['isCO'] = true)
		game.pets.getObjectByID('melvorF:TimTheWolf').isCO = false // This one still isn't obtainable
		game.pets.getObjectByID('melvorF:Mark').isCO = ctx.characterStorage.getItem('co-summoning-button-value') // This one will be available
	}

	const toggleUnavailableMasteries = (patchFlag) => {
		const collectionLogTabs = [...document.querySelector("#completionLog-container > div").childNodes].slice(3, 12).filter((v, k) => k % 2 == 0) // Get all collection log tabs
		if (patchFlag) {
			document.querySelector("#completionLog-container > div > div:nth-child(3)")?.classList?.add('d-none') // Literally hide masteries tab because CO doesn't have masteries
			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(12) > li.nav-main-item.open > ul > li:nth-child(2)").classList.add('d-none')
			sidebar.category("General").item("Completion Log").subitem("melvorD:CompletionLog:1").rootEl.classList.add('d-none')
			collectionLogTabs.forEach(x => { x.classList.remove('col-xl-20-perc'); x.classList.add('col-xl-25-perc') })
		} else {
			document.querySelector("#completionLog-container > div > div:nth-child(3)").classList.remove('d-none')
			// document.querySelector("#sidebar > div.js-sidebar-scroll > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > ul > li:nth-child(12) > li.nav-main-item.open > ul > li:nth-child(2)").classList.remove('d-none')
			sidebar.category("General").item("Completion Log").subitem("melvorD:CompletionLog:1").rootEl.classList.remove('d-none')
			collectionLogTabs.forEach(x => { x.classList.add('col-xl-20-perc'); x.classList.remove('col-xl-25-perc') })
		}
	}

	const toggleUnavailableSkills = (patchFlag) => {
		const combatSkillsContainer = document.querySelector("#skillslog-container").childNodes[0]
		const nonCombatSkillsContainer = document.querySelector("#skillslog-container").childNodes[1]
		completionLogMenu.skills.forEach((value, key) => value.classList.remove('d-none')) // Reset
		if (patchFlag) {
			combatSkillsContainer.append(...nonCombatSkillsContainer.childNodes) // Move all skills to combat area
			completionLogMenu.skills.forEach((value, key) => { if (!key.isCombat) value.classList.add('d-none') })
		} else {
			completionLogMenu.skills.forEach((value, key) => { if (key.isCombat) combatSkillsContainer.append(value); else nonCombatSkillsContainer.append(value); })
		}
	}

	const toggleUnavailablePets = (patchFlag) => {
		// game.pets.forEach(x => x.isCO = false) // Reset
		setCOFlags(patchFlag)
		completionLogMenu.pets.forEach((value, key) => { if (!key.ignoreCompletion) value.classList.remove('d-none') }) // Reset
		if (patchFlag) {
			// game.pets.filter(x => x?.skill?.isCombat || x?._langHint?.category == "DUNGEON" || x?._langHint?.category == "SLAYER_AREA").forEach(x => x.isCO = true)
			completionLogMenu.pets.forEach((value, key) => { if (!key.isCO) value.classList.add('d-none') })
		}
	}

	const toggleUnavailableItems = (patchFlag) => {
		// game.items.allObjects.forEach(x => x.isCO = false) // Reset
		// getCOItemList().map(x => game.items.getObjectByID(x)).forEach(x => x.isCO = true) // Recalculate
		setCOFlags(patchFlag)
		completionLogMenu.items.forEach((value, key) => { if (!key.ignoreCompletion) value.classList.remove('d-none') }) // Reset

		if (patchFlag)
			completionLogMenu.items.forEach((value, key) => { if (!key.isCO) value.classList.add('d-none') })
	}

	const createSetVisibleButton = () => {
		let a = document.createElement("div");
		document.querySelector("#completionLog-container > div > div:nth-child(1) > div > div > div > div.media-body").appendChild(a)
		a.outerHTML =
			`<div class="expansion-1-show">
	<h5 class="font-w600 text-left text-muted mb-0"> Combat Only
	<small class="comp-log-percent-combat_only">0%</small>
	<button class="btn btn-sm btn-outline-info ml-2 btn-visible-completion-combat_only" onclick="game.completion.setVisibleCompletion('combat_only');" id="combat_only-visible-completion-button">Set Visible</button>
	</h5>
	<div class="font-size-sm mb-2">
	<div class="progress active mr-1 mt-2 ml-1" style="height:10px">
	<div class="comp-log-percent-progress-combat_only progress-bar bg-co-progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
	</div>
	</div>
	</div>
	</div>`
	}

	Completion.prototype.coNamespaceID = "combat_only"
	Completion.prototype.totalProgressCO = 0

	Object.defineProperty(game.completion, 'totalProgressCO', {
		get() { return this.totalProgressMap.get(this.coNamespaceID); },
		configurable: true
	})


	const patchGame = () => {
		if (!coGamemodeCheck())
			return

		filterItemLog = (filter) => {
			$('#searchTextbox-items').val('');
			toggleUnavailableItems(game.completion.visibleCompletion == game.completion.coNamespaceID)
			let shouldShow;
			switch (filter) {
				case 0:
					shouldShow = (item, found) => found || !item.ignoreCompletion
					break;
				case 1:
					shouldShow = (_, found) => found
					break;
				case 2:
					shouldShow = (item, found) => !found && !item.ignoreCompletion
					break;
				case 3:
					shouldShow = (item, _) => (item.namespace == 'melvorD' || item.namespace == 'melvorF') && !item.ignoreCompletion
					break;
				case 4:
					shouldShow = (item, _) => item.namespace == 'melvorTotH' && !item.ignoreCompletion
					break;
			}
			let itemList = game.items;
			if (game.completion.visibleCompletion == game.completion.coNamespaceID)
				itemList = game.items.filter(x => x.isCO)
			itemList.forEach((item) => {
				const element = completionLogMenu.items.get(item);
				if (element === undefined)
					return;
				const found = game.stats.itemFindCount(item) > 0;
				if (shouldShow(item, found))
					showElement(element);
				else
					hideElement(element);
			});
		}

		buildItemLog = (game) => {
			if (!itemLogLoaded) {
				const container = document.getElementById('itemlog-container');
				$(container).html(`<div class="col-12 text-center"><span class="spinner-border text-info skill-icon-md"></span></div>`);
				window.setTimeout(() => {
					container.textContent = '';
					const baseGameContainer = createElement('div', {
						className: 'row',
						parent: container
					});
					const progressContainer = createElement('div', {
						className: 'col-12 col-lg-6',
						parent: baseGameContainer
					});
					buildCompletionProgress(progressContainer, completionLogMenu.itemProgress, 'LOG_ITEMS_DESC');
					$(baseGameContainer).append(`
	<div class="col-12 col-md-6">
	  <div class="form-group col-12 mb-0">
		<div class="input-group">
		  <input type="text" class="form-control text-danger" id="searchTextbox-items" name="searchTextbox-items" placeholder="Search Item Log...">
		  <div class="input-group-append">
			<button type="button" class="btn btn-danger" onclick="clearItemLogSearch();">X</button>
		  </div>
		</div>
	  </div>
	</div>
	<div class="col-12">
	  <button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(0);">${getLangString('COMPLETION', 'LOG_ITEMS_FILTER_0')}</button>
	  <button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(1);">${getLangString('COMPLETION', 'LOG_ITEMS_FILTER_1')}</button>
	  <button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(2);">${getLangString('COMPLETION', 'LOG_ITEMS_FILTER_2')}</button>
	  ${cloudManager.hasTotHEntitlement ? `<button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(3);">${getLangString('COMPLETION', 'LOG_ITEMS_FILTER_3')}</button>
	  <button role="button" class="btn btn-sm btn-info m-1" onClick="filterItemLog(4);">${getLangString('COMPLETION', 'LOG_ITEMS_FILTER_4')}</button>` : ''}
	</div>`);
					const namespaceContainers = new Map();
					game.registeredNamespaces.forEach((namespace) => {
						switch (namespace.name) {
							case "melvorD":
							case "melvorF":
								namespaceContainers.set(namespace.name, baseGameContainer);
								break;
							default:
								{
									if (!game.items.hasObjectInNamespace(namespace.name))
										break;
									const newContainer = createElement('div', {
										className: 'row',
										parent: container
									});
									newContainer.append(createElement('div', {
										className: 'col-12',
										children: [createElement('h5', {
											className: 'mb-1 pt-3',
											text: namespace.displayName
										})],
									}));
									namespaceContainers.set(namespace.name, newContainer);
								}
						}
					}
					);
					game.items.forEach((item) => {
						var _a;
						const itemCompletion = new ItemCompletionElement();
						itemCompletion.className = 'bank-item no-bg btn-light pointer-enabled m-1 resize-48';
						(_a = namespaceContainers.get(item.namespace)) === null || _a === void 0 ? void 0 : _a.append(itemCompletion);
						itemCompletion.updateItem(item, game);
						if (item.ignoreCompletion)
							hideElement(itemCompletion);
						completionLogMenu.items.set(item, itemCompletion);
					}
					);
					game.completion.updateItem(game.items.firstObject);
					$('#searchTextbox-items').click(function (e) {
						updateItemLogSearchArray(game);
					});
					$('#searchTextbox-items').keyup(function () {
						const search = $('#searchTextbox-items').val();
						updateItemLogSearch(search);
					});
					filterItemLog(0)
				}
					, 1000);
				itemLogLoaded = true;
			}
		}
	}

	ctx.onInterfaceReady(c => {
		if (!coGamemodeCheck())
			return

		patchGame()
		createSetVisibleButton()
		setCOFlags()
		ctx.patch(Completion, "updateSkillProgress").replace(function (o) {
			this.skillProgress.currentCount.clear();
			this.skillProgress.maximumCount.clear();
			setCOFlags();

			if (this.visibleCompletion == this.coNamespaceID) {
				this.game.skills.filter(x => x.isCombat).forEach((skill) => {
					switch (skill.namespace) {
						case "melvorD":
						case "melvorF":
							this.skillProgress.maximumCount.add(skill.namespace, 99);
							this.skillProgress.currentCount.add(skill.namespace, Math.min(skill.level, 99));
							this.skillProgress.currentCount.add(this.coNamespaceID, Math.min(skill.level, 120));
							this.skillProgress.maximumCount.add(this.coNamespaceID, 120);
							if (cloudManager.hasTotHEntitlement) {
								this.skillProgress.currentCount.add("melvorTotH", Math.max(skill.level - 99, 0));
								this.skillProgress.maximumCount.add("melvorTotH", 21);
							}
							break;
						default:
							this.skillProgress.currentCount.add(skill.namespace, Math.min(skill.level, skill.levelCap));
							this.skillProgress.maximumCount.add(skill.namespace, skill.levelCap);
							this.skillProgress.currentCount.add(this.coNamespaceID, Math.min(skill.level, skill.levelCap));
							this.skillProgress.maximumCount.add(this.coNamespaceID, skill.levelCap);
							break;
					}
				});
			} else {
				this.game.skills.forEach((skill) => {
					switch (skill.namespace) {
						case "melvorD":
						case "melvorF":
							this.skillProgress.maximumCount.add(skill.namespace, 99);
							this.skillProgress.currentCount.add(skill.namespace, Math.min(skill.level, 99));
							if (skill.isCombat) {
								this.skillProgress.maximumCount.add(this.coNamespaceID, 120);
								this.skillProgress.currentCount.add(this.coNamespaceID, Math.min(skill.level, 120));
							}
							if (cloudManager.hasTotHEntitlement) {
								this.skillProgress.maximumCount.add("melvorTotH", 21);
								this.skillProgress.currentCount.add("melvorTotH", Math.max(skill.level - 99, 0));
							}
							break;
						default:
							this.skillProgress.currentCount.add(skill.namespace, Math.min(skill.level, skill.levelCap));
							this.skillProgress.maximumCount.add(skill.namespace, skill.levelCap);
							this.skillProgress.currentCount.add(this.coNamespaceID, Math.min(skill.level, skill.levelCap));
							if (skill.isCombat)
								this.skillProgress.maximumCount.add(this.coNamespaceID, skill.levelCap);
							break;
					}
				});
			}
		})

		ctx.patch(Completion, "updateMasteryProgress").replace(function (o) {
			this.masteryProgress.currentCount.clear();
			this.masteryProgress.maximumCount.clear();
			setCOFlags();

			if (this.visibleCompletion == this.coNamespaceID)
				return
			this.game.masterySkills.forEach((skill) => {
				if (skill.hasMastery) {
					skill.addTotalCurrentMasteryToCompletion(this.masteryProgress.currentCount);
					skill.totalMasteryActions.forEach((total, namespace) => {
						this.masteryProgress.maximumCount.add(namespace, total * skill.masteryLevelCap);
						// this.masteryProgress.maximumCount.add(this.coNamespaceID, total * skill.masteryLevelCap);
					});
				}
			});
		})

		ctx.patch(Completion, "updateItemProgress").replace(function (o) {
			this.itemProgress.currentCount.clear();
			this.itemProgress.maximumCount.clear();
			setCOFlags();

			if (this.visibleCompletion == this.coNamespaceID) {
				this.game.items.filter(x => x.isCO).forEach((item) => {
					if (!item.ignoreCompletion) {
						if (this.game.stats.itemFindCount(item) > 0) {
							this.itemProgress.currentCount.inc(item.namespace);
							this.itemProgress.currentCount.inc(this.coNamespaceID);
						}
						this.itemProgress.maximumCount.inc(item.namespace);
						this.itemProgress.maximumCount.inc(this.coNamespaceID);
					}
				});
			} else {
				this.game.items.forEach((item) => {
					if (!item.ignoreCompletion) {
						if (this.game.stats.itemFindCount(item) > 0) {
							this.itemProgress.currentCount.inc(item.namespace);
							this.itemProgress.currentCount.inc(this.coNamespaceID);
						}
						this.itemProgress.maximumCount.inc(item.namespace);
						if (item.isCO)
							this.itemProgress.maximumCount.inc(this.coNamespaceID);
					}
				});
			}
		})


		ctx.patch(Completion, "updateMonsterProgress").replace(function (o) {
			this.monsterProgress.currentCount.clear();
			this.monsterProgress.maximumCount.clear();
			setCOFlags();

			this.game.monsters.forEach((monster) => {
				if (!monster.ignoreCompletion) {
					if (this.game.stats.monsterKillCount(monster) > 0) {
						this.monsterProgress.currentCount.inc(monster.namespace);
						this.monsterProgress.currentCount.inc(this.coNamespaceID);
					}
					this.monsterProgress.maximumCount.inc(monster.namespace);
					this.monsterProgress.maximumCount.inc(this.coNamespaceID);
				}
			});
		})

		ctx.patch(Completion, "updatePetProgress").replace(function (o) {
			this.petProgress.currentCount.clear();
			this.petProgress.maximumCount.clear();
			setCOFlags();

			if (this.visibleCompletion == this.coNamespaceID) {
				this.game.pets.filter(x => x.isCO).forEach((pet) => {
					if (!pet.ignoreCompletion) {
						if (this.game.petManager.isPetUnlocked(pet)) {
							this.petProgress.currentCount.inc(pet.namespace);
							this.petProgress.currentCount.inc(this.coNamespaceID);
						}
						this.petProgress.maximumCount.inc(pet.namespace);
						this.petProgress.maximumCount.inc(this.coNamespaceID);
					}
				})
			} else {
				this.game.pets.forEach((pet) => {
					if (!pet.ignoreCompletion) {
						if (this.game.petManager.isPetUnlocked(pet)) {
							this.petProgress.currentCount.inc(pet.namespace);
							this.petProgress.currentCount.inc(this.coNamespaceID);
						}
						this.petProgress.maximumCount.inc(pet.namespace);
						if (pet.isCO)
							this.petProgress.maximumCount.inc(this.coNamespaceID);
					}
				})
			}
		})

		ctx.patch(Completion, "updateTotalProgress").before(function () {
			// const previousProgressCO = this.totalProgressMap.get(this.this.coNamespaceID);
			this.totalProgressMap.set(this.coNamespaceID, this.computeTotalProgressPercent(this.coNamespaceID));
			this.renderQueue.totalProgressCO = true;
		})

		ctx.patch(Completion, "render").after(function () {
			const sideBarItem = sidebar.category('General').item('Completion Log');
			if (this.renderQueue.totalProgressCO) {
				if (this.visibleCompletion === this.coNamespaceID && sideBarItem.asideEl !== undefined)
					sideBarItem.asideEl.textContent = parseProgress(this.totalProgressCO);
				$('.comp-log-percent-combat_only').text(parseProgress(this.totalProgressCO));
				$('.comp-log-percent-progress-combat_only').css('width', `${this.totalProgressCO}%`);
				if (this.totalProgressCO >= 100) {
					$('.comp-log-comp-percent-combat_only').addClass('text-success');
					$('.comp-log-comp-percent-combat_only').addClass('font-w600');
				}
				this.renderQueue.totalProgressCO = false;
			}
		})
		// }
		// ctx.patch(Completion, "buildItemLog").after(function (returnVal) {
		// 	filterItemLog(0)
		// })

		if (game.completion.visibleCompletion == game.completion.coNamespaceID)
			document.getElementById("combat_only-visible-completion-button").classList.replace('btn-outline-info', 'btn-info');
		game.completion.updateAllCompletion()

		ctx.patch(Completion, "updateAllCompletion").before(function () {
			toggleUnavailableSkills(this.visibleCompletion == this.coNamespaceID)
			toggleUnavailableMasteries(this.visibleCompletion == this.coNamespaceID)
			toggleUnavailableItems(this.visibleCompletion == this.coNamespaceID)
			toggleUnavailablePets(this.visibleCompletion == this.coNamespaceID)
		})
	})
})
