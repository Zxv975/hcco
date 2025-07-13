export async function setup(ctx) {
	// #region CONST_definitions
	const IS_CO_FLAG = "isCO"
	const IS_RECO_FLAG = "isReCO"
	const bannedShopItemIDs = [
		"melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire",
		"melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control",
		"melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar",
		"melvorAoD:CartographyUpgrade1", "melvorAoD:CartographyUpgrade2", "melvorAoD:Blessed_Bone_Offering", "melvorAoD:Superior_Cauldron", "melvorAoD:Superior_Cooking_Pot", "melvorAoD:MagicAnvil", "melvorAoD:Agility_Prosperity",
		"melvorItA:Abyssium_Harvester", "melvorItA:Abyssium_Axe_Coating", "melvorItA:Abyssium_Fishing_Rod_Coating", "melvorItA:Abyssium_Pickaxe_Coating", "melvorItA:Abyssal_Compost", "melvorItA:Abyssal_Firemaking_Oil", "melvorItA:Twisted_Firemaking_Oil", "melvorItA:Gloom_Firemaking_Oil", "melvorItA:Shadow_Firemaking_Oil", "melvorItA:Obsidian_Firemaking_Oil", "melvorItA:Voidfire_Firemaking_Oil",
	]
	// #endregion
	// #region Setup_functions
	const SetCOFlags = () => {
		var coGamemodes = ["hcco:mcco", "hcco:hcco", "hcco:remcco", "hcco:rehcco"];
		coGamemodes.forEach(gm => {
			if (game.gamemodes.getObjectByID(gm) != undefined) {
				game.gamemodes.getObjectByID(gm)[IS_CO_FLAG] = true
			}
		})
		var rebalanceCoGamemodes = ["hcco:mcco", "hcco:hcco"];
		rebalanceCoGamemodes.forEach(gm => {
			if (game.gamemodes.getObjectByID(gm) != undefined) {
				game.gamemodes.getObjectByID(gm)[IS_RECO_FLAG] = true
			}
		})
	}
	const coGamemodeCheck = (currentGame = game.currentGamemode) => currentGame[IS_CO_FLAG] === true // Check if the user is playing a CO game mode
	const rebalanceGamemodeCheck = (currentGame = game.currentGamemode) => currentGame[IS_RECO_FLAG] === true // Check if the user is playing a rebalanced game mode
	const preLoadGamemodeCheck = (currentCharacter, startingGamemode) => // Check if the user is playing a CO mode using the method available before the character is loaded (checking game slots)
		coGamemodeCheck(localSaveHeaders[currentCharacter].currentGamemode) || coGamemodeCheck(cloudSaveHeaders[currentCharacter].currentGamemode) || coGamemodeCheck(startingGamemode)

	function PatchLoadingProcess(ctx, itemData) {
		let temp = loadLocalSave;
		let temp2 = loadCloudSave;
		let temp3 = createNewCharacterInSlot;

		const RebalanceCOChanges = (gamemode) => {
			patch_summoning.RemoveNonCombatRecipes(); // Do this before making Summoning combat so Fox / Whisp are removed
			patch_summoning.MakeSummoningCombatSkill(ctx);
			patch_summoning.PatchMarkMechanics(ctx);
			patch_summoning.MakeSummoningPetCO(IS_CO_FLAG);

			game.registerDataPackage(itemData)
			game.registerDataPackage(miniMaxCapeData)
			game.registerDataPackage(cartographyData)
			// game.registerDataPackage(shopData)
			console.log("Rebalance CO changes loaded")
		}
		const BaseCOChanges = (gamemode) => {
			patch_shop.RemoveNonCOTabs();
			patch_shop.RemoveNonCOItems(gamemode, bannedShopItemIDs);
			patch_completion_log.PatchLog(IS_CO_FLAG, bannedShopItemIDs);
			console.log("Base CO changes loaded")
		}
		loadLocalSave = function (slotID) {
			const gamemode = localSaveHeaders[slotID].currentGamemode;
			if (rebalanceGamemodeCheck(gamemode)) {
				RebalanceCOChanges(gamemode)
			} if (coGamemodeCheck(gamemode)) {
				BaseCOChanges(gamemode)
			}

			temp(slotID)
		}
		loadCloudSave = function (slotID) {
			const gamemode = cloudSaveHeaders[slotID].currentGamemode;
			if (rebalanceGamemodeCheck(gamemode)) {
				RebalanceCOChanges(gamemode)
			} if (coGamemodeCheck(gamemode)) {
				BaseCOChanges(gamemode)
			}

			temp2(slotID)
		}
		createNewCharacterInSlot = function (slotID, gamemode, characterName) {
			if (rebalanceGamemodeCheck(gamemode)) {
				RebalanceCOChanges(gamemode)
			} if (coGamemodeCheck(gamemode)) {
				BaseCOChanges(gamemode)
			}

			temp3(slotID, gamemode, characterName)
		}
	}
	// #endregion

	// #region Patches
	const patch_shop = new (await ctx.loadModule('scripts/patch_shop.mjs')).PatchShop();
	const patch_sidebar = new (await ctx.loadModule('scripts/patch_sidebar.mjs')).PatchSidebar();
	const patch_summoning = new (await ctx.loadModule('scripts/patch_summoning.mjs')).PatchSummoning();
	const patch_completion_log = new (await ctx.loadModule('scripts/patch_completion_log.mjs')).PatchCompletionLog();
	const patch_slayer_reroll = new (await ctx.loadModule('scripts/patch_slayer_reroll.mjs')).PatchSlayerReroll();
	// #endregion

	// #region Optional_cosmetic_changes
	const patch_loot_menu = new (await ctx.loadModule('scripts/patch_loot_menu.mjs')).PatchLootMenu();
	const patch_dungeons = new (await ctx.loadModule('scripts/patch_dungeons.mjs')).PatchDungeons();
	// #endregion

	// #region Imports
	const itemData = await ctx.loadData('data/drop_table_modifications.json');
	const miniMaxCapeData = await ctx.loadData('data/mini_max_capes.json');
	const cartographyData = await ctx.loadData('data/cartography.json');
	const shopData = await ctx.loadData('data/shop_additions.json');
	//#endregion

	// #region Lifecycle_hooks
	ctx.onModsLoaded((ctx) => {
		SetCOFlags();
		PatchLoadingProcess(ctx, itemData);
	})
	ctx.onCharacterSelectionLoaded((ctx) => {
	})
	ctx.onInterfaceAvailable(async (ctx) => {
		if (!preLoadGamemodeCheck(currentCharacter, startingGamemode))
			return;
	});
	ctx.onCharacterLoaded((ctx) => {
		if (!coGamemodeCheck()) { return; }
		if (!rebalanceGamemodeCheck()) { return; }

		patch_loot_menu.PatchMonsterLootMenu(ctx);
		patch_loot_menu.PatchChestRewardsMenu();

		// patch_slayer_reroll.AddRepeatSlayerTaskButton();
	});
	ctx.onInterfaceReady((ctx) => {
		if (!coGamemodeCheck()) { return; }
		if (!rebalanceGamemodeCheck()) { return; }

		patch_sidebar.ReorderSkillInCombatCategory("melvorD:Summoning");
		patch_sidebar.RemoveNonCombatCategories();
		patch_summoning.SummoningHTMLModifications(ctx);
	})
	// #endregion Lifecycle_hooks
}