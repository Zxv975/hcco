export class PatchCustomShop {
	AddCustomShopPurchase(purchaseID, modifierID, modifierValue, scope = {}) {
		const repeat_slayer_modifier = [new ModifierValue(game.modifierRegistry.getObjectByID(modifierID), modifierValue, scope)]
		const this_purchase = game.shop.purchases.getObjectByID(purchaseID)
		const data = {
			items: [],
			modifiers: {}
		}
		data.modifiers[game.modifierRegistry.getObjectByID(modifierID).localID] = 1
		const stat_object = new StatObject(data, game, `${this_purchase.name} with id "${this_purchase.id}"`);
		stat_object["modifiers"] = repeat_slayer_modifier

		this_purchase.contains["stats"] = stat_object;
	}

	AddRepeatSlayer() {
		// SlayerTaskMenuElement.prototype.repeatSlayerCheckbox
		// getElementFromFragment(combatMenus.slayerTask._content, 'repeat-slayer-checkbox', 'settings-checkbox');
		// <settings-checkbox class="col-12 font-w400 font-size-sm text-center d-none pt-1" id="repeat-slayer-checkbox" data-setting-id="enableAutoSlayer"></settings-checkbox>
	}

	// PurchaseUnlockRender(ctx) {
	// 	ctx.patch(Shop, "renderUpgrades").after(function (returnVal) {
	// 		// ToggleRepeatSlayerCheckbox(game.modifiers.repeatSlayerUnlocked > 0);
	// 		if (game.modifiers.repeatSlayerUnlocked > 1)
	// 			return;
	// 		else
	// 			return;
	// 	})
	// }

	CreateRepeatSlayerComponent(ctx) {
		const container = document.querySelector("#combat-slayer-task-menu > div > div.row.no-gutters.px-2 > div.col-12.justify-vertical-center")
		function c_RepeatSlayerButton(props) {
			return {
				$template: "#repeat-slayer",
				repeat_slayer(realmID) {
					const newMonster = game.combat.enemy.monster
					const monsterRealm = newMonster.damageType.id == "melvorD:Normal" ? game.realms.getObjectByID("melvorD:Melvor") : game.realms.getObjectByID("melvorItA:Abyssal")
					const category = getCategory(newMonster, monsterRealm);
					if (!category) {// Change this to "in dungeon" logic
						notifyPlayer(game.slayer, "Invalid Slayer target selected", 'danger'); // Invalid toasts message
						return;
					}
					if (realmID != monsterRealm.id) {
						notifyPlayer(game.slayer, "Invalid realm for selected target", 'danger'); // Invalid toasts message
						return;
					}
					const slayerTask = game.combat.slayerTask
					const costs = slayerTask.getRollCosts(category);
					const taskPrice = 5;

					for (let i = 0; i < taskPrice; i++)
						costs.consumeCosts();

					slayerTask.monster = newMonster;
					slayerTask.category = category;

					slayerTask.active = true;
					slayerTask.autoStartNext = true;
					slayerTask.taskTimer.start(1000);
					slayerTask.renderQueue.task = true;
					slayerTask.renderQueue.newButton = true;
					slayerTask.extended = false;
					slayerTask.killsLeft = slayerTask.getTaskLength(category);

					// Enable repeat slayer, disable auto slayer buttons, set auto slayer to false, uncheck all auto slayer checkboxes. 
					ctx.characterStorage.setItem("repeatSlayerEnabled", true);
					document.querySelector("#settings-checkbox-2").disabled = true;
					document.querySelector("#settings-checkbox-3").disabled = true;
					// document.querySelector("slayer-task-menu").autoSlayerCheckBox.children[0].children[0].disabled = true // Alternative method
					document.querySelector("#combat-slayer-task-menu > div > div.row.no-gutters.px-2 > div:nth-child(2) > h5.font-w600.text-center.mb-0.pt-2 > a").disabled = true;
					// game.setting.boolData.enableAutoSlayer.currentValue = false;
					// document.querySelector('#settings-checkbox-2').checked = false;
					// document.querySelector('#settings-checkbox-3').checked = false;

					slayerTask.render();
					slayerTask.clickNewTask();
					slayerTask.extendTask();
					
					function getCategory(monster, realm) {
						const realmTaskMap = {
							"melvorD:Melvor": "CombatLevel",
							"melvorItA:Abyssal": "Abyss",
						}
						const taskList = game.combat.slayerTask.categories.filter(x => realmTaskMap[realm.id] == x.monsterSelection.type)
						return taskList.find(x => {
							if (x.monsterSelection.type == "CombatLevel") {
								return monster.combatLevel >= x.monsterSelection.minLevel && monster.combatLevel <= x.monsterSelection.maxLevel
							}
							else if (x.monsterSelection.type == "Abyss") {
								return x.monsterSelection.area.monsters.map(y => y.id).includes(monster.id)
							}
						})
					}
				},
			}
		}
		ui.create(c_RepeatSlayerButton(), container);
		SetRepeatRealmButtons(game.currentRealm);
		ctx.patch(SlayerTaskMenuElement, "setRealm").before(function (realm) { SetRepeatRealmButtons(realm); })
		ctx.patch(SlayerTask, "selectTask").before(function (category, costsCurrency, render, fromClick = false) {
			ctx.characterStorage.setItem("repeatSlayerEnabled", false);
			document.querySelector("#settings-checkbox-2").disabled = false;
			document.querySelector("#settings-checkbox-3").disabled = false;
			document.querySelector("#combat-slayer-task-menu > div > div.row.no-gutters.px-2 > div:nth-child(2) > h5.font-w600.text-center.mb-0.pt-2 > a").disabled = false;
		})
		ctx.patch(SlayerTask, "addKill").replace(function (o) {
			if (this.category === undefined)
				return;
			this.killsLeft--;
			this.game.stats.Slayer.inc(SlayerStats.MonstersKilledOnTask);
			if (this.killsLeft <= 0) {
				const oldCount = this.category.tasksCompleted;
				this.active = false;
				this.category.tasksCompleted++;
				this._events.emit('taskCompleted', new SlayerTaskCompletedEvent(this.category, oldCount, this.category.tasksCompleted));
				this.game.queueRequirementRenders();
				if (!ctx.characterStorage.getItem("repeatSlayerEnabled")) {
					this.selectTask(this.category, false, false); // Only changed part
				}
			}
			this.renderQueue.task = true;
		})

		function SetRepeatRealmButtons(realm) {
			if (realm.id == "melvorD:Melvor") {
				showElement(document.getElementById("repeat-slayer-button"))
				hideElement(document.getElementById("repeat-abyssal-slayer-button"))
			}
			else if (realm.id == "melvorItA:Abyssal") {
				showElement(document.getElementById("repeat-abyssal-slayer-button"))
				hideElement(document.getElementById("repeat-slayer-button"))
			} else {
				// Custom realms i guess
			}
		}
	}



	ToggleRepeatSlayerCheckbox(unlocked) {
		const container = document.querySelector("#combat-slayer-task-menu")
		function c_RepeatSlayerButton(props) {
			return {
				$template: "#repeat-slayer",
				count: props.count,
				repeat_slayer() {
					this.count++;
				},
			}
		}

		console.log("Repeating slayer checkbox")

		if (unlocked) {
			ui.create(c_RepeatSlayerButton({ count: 0 }), container);
			// showElement(this.repeatSlayerCheckBox);
		}
		else {
			return;
		}
	}
	// AddRepeatSlayer() {
	// 	const repeat_slayer_modifier = [new ModifierValue(game.modifierRegistry.getObjectByID("hcco:repeatSlayerUnlocked"), 1, {})]
	// 	const this_purchase = game.shop.purchases.getObjectByID("hcco:Repeat_Slayer")
	// 	const repeat_v2 = {
	// 		items: [],
	// 		modifiers: {}
	// 	}
	// 	repeat_v2.modifiers[game.modifierRegistry.getObjectByID("hcco:repeatSlayerUnlocked").localID] = 1
	// 	const stat_object = new StatObject(repeat_v2, game, `${this_purchase.name} with id "${this_purchase.id}"`);
	// 	stat_object["modifiers"] = repeat_slayer_modifier

	// 	this_purchase.contains["stats"] = stat_object;
	// }
}