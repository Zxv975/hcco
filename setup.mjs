export async function setup(ctx) {
	// #region CONST_definitions
	const IS_CO = "isCO"
	const IS_RECO = "isReCO"
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
				game.gamemodes.getObjectByID(gm)[IS_CO] = true
			}
		})
		var rebalanceCoGamemodes = ["hcco:remcco", "hcco:rehcco"];
		rebalanceCoGamemodes.forEach(gm => {
			if (game.gamemodes.getObjectByID(gm) != undefined) {
				game.gamemodes.getObjectByID(gm)[IS_RECO] = true
			}
		})
	}
	const coGamemodeCheck = (currentGame = game.currentGamemode) => currentGame[IS_CO] === true // Check if the user is playing a CO game mode
	const rebalanceGamemodeCheck = (currentGame = game.currentGamemode) => currentGame[IS_RECO] === true // Check if the user is playing a rebalanced game mode
	const preLoadGamemodeCheck = (currentCharacter, startingGamemode) => // Check if the user is playing a CO mode using the method available before the character is loaded (checking game slots)
		coGamemodeCheck(localSaveHeaders[currentCharacter].currentGamemode) || coGamemodeCheck(cloudSaveHeaders[currentCharacter].currentGamemode) || coGamemodeCheck(startingGamemode)

	function PatchLoadingProcess(ctx, item_data) {
		const tempLoadLocal = loadLocalSave;
		const tempLoadCloud = loadCloudSave;
		const tempCreateNewCharacter = createNewCharacterInSlot;
		loadLocalSave = async function (slotID) {
			const gamemode = localSaveHeaders[slotID].currentGamemode;
			if (rebalanceGamemodeCheck(gamemode)) { RebalanceCOChanges(gamemode) }
			if (coGamemodeCheck(gamemode)) { BaseCOChanges(gamemode) }

			await tempLoadLocal(slotID)
		}
		loadCloudSave = async function (slotID) {
			const gamemode = cloudSaveHeaders[slotID].currentGamemode;
			if (rebalanceGamemodeCheck(gamemode)) { RebalanceCOChanges(gamemode) }
			if (coGamemodeCheck(gamemode)) { BaseCOChanges(gamemode) }

			await tempLoadCloud(slotID)
		}
		createNewCharacterInSlot = function (slotID, gamemode, characterName) {
			if (rebalanceGamemodeCheck(gamemode)) { RebalanceCOChanges(gamemode) }
			if (coGamemodeCheck(gamemode)) { BaseCOChanges(gamemode) }

			tempCreateNewCharacter(slotID, gamemode, characterName)
		}

		const RebalanceCOChanges = (gamemode) => {
			patch_summoning.RemoveNonCombatRecipes(); // Do this before making Summoning combat so Fox / Whisp are removed
			patch_summoning.MakeSummoningCombatSkill(ctx);
			patch_summoning.PatchMarkMechanics(ctx);
			patch_summoning.MakeSummoningPetCO(IS_CO);
			patch_summoning.PatchSummoningSkillTree();
			patch_shop.PatchAutoswapFood();
			patch_combat.PatchHitpointsUntilDW(ctx);
			patch_dungeons.FixDungeonRewardsAdd(ctx) // Base game bugfix

			game.registerDataPackage(item_data)
			game.registerDataPackage(mini_max_cape_data)
			game.registerDataPackage(cartography_data)
			// game.registerDataPackage(shopData)
			console.log("Rebalance CO changes loaded")
		}
		const BaseCOChanges = (gamemode) => {
			game.registerDataPackage(hidden_shop_category)
			patch_combat.PatchSpellCosts(ctx);
			patch_shop.RemoveNonCOTabs();
			patch_shop.RemoveNonCOItems(bannedShopItemIDs);
			patch_completion_log.PatchLog(IS_CO, rebalanceGamemodeCheck(gamemode), bannedShopItemIDs, ctx);
			patch_achievements.RemoveSteamAchievements();
			patch_shop.PatchTotalUpgradesForGolbinBug(ctx)

			if (!rebalanceGamemodeCheck(gamemode)) {
				console.log("Removing mark drops entirely from non-Rebalance")
				patch_summoning.RemoveMarkDrop(ctx)
			}
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

	const patch_achievements = new (await ctx.loadModule('scripts/patch_achievements.mjs')).PatchAchievements();
	const patch_dungeons = new (await ctx.loadModule('scripts/patch_dungeons.mjs')).PatchDungeons();

	// #region Imports
	const item_data = await ctx.loadData('data/drop_table_modifications.json');
	const mini_max_cape_data = await ctx.loadData('data/mini_max_capes.json');
	const cartography_data = await ctx.loadData('data/cartography.json');
	const hidden_shop_category = await ctx.loadData('data/hidden_shop_category.json');
	const shop_data = await ctx.loadData('data/shop_additions.json');
	//#endregion

	// #region Game_diff
	const data_loader = new (await ctx.loadModule('diff/data_loader.mjs')).DataLoader();
	const game_diff = new (await ctx.loadModule('diff/game_diff.mjs')).GameDiff();
	// #endregion

	// #region Lifecycle_hooks
	ctx.onModsLoaded((ctx) => {
		SetCOFlags();
		mod.api.mythCombatSimulator?.registerNamespace("hcco")
		PatchLoadingProcess(ctx, item_data);
	})

	ctx.onCharacterSelectionLoaded(async (ctx) => {
		// Testing
		// const base_game_data = await data_loader.FetchData()
		// const dat = await game_diff.CreateDiffModal(base_game_data, item_data);
		// console.log(dat)
	})
	ctx.onInterfaceAvailable(async (ctx) => {
		if (!preLoadGamemodeCheck(currentCharacter, startingGamemode)) { return; }

	});
	ctx.onCharacterLoaded(async (ctx) => {
		if (!coGamemodeCheck()) { return; }
		if (!rebalanceGamemodeCheck()) { return; }

		// patch_slayer_reroll.AddRepeatSlayerTaskButton();
	});
	ctx.onInterfaceReady(async (ctx) => {
		if (!coGamemodeCheck()) { return; }
		patch_sidebar.RemoveNonCombatCategories();
		if (!rebalanceGamemodeCheck()) { return; }
		const base_game_data = await data_loader.FetchData()
		const dat = await game_diff.CreateDiffModal(base_game_data, item_data);
		await patch_sidebar.AddHCCOSubCategory(dat)
		patch_sidebar.ReorderSkillInCombatCategory("melvorD:Summoning");
		patch_summoning.SummoningHTMLModifications(ctx);
	})

	// #endregion Lifecycle_hooks
}