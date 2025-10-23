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
		var coGamemodes = ["hcco:mcco", "hcco:hcco", "hcco:remcco", "hcco:rehcco", "hcco:arco", "hcco:rearco"];
		coGamemodes.forEach(gm => {
			if (game.gamemodes.getObjectByID(gm) != undefined) {
				game.gamemodes.getObjectByID(gm)[IS_CO] = true
			}
		})
		var rebalanceCoGamemodes = ["hcco:remcco", "hcco:rehcco", "hcco:rearco"];
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
			patch_summoning.MakeSummoningMarksDeterministic(ctx)
			patch_summoning.MakeSummoningPetCO(IS_CO, ctx);
			if (cloudManager.hasItAEntitlementAndIsEnabled) {
				patch_summoning.PatchSummoningSkillTree();
			}
			patch_shop.PatchAutoswapFood();
			patch_combat.PatchHitpointsUntilDW(ctx);
			patch_dungeons.FixDungeonRewardsAdd(ctx) // Base game bugfix
			patch_dungeons.RemoveDungeonUnlockRequirements();
			patch_items.PatchDescription("melvorTotH:Book_of_the_Ancients", "While using Normal Damage: +15% Magic Damage Bonus from Equipment and +25% Summoning Maximum Hit. Reduces the Light and Body Rune cost of spells by 2, and the Fire Rune cost of spells by 4 when equipped. Also grants access to Tier IV Auroras when equipped.");
			// game.registerDataPackage(shop_additions)
			game.registerDataPackage(item_data)
			game.registerDataPackage(mini_max_cape_data)
			game.registerDataPackage(cartography_data)
			game.registerDataPackage(npc_data)
			game.registerDataPackage(prayer_data)
			// game.registerDataPackage(dungeon_req_mods) // idk why this didnt work
			// game.registerDataPackage(shopData)
			console.log("Rebalance CO changes loaded")
		}
		const BaseCOChanges = (gamemode) => {
			game.registerDataPackage(hidden_shop_category)
			patch_combat.PatchSpellCosts(ctx);
			game.skills.filter(x => x.isModded).forEach(x => {
				x[IS_CO] = x.isCombat // If the skill was already a combat skill, keep it
				patch_non_combat_skills.MakeModdedSkillCombatOnly(x.id, IS_CO)
			})
			patch_shop.RemoveNonCOTabs();
			patch_shop.RemoveNonCOItems(bannedShopItemIDs);
			patch_completion_log.PatchLog(IS_CO, rebalanceGamemodeCheck(gamemode), bannedShopItemIDs, ctx);
			patch_achievements.RemoveSteamAchievements();
			patch_shop.PatchTotalUpgradesForGolbinBug(ctx)
			patch_shop.PatchMilestoneHTMLForShopRemovalBug(ctx)

			if (!rebalanceGamemodeCheck(gamemode)) {
				patch_summoning.RemoveMarkDrop(ctx) // Removing mark drops entirely from non-Rebalance
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
	const patch_combat = new (await ctx.loadModule('scripts/patch_combat.mjs')).PatchCombat();
	const patch_non_combat_skills = new (await ctx.loadModule('scripts/patch_non_combat_skills.mjs')).PatchNonCombatSkills();
	const patch_items = new (await ctx.loadModule('scripts/patch_items.mjs')).PatchItems();
	// const patch_custom_shop = new (await ctx.loadModule('scripts/patch_custom_shop.mjs')).PatchCustomShop();
	// const patch_loader = new (await ctx.loadModule('scripts/patch_loader.mjs')).PatchLoader();
	// #endregion

	const patch_achievements = new (await ctx.loadModule('scripts/patch_achievements.mjs')).PatchAchievements();
	const patch_dungeons = new (await ctx.loadModule('scripts/patch_dungeons.mjs')).PatchDungeons();

	// #region Imports
	const item_data = await ctx.loadData('data/drop_table_modifications.json');
	const mini_max_cape_data = await ctx.loadData('data/mini_max_capes.json');
	const cartography_data = await ctx.loadData('data/cartography.json');
	const hidden_shop_category = await ctx.loadData('data/hidden_shop_category.json');
	const shop_additions = await ctx.loadData('data/shop_additions.json');
	const npc_data = await ctx.loadData('data/new_npcs.json');
	const prayer_data = await ctx.loadData('data/prayers.json');
	// const dungeon_req_mods = await ctx.loadData('data/dungeon_requirements_modifications.json'); // idk why this didnt work
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
	})
	ctx.onInterfaceAvailable(async (ctx) => {
		if (!preLoadGamemodeCheck(currentCharacter, startingGamemode)) { return; }

	});
	ctx.onCharacterLoaded(async (ctx) => {
		if (!coGamemodeCheck()) { return; }
		if (!rebalanceGamemodeCheck()) { return; }

		// patch_custom_shop.AddCustomShopPurchase("hcco:Repeat_Slayer", "hcco:repeatSlayerUnlocked", 1)
	});
	ctx.onInterfaceReady(async (ctx) => {
		if (!coGamemodeCheck()) { return; }
		patch_sidebar.RemoveNonCombatCategories();
		if (!rebalanceGamemodeCheck()) { return; }
		const base_game_data = await data_loader.FetchData()
		const dat = await game_diff.ParseGameData(base_game_data, item_data);
		await patch_sidebar.AddHCCOSubCategory(dat)
		patch_sidebar.ReorderSkillInCombatCategory("melvorD:Summoning", "melvorD:Slayer");
		// game.skills.filter(x => x.isModded).forEach(x =>
		// 	patch_sidebar.ReorderSkillInCombatCategory(x.id)
		// )
		patch_summoning.SummoningHTMLModifications(ctx);
<<<<<<< HEAD
				game.summoning.checkForPetMark(); // Need to check for the people who didn't obtain it before

		// patch_custom_shop.CreateRepeatSlayerComponent(ctx);
=======
		game.summoning.checkForPetMark(); // Need to check for the people who didn't obtain this pet before
		// patch_custom_shop.PurchaseUnlockRender(ctx);
		patch_custom_shop.CreateRepeatSlayerComponent(ctx);

>>>>>>> 1d90d87 (Added custom prayers + beginning prayer reshuffle)
	})
	// #endregion Lifecycle_hooks
}