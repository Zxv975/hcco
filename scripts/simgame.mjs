export class SimGame {
	CreateSimGame(data) {
		let game = new TestGame();
	}
}

class TestGame {


	registerDataPackage(dataPackage) {
		var _a;
		if (dataPackage.namespace === undefined)
			throw new Error(`Package does not have a namespace defined.`);
		const namespace = this.registeredNamespaces.getNamespace(dataPackage.namespace);
		if (namespace === undefined)
			throw new Error(`Error trying to register data package. Namespace: "${dataPackage.namespace}" is not registered.`);
		if (dataPackage.data !== undefined)
			this.registerGameData(namespace, dataPackage.data);
		(_a = dataPackage.dependentData) === null || _a === void 0 ? void 0 : _a.forEach((depData) => {
			if (this.registeredNamespaces.hasNamespace(depData.namespace)) {
				if (depData.data !== undefined)
					this.registerGameData(namespace, depData.data);
				if (depData.modifications !== undefined)
					this.applyDataModifications(depData.modifications);
			}
		});
		if (dataPackage.modifications !== undefined)
			this.applyDataModifications(dataPackage.modifications);
		if (dataPackage.namespaceChange !== undefined) {
			if (dataPackage.namespaceChange.items !== undefined) {
				this.items.registerNamespaceChange(namespace, dataPackage.namespaceChange.items);
			}
		}
	}

