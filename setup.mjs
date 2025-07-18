export async function setup(ctx) {
	// #region CONST_definitions
	const IS_CO_FLAG = "isCO"
	const IS_RECO_FLAG = "isReCO"
	const bannedShopItemIDs = [
		"melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire", "melvorD:Cooking", "melvorD:Mining", "melvorD:Smithing", "melvorD:Gem", "melvorF:Thieving",
		"melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control",
		"melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar",
		"melvorAoD:CartographyUpgrade1", "melvorAoD:CartographyUpgrade2", "melvorAoD:Blessed_Bone_Offering", "melvorAoD:Superior_Cauldron", "melvorAoD:Superior_Cooking_Pot", "melvorAoD:MagicAnvil", "melvorAoD:Agility_Prosperity",
		"melvorItA:Abyssium_Harvester", "melvorItA:Abyssium_Axe_Coating", "melvorItA:Abyssium_Fishing_Rod_Coating", "melvorItA:Abyssium_Pickaxe_Coating", "melvorItA:Abyssal_Compost", "melvorItA:Abyssal_Firemaking_Oil", "melvorItA:Twisted_Firemaking_Oil", "melvorItA:Gloom_Firemaking_Oil", "melvorItA:Shadow_Firemaking_Oil", "melvorItA:Obsidian_Firemaking_Oil", "melvorItA:Voidfire_Firemaking_Oil", "melvorItA:AbyssalMining", "melvorItA:AbyssalSmithing", "melvorItA:AbyssalFiremaking", "melvorItA:AbyssalHarvesting", "melvorItA:AbyssalFletching", "melvorItA:AbyssalCrafting", "melvorItA:AbyssalHerblore", "melvorItA:AbyssalRunecrafting"
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
		var rebalanceCoGamemodes = ["hcco:remcco", "hcco:rehcco"];
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

	function PatchLoadingProcess(ctx, item_data) {
		const tempLoadLocal = loadLocalSave;
		const tempLoadCloud = loadCloudSave;
		const tempCreateNewCharacter = createNewCharacterInSlot;
		loadLocalSave = async function (slotID) {
			const gamemode = localSaveHeaders[slotID].currentGamemode;
			if (rebalanceGamemodeCheck(gamemode)) { RebalanceCOChanges() }
			if (coGamemodeCheck(gamemode)) { BaseCOChanges() }

			// yield tempLoadLocal(slotID)
			await tempLoadLocal(slotID)
		}
		loadCloudSave = async function (slotID) {
			const gamemode = cloudSaveHeaders[slotID].currentGamemode;
			if (rebalanceGamemodeCheck(gamemode)) { RebalanceCOChanges() }
			if (coGamemodeCheck(gamemode)) { BaseCOChanges() }

			// yield tempLoadCloud(slotID)
			await tempLoadCloud(slotID)
		}
		createNewCharacterInSlot = function (slotID, gamemode, characterName) {
			if (rebalanceGamemodeCheck(gamemode)) { RebalanceCOChanges() }
			if (coGamemodeCheck(gamemode)) { BaseCOChanges() }

			tempCreateNewCharacter(slotID, gamemode, characterName)
		}

		const RebalanceCOChanges = () => {
			patch_summoning.RemoveNonCombatRecipes(); // Do this before making Summoning combat so Fox / Whisp are removed
			patch_summoning.MakeSummoningCombatSkill(ctx);
			patch_summoning.PatchMarkMechanics(ctx);
			patch_summoning.MakeSummoningPetCO(IS_CO_FLAG);
			patch_shop.PatchAutoswapFood();
			patch_combat.PatchHitpointsUntilDW(ctx);

			game.registerDataPackage(item_data)
			game.registerDataPackage(mini_max_cape_data)
			game.registerDataPackage(cartography_data)
			// game.registerDataPackage(shopData)
			console.log("Rebalance CO changes loaded")
		}
		const BaseCOChanges = () => {
			patch_combat.PatchSpellCosts(ctx);
			patch_shop.RemoveNonCOTabs();
			patch_shop.RemoveNonCOItems(bannedShopItemIDs);
			patch_completion_log.PatchLog(IS_CO_FLAG, bannedShopItemIDs);
			console.log("Base CO changes loaded")
		}
	}
	// #endregion

	// #region Patches
	const patch_shop = new (await ctx.loadModule('scripts/patch_shop.mjs')).PatchShop();
	const patch_sidebar = new (await ctx.loadModule('scripts/patch_sidebar.mjs')).PatchSidebar();
	const patch_summoning = new (await ctx.loadModule('scripts/patch_summoning.mjs')).PatchSummoning();
	const patch_completion_log = new (await ctx.loadModule('scripts/patch_completion_log.mjs')).PatchCompletionLog();
	const patch_slayer_reroll = new (await ctx.loadModule('scripts/patch_slayer_reroll.mjs')).PatchSlayerReroll();
	const patch_combat = new (await ctx.loadModule('scripts/patch_combat.mjs')).PatchCombat();
	// #endregion

	// #region Optional_cosmetic_changes
	const patch_loot_menu = new (await ctx.loadModule('scripts/patch_loot_menu.mjs')).PatchLootMenu();
	const patch_dungeons = new (await ctx.loadModule('scripts/patch_dungeons.mjs')).PatchDungeons();
	// #endregion

	// #region Imports
	const item_data = await ctx.loadData('data/drop_table_modifications.json');
	const mini_max_cape_data = await ctx.loadData('data/mini_max_capes.json');
	const cartography_data = await ctx.loadData('data/cartography.json');
	const shop_data = await ctx.loadData('data/shop_additions.json');
	//#endregion

	// #region Lifecycle_hooks
	ctx.onModsLoaded((ctx) => {
		SetCOFlags();
		PatchLoadingProcess(ctx, item_data);
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

		// patch_slayer_reroll.AddRepeatSlayerTaskButton();
	});
	ctx.onInterfaceReady((ctx) => {
		if (!coGamemodeCheck()) { return; }
		patch_sidebar.RemoveNonCombatCategories();
		// patch_loot_menu.PatchMonsterLootMenu(ctx);
		// patch_loot_menu.PatchChestRewardsMenu();
		if (!rebalanceGamemodeCheck()) { return; }

		patch_sidebar.ReorderSkillInCombatCategory("melvorD:Summoning");
		// patch_sidebar.ReorderSkillInCombatCategory("melvorAoD:Archaeology");
		patch_summoning.SummoningHTMLModifications(ctx);

	})
	// #endregion Lifecycle_hooks
}