	registerGameData(namespace, gameData) {
		// Data Is ordered by Hard Dependencies
		if (gameData.realms !== undefined)
			this.registerRealms(namespace, gameData.realms);
		if (gameData.damageTypes !== undefined)
			this.registerDamageTypes(namespace, gameData.damageTypes);
		if (gameData.modifiers !== undefined)
			this.registerModifiers(namespace, gameData.modifiers);
		if (gameData.combatTriangleSets !== undefined)
			this.registerCombatTriangleSets(namespace, gameData.combatTriangleSets);
		if (gameData.combatEffectGroups !== undefined)
			this.registerCombatEffectGroups(namespace, gameData.combatEffectGroups);
		if (gameData.combatEffectTemplates !== undefined)
			this.registerCombatEffectTemplates(namespace, gameData.combatEffectTemplates);
		if (gameData.combatEffects !== undefined)
			this.registerCombatEffects(namespace, gameData.combatEffects);
		if (gameData.combatEffectTables !== undefined)
			this.registerCombatEffectTables(namespace, gameData.combatEffectTables);
		if (gameData.combatPassives !== undefined)
			this.registerCombatPassiveData(namespace, gameData.combatPassives);
		if (gameData.attacks !== undefined)
			this.registerAttackData(namespace, gameData.attacks);
		if (gameData.pages !== undefined)
			this.registerPages(namespace, gameData.pages);
		if (gameData.pets !== undefined)
			this.registerPets(namespace, gameData.pets);
		if (gameData.attackStyles !== undefined)
			this.registerAttackStyles(namespace, gameData.attackStyles);
		if (gameData.prayers !== undefined)
			this.registerPrayerData(namespace, gameData.prayers);
		if (gameData.equipmentSlots !== undefined)
			this.registerEquipmentSlotData(namespace, gameData.equipmentSlots);
		if (gameData.items !== undefined)
			this.registerItemData(namespace, gameData.items);
		if (gameData.bankSortOrder !== undefined)
			this.bank.registerSortOrder(gameData.bankSortOrder);
		if (gameData.itemUpgrades !== undefined)
			this.bank.registerItemUpgrades(gameData.itemUpgrades);
		if (gameData.itemSynergies !== undefined)
			this.registerItemSynergies(gameData.itemSynergies);
		if (gameData.randomGems !== undefined)
			this.randomGemTable.registerDrops(this, gameData.randomGems);
		if (gameData.randomSuperiorGems !== undefined)
			this.randomSuperiorGemTable.registerDrops(this, gameData.randomSuperiorGems);
		if (gameData.randomAbyssalGems !== undefined)
			this.randomAbyssalGemTable.registerDrops(this, gameData.randomAbyssalGems);
		if (gameData.randomFragments !== undefined)
			this.randomFragmentTable.registerDrops(this, gameData.randomFragments);
		if (gameData.randomFiremakingOils !== undefined)
			this.randomFiremakingOilTable.registerDrops(this, gameData.randomFiremakingOils);
		if (gameData.golbinRaid !== undefined)
			this.golbinRaid.registerData(gameData.golbinRaid);
		if (gameData.skillLevelCapIncreases !== undefined)
			this.registerSkillLevelCapIncreases(namespace, gameData.skillLevelCapIncreases);
		if (gameData.gamemodes !== undefined)
			this.registerGamemodes(namespace, gameData.gamemodes);
		if (gameData.attackSpellbooks !== undefined)
			this.registerAttackSpellbookData(namespace, gameData.attackSpellbooks);
		if (gameData.attackSpells !== undefined)
			this.registerAttackSpellData(namespace, gameData.attackSpells);
		if (gameData.standardSpells !== undefined)
			this.registerStandardSpellData(namespace, gameData.standardSpells);
		if (gameData.ancientSpells !== undefined)
			this.registerAncientSpellData(namespace, gameData.ancientSpells);
		if (gameData.archaicSpells !== undefined)
			this.registerArchaicSpellData(namespace, gameData.archaicSpells);
		if (gameData.auroraSpells !== undefined)
			this.registerAuroraSpellData(namespace, gameData.auroraSpells);
		if (gameData.curseSpells !== undefined)
			this.registerCurseSpellData(namespace, gameData.curseSpells);
		if (gameData.monsters !== undefined)
			this.registerMonsterData(namespace, gameData.monsters);
		if (gameData.itmMonsters !== undefined)
			this.registerRandomMonsters(gameData.itmMonsters, this.combat.itmMonsters);
		if (gameData.spiderLairMonsters !== undefined)
			this.registerRandomMonsters(gameData.spiderLairMonsters, this.combat.spiderLairMonsters);
		if (gameData.combatAreas !== undefined)
			this.registerCombatAreaData(namespace, gameData.combatAreas);
		if (gameData.slayerAreas !== undefined)
			this.registerSlayerAreaData(namespace, gameData.slayerAreas);
		if (gameData.combatEvents !== undefined)
			this.registerCombatEventData(namespace, gameData.combatEvents);
		if (gameData.dungeons !== undefined)
			this.registerDungeonData(namespace, gameData.dungeons);
		if (gameData.abyssDepths !== undefined)
			this.registerAbyssDepthData(namespace, gameData.abyssDepths);
		if (gameData.strongholds !== undefined)
			this.registerStrongholdData(namespace, gameData.strongholds);
		if (gameData.combatAreaCategories !== undefined)
			this.registerCombatAreaCategories(namespace, gameData.combatAreaCategories);
		if (gameData.combatAreaCategoryOrder !== undefined)
			this.combatAreaCategoryOrder.registerData(gameData.combatAreaCategoryOrder);
		this.registerOldAreaDisplayOrders(gameData);
		if (gameData.slayerTaskCategories !== undefined)
			this.registerSlayerTaskCategories(namespace, gameData.slayerTaskCategories);
		if (gameData.shopCategories !== undefined)
			this.registerShopCategories(namespace, gameData.shopCategories);
		if (gameData.shopCategoryOrder !== undefined)
			this.shop.categoryDisplayOrder.registerData(gameData.shopCategoryOrder);
		if (gameData.shopPurchases !== undefined)
			this.registerShopPurchases(namespace, gameData.shopPurchases);
		if (gameData.shopDisplayOrder !== undefined)
			this.shop.purchaseDisplayOrder.registerData(gameData.shopDisplayOrder);
		if (gameData.shopUpgradeChains !== undefined)
			this.registerShopUpgradeChains(namespace, gameData.shopUpgradeChains);
		if (gameData.skillTreesDisplayOrder !== undefined)
			this.skillTreesDisplayOrder.registerData(gameData.skillTreesDisplayOrder);
		if (gameData.ancientRelics !== undefined)
			this.registerAncientRelics(namespace, gameData.ancientRelics);
		if (gameData.ancientRelicsDisplayOrder !== undefined)
			this.ancientRelicsDisplayOrder.registerData(gameData.ancientRelicsDisplayOrder);
		if (gameData.skillData !== undefined) {
			gameData.skillData.forEach((skillsData) => {
				const skill = this.skills.getObjectByID(skillsData.skillID);
				if (skill === undefined)
					throw new Error(`Error registering data package. Cannot register data for unregistered skill: ${skillsData.skillID}.`);
				skill.registerData(namespace, skillsData.data);
			});
		}
		if (!namespace.isModded && gameData.steamAchievements !== undefined)
			this.registerSteamAchievements(gameData.steamAchievements);
		if (gameData.lore !== undefined)
			this.lore.registerLore(namespace, gameData.lore);
		if (!namespace.isModded) {
			if (gameData.tutorialStages !== undefined)
				this.tutorial.registerStages(namespace, gameData.tutorialStages);
			if (gameData.tutorialStageOrder !== undefined)
				this.tutorial.registerStageOrder(gameData.tutorialStageOrder);
		}
		// Register Soft Data Depedencies
		for (let i = 0; i < this.softDataRegQueue.length; i++) {
			const { data, object, where } = this.softDataRegQueue[i];
			try {
				object.registerSoftDependencies(data, this);
			}
			catch (e) {
				if (where !== undefined) {
					throw new Error(`Error registering soft data dependency in ${where}: ${e}`);
				}
				throw e;
			}
		}
		this.softDataRegQueue = [];
	}
	applyDataModifications(modificationData) {
		var _a, _b, _c;
		if (modificationData.modifiers !== undefined) {
			modificationData.modifiers.forEach((modData) => {
				const modifier = this.modifierRegistry.getObjectByID(modData.id);
				if (modifier === undefined)
					throw new UnregisteredDataModError(Modifier.name, modData.id);
				modifier.applyDataModification(modData, this);
				this.modifierRegistry.updateAliases(modifier);
			});
		}
		if (modificationData.gamemodes !== undefined) {
			modificationData.gamemodes.forEach((modData) => {
				const gamemode = this.gamemodes.getObjectByID(modData.id);
				if (gamemode === undefined)
					throw new UnregisteredDataModError(Gamemode.name, modData.id);
				gamemode.applyDataModification(modData, this);
			});
		}
		if (modificationData.combatAreas !== undefined) {
			modificationData.combatAreas.forEach((modData) => {
				const combatArea = this.combatAreas.getObjectByID(modData.id);
				if (combatArea === undefined)
					throw new UnregisteredDataModError(CombatArea.name, modData.id);
				combatArea.applyDataModification(modData, this);
			});
		}
		if (modificationData.dungeons !== undefined) {
			modificationData.dungeons.forEach((modData) => {
				const dungeon = this.dungeons.getObjectByID(modData.id);
				if (dungeon === undefined)
					throw new UnregisteredDataModError(Dungeon.name, modData.id);
				dungeon.applyDataModification(modData, this);
			});
		}
		if (modificationData.items !== undefined) {
			modificationData.items.forEach((modData) => {
				const item = this.items.getObjectByID(modData.id);
				if (item === undefined)
					throw new UnregisteredDataModError(Item.name, modData.id);
				item.applyDataModification(modData, this);
			});
		}
		if (modificationData.monsters !== undefined) {
			modificationData.monsters.forEach((modData) => {
				const monster = this.monsters.getObjectByID(modData.id);
				if (monster === undefined)
					throw new UnregisteredDataModError(Monster.name, modData.id);
				monster.applyDataModification(modData, this);
			});
		}
		if (modificationData.shopPurchases !== undefined) {
			modificationData.shopPurchases.forEach((modData) => {
				const purchase = this.shop.purchases.getObjectByID(modData.id);
				if (purchase === undefined)
					throw new UnregisteredDataModError(ShopPurchase.name, modData.id);
				purchase.applyDataModification(modData, this);
			});
		}
		if (modificationData.slayerAreas !== undefined) {
			modificationData.slayerAreas.forEach((modData) => {
				const slayerAreas = this.slayerAreas.getObjectByID(modData.id);
				if (slayerAreas === undefined)
					throw new UnregisteredDataModError(SlayerArea.name, modData.id);
				slayerAreas.applyDataModification(modData, this);
			});
		}
		(_a = modificationData.shopUpgradeChains) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
			const upgradeChain = this.shop.upgradeChains.getObjectByID(modData.id);
			if (upgradeChain === undefined)
				throw new UnregisteredDataModError(ShopUpgradeChain.name, modData.id);
			upgradeChain.applyDataModification(modData, this);
		});
		(_b = modificationData.cookingCategories) === null || _b === void 0 ? void 0 : _b.forEach((modData) => {
			const category = this.cooking.categories.getObjectByID(modData.id);
			if (category === undefined)
				throw new UnregisteredDataModError(CookingCategory.name, modData.id);
			category.applyDataModification(modData, this);
		});
		(_c = modificationData.fletchingRecipes) === null || _c === void 0 ? void 0 : _c.forEach((modData) => {
			const recipe = this.fletching.actions.getObjectByID(modData.id);
			if (recipe === undefined)
				throw new UnregisteredDataModError(FletchingRecipe.name, modData.id);
			recipe.applyDataModification(modData, this);
		});
		if (modificationData.pages !== undefined) {
			modificationData.pages.forEach((modData) => {
				const page = this.pages.getObjectByID(modData.id);
				if (page === undefined)
					throw new UnregisteredDataModError(Page.name, modData.id);
				page.applyDataModification(modData, this);
			});
		}
		if (modificationData.equipmentSlots !== undefined) {
			modificationData.equipmentSlots.forEach((modData) => {
				const equipmentSlot = this.equipmentSlots.getObjectByID(modData.id);
				if (equipmentSlot === undefined)
					throw new UnregisteredDataModError(EquipmentSlot.name, modData.id);
				equipmentSlot.applyDataModification(modData, this);
			});
		}
		if (modificationData.damageTypes !== undefined) {
			modificationData.damageTypes.forEach((modData) => {
				const damageType = this.damageTypes.getObjectByID(modData.id);
				if (damageType === undefined)
					throw new UnregisteredDataModError(EquipmentSlot.name, modData.id);
				damageType.applyDataModification(modData, this);
			});
		}
		if (modificationData.combatAreaCategories !== undefined) {
			modificationData.combatAreaCategories.forEach((modData) => {
				const category = this.combatAreaCategories.getObjectByID(modData.id);
				if (category === undefined)
					throw new UnregisteredDataModError(CombatAreaCategory.name, modData.id);
				category.applyDataModification(modData, this);
			});
		}
		if (modificationData.skillData !== undefined) {
			modificationData.skillData.forEach(({ skillID, data }) => {
				const skill = this.skills.getObjectByID(skillID);
				if (skill === undefined)
					throw new UnregisteredDataModError(Skill.name, skillID);
				skill.modifyData(data);
			});
		}
		if (modificationData.skillLevelCapIncreases !== undefined) {
			modificationData.skillLevelCapIncreases.forEach((modData) => {
				const capIncrease = this.skillLevelCapIncreases.getObjectByID(modData.id);
				if (capIncrease === undefined)
					throw new UnregisteredDataModError(SkillLevelCapIncrease.name, modData.id);
				capIncrease.applyDataModification(modData, this);
			});
		}
		if (modificationData.pets !== undefined) {
			modificationData.pets.forEach((modData) => {
				const pet = this.pets.getObjectByID(modData.id);
				if (pet === undefined)
					throw new UnregisteredDataModError(Pet.name, modData.id);
				pet.applyDataModification(modData, this);
			});
		}
		if (modificationData.itemUpgrades !== undefined) {
			this.bank.modifyItemUpgrades(modificationData.itemUpgrades);
		}
	}
	// #region Registers
	registerAttackStyles(namespace, data) {
		data.forEach((data) => this.attackStyles.registerObject(new AttackStyle(namespace, data, this)));
	}
	registerItemData(namespace, data) {
		data.forEach((itemData) => {
			if (itemData.isDebug && !DEBUGENABLED)
				return;
			switch (itemData.itemType) {
				case 'Item':
					this.items.registerObject(new Item(namespace, itemData, this));
					break;
				case 'Equipment':
					this.items.registerObject(new EquipmentItem(namespace, itemData, this));
					break;
				case 'Weapon':
					this.items.registerObject(new WeaponItem(namespace, itemData, this));
					break;
				case 'Food':
					this.items.registerObject(new FoodItem(namespace, itemData, this));
					break;
				case 'Bone':
					this.items.registerObject(new BoneItem(namespace, itemData, this));
					break;
				case 'Potion':
					this.items.registerObject(new PotionItem(namespace, itemData, this));
					break;
				case 'Readable':
					this.items.registerObject(new ReadableItem(namespace, itemData, this));
					break;
				case 'Openable':
					this.items.registerObject(new OpenableItem(namespace, itemData, this));
					break;
				case 'Token':
					this.items.registerObject(new TokenItem(namespace, itemData, this));
					break;
				case 'MasteryToken':
					this.items.registerObject(new MasteryTokenItem(namespace, itemData, this));
					break;
				case 'Compost':
					this.items.registerObject(new CompostItem(namespace, itemData, this));
					break;
				case 'Soul':
					this.items.registerObject(new SoulItem(namespace, itemData, this));
					break;
				case 'Rune':
					this.items.registerObject(new RuneItem(namespace, itemData, this));
					break;
				case 'FiremakingOil':
					this.items.registerObject(new FiremakingOilItem(namespace, itemData, this));
					break;
			}
		});
	}
	registerAttackData(namespace, data) {
		data.forEach((attackData) => {
			this.specialAttacks.registerObject(new SpecialAttack(namespace, attackData, this));
		});
	}
	registerCombatEffectGroups(namespace, data) {
		data.forEach((data) => this.combatEffectGroups.registerObject(new CombatEffectGroup(namespace, data)));
	}
	registerCombatEffectTemplates(namespace, data) {
		data.forEach((data) => this.combatEffectTemplates.registerObject(new CombatEffectTemplate(namespace, data, this)));
	}
	registerCombatEffects(namespace, data) {
		data.forEach((data) => {
			let effect;
			if ('templateID' in data) {
				const template = this.combatEffectTemplates.getObjectByID(data.templateID);
				if (template === undefined)
					throw new Error(`Error registering CombatEffect with id: ${data.id}. CombatEffectTemplate with id: ${data.templateID} is not registered.`);
				effect = template.createEffect(namespace, data, this);
			}
			else {
				effect = new CombatEffect(namespace, data, this);
			}
			this.combatEffects.registerObject(effect);
		});
	}
	registerCombatEffectTables(namespace, data) {
		data.forEach((data) => this.combatEffectTables.registerObject(new CombatEffectTable(namespace, data, this)));
	}
	registerCombatPassiveData(namespace, data) {
		// Special passive that scales
		if (namespace.name === "melvorF" /* Namespaces.Full */)
			this.combatPassives.registerObject(new ControlledAffliction(namespace, this));
		data.forEach((passiveData) => {
			this.combatPassives.registerObject(new CombatPassive(namespace, passiveData, this));
		});
	}
	registerMonsterData(namespace, data) {
		data.forEach((monsterData) => {
			this.monsters.registerObject(new Monster(namespace, monsterData, this));
		});
	}
	registerRandomMonsters(monsterIDs, monsterArray) {
		monsterIDs.forEach((monsterID) => {
			const monster = this.monsters.getObjectByID(monsterID);
			if (monster === undefined)
				throw new Error(`Error registering random dungeon monsters, monster with id: ${monsterID} is not registered.`);
			monsterArray.push(monster);
		});
	}
	registerCombatAreaData(namespace, data) {
		data.forEach((data) => {
			this.combatAreas.registerObject(new CombatArea(namespace, data, this));
		});
	}
	registerSlayerAreaData(namespace, data) {
		data.forEach((data) => {
			this.combatAreas.registerObject(new SlayerArea(namespace, data, this));
		});
	}
	registerDungeonData(namespace, data) {
		data.forEach((data) => {
			this.combatAreas.registerObject(new Dungeon(namespace, data, this));
		});
	}
	registerAbyssDepthData(namespace, data) {
		data.forEach((data) => {
			this.combatAreas.registerObject(new AbyssDepth(namespace, data, this));
		});
	}
	registerStrongholdData(namespace, data) {
		data.forEach((data) => {
			this.combatAreas.registerObject(new Stronghold(namespace, data, this));
		});
	}
	registerCombatAreaCategories(namespace, data) {
		data.forEach((data) => {
			this.combatAreaCategories.registerObject(new CombatAreaCategory(namespace, data, this));
		});
	}
	/** Provides backwards compatability for the old data format for combat area orders */
	registerOldAreaDisplayOrders(gameData) {
		if (gameData.combatAreaDisplayOrder !== undefined) {
			const category = this.combatAreaCategories.getObjectByID('melvorD:CombatAreas');
			if (category !== undefined)
				category.applyDataModification({ id: '', areas: { add: gameData.combatAreaDisplayOrder } }, this);
		}
		if (gameData.slayerAreaDisplayOrder !== undefined) {
			const category = this.combatAreaCategories.getObjectByID('melvorF:SlayerAreas');
			if (category !== undefined)
				category.applyDataModification({ id: '', areas: { add: gameData.slayerAreaDisplayOrder } }, this);
		}
		if (gameData.dungeonDisplayOrder !== undefined) {
			const category = this.combatAreaCategories.getObjectByID('melvorD:Dungeons');
			if (category !== undefined)
				category.applyDataModification({ id: '', areas: { add: gameData.dungeonDisplayOrder } }, this);
		}
	}
	registerCombatEventData(namespace, data) {
		data.forEach((data) => {
			this.combatEvents.registerObject(new CombatEvent(namespace, data, this));
		});
	}
	registerSlayerTaskCategories(namespace, data) {
		data.forEach((data) => {
			this.combat.slayerTask.categories.registerObject(new SlayerTaskCategory(namespace, data, this));
		});
	}
	registerPrayerData(namespace, data) {
		data.forEach((data) => this.prayers.registerObject(new ActivePrayer(namespace, data, this)));
	}
	registerAttackSpellbookData(namespace, data) {
		data.forEach((data) => this.attackSpellbooks.registerObject(new AttackSpellbook(namespace, data)));
	}
	registerAttackSpellData(namespace, data) {
		data.forEach((data) => this.attackSpells.registerObject(new AttackSpell(namespace, data, this)));
	}
	registerOldAttackSpellData(namespace, data, spellbook) {
		data.forEach((data) => {
			data.spellbook = spellbook;
			this.attackSpells.registerObject(new AttackSpell(namespace, data, this));
		});
	}
	registerStandardSpellData(namespace, data) {
		console.warn('The "standardSpells" property is deprecated. Use "attackSpells" instead.');
		this.registerOldAttackSpellData(namespace, data, "melvorD:Standard" /* AttackSpellbookIds.Standard */);
	}
	registerAncientSpellData(namespace, data) {
		console.warn('The "ancientSpells" property is deprecated. Use "attackSpells" instead.');
		this.registerOldAttackSpellData(namespace, data, "melvorF:Ancient" /* AttackSpellbookIds.Ancient */);
	}
	registerArchaicSpellData(namespace, data) {
		console.warn('The "archaicSpells" property is deprecated. Use "attackSpells" instead.');
		this.registerOldAttackSpellData(namespace, data, "melvorTotH:Archaic" /* AttackSpellbookIds.Archaic */);
	}
	registerCurseSpellData(namespace, data) {
		data.forEach((data) => this.curseSpells.registerObject(new CurseSpell(namespace, data, this)));
	}
	registerAuroraSpellData(namespace, data) {
		data.forEach((data) => this.auroraSpells.registerObject(new AuroraSpell(namespace, data, this)));
	}
	registerPets(namespace, data) {
		data.forEach((data) => this.pets.registerObject(new Pet(namespace, data, this)));
	}
	registerShopCategories(namespace, data) {
		data.forEach((data) => this.shop.categories.registerObject(new ShopCategory(namespace, data, this)));
	}
	registerShopPurchases(namespace, data) {
		data.forEach((data) => this.shop.purchases.registerObject(new ShopPurchase(namespace, data, this)));
	}
	registerShopUpgradeChains(namespace, data) {
		data.forEach((data) => this.shop.upgradeChains.registerObject(new ShopUpgradeChain(namespace, data, this)));
	}
	registerItemSynergies(data) {
		data.forEach((data) => {
			const synergy = new ItemSynergy(data, this);
			synergy.items.forEach((item) => {
				if (!(typeof item === 'string')) {
					let synergyArray = this.itemSynergies.get(item);
					if (synergyArray === undefined) {
						synergyArray = [];
						this.itemSynergies.set(item, synergyArray);
					}
					synergyArray.push(synergy);
				}
			});
		});
	}
	registerSkillLevelCapIncreases(namespace, data) {
		data.forEach((capData) => this.skillLevelCapIncreases.registerObject(new SkillLevelCapIncrease(namespace, capData, this)));
	}
	registerGamemodes(namespace, data) {
		data.forEach((gamemodeData) => this.gamemodes.registerObject(new Gamemode(namespace, gamemodeData, this)));
	}
	registerSteamAchievements(data) {
		data.forEach((achieveData) => this.steamAchievements.set(achieveData.id, new SteamAchievement(achieveData, this)));
	}
	registerRealms(namespace, data) {
		data.forEach((realmData) => this.realms.registerObject(new Realm(namespace, realmData, this)));
	}
	registerDamageTypes(namespace, data) {
		data.forEach((damageTypeData) => this.damageTypes.registerObject(new DamageType(namespace, damageTypeData, this)));
	}
	registerCombatTriangleSets(namespace, data) {
		data.forEach((setData) => this.combatTriangleSets.registerObject(new CombatTriangleSet(namespace, setData)));
	}
	registerPages(namespace, data) {
		data.forEach((pageData) => this.pages.registerObject(new Page(namespace, pageData, this)));
	}
	registerAncientRelics(namespace, data) {
		data.forEach((relicData) => this.ancientRelics.registerObject(new AncientRelic(namespace, relicData, this)));
	}
	registerEquipmentSlotData(namespace, data) {
		data.forEach((slotData) => this.equipmentSlots.registerObject(new EquipmentSlot(namespace, slotData, this)));
	}
	registerModifiers(namespace, data) {
		const newModifiers = [];
		data.forEach((modifierData) => {
			const modifier = new Modifier(namespace, modifierData, this);
			newModifiers.push(modifier);
			this.modifierRegistry.registerObject(modifier);
		});
		expressions.updateModifiers(namespace, newModifiers);
	}
	/** Registers a skill. Returns the constructed instance of the skill */
	registerSkill(namespace, constructor) {
		const skillInstance = new constructor(namespace, this);
		this.skills.registerObject(skillInstance);
		this.modifierScopeSources.registerObject(skillInstance);
		let isAction = false;
		if (skillInstance.passiveTick !== undefined) {
			this.passiveActions.registerObject(skillInstance);
			isAction = true;
		}
		if (skillInstance.activeTick !== undefined) {
			this.activeActions.registerObject(skillInstance);
			isAction = true;
		}
		if (isAction)
			this.actions.registerObject(skillInstance);
		this.combat.registerStatProvider(skillInstance.providedStats);
		if (skillInstance instanceof SkillWithMastery) {
			this.masterySkills.registerObject(skillInstance);
		}
		return skillInstance;
	}
}