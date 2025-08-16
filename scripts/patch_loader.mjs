export class PatchLoader {
	// Didn't really bother using this since it would require all the patchers to be passed in and zzz cba seems kinda ugly at that point
	PatchLoadingProcess(ctx, item_data, coGamemodeCheck, rebalanceGamemodeCheck) {
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
	}
	RebalanceCOChanges = (gamemode) => {
		patch_summoning.RemoveNonCombatRecipes(); // Do this before making Summoning combat so Fox / Whisp are removed
		patch_summoning.MakeSummoningCombatSkill(ctx);
		if (true) {
			patch_summoning.MakeModdedSkillCombatOnly("rielkConstruction:Construction");
		}
		patch_summoning.PatchMarkMechanics(ctx);
		patch_summoning.MakeSummoningMarksDeterministic(ctx)
		patch_summoning.MakeSummoningPetCO(IS_CO);
		if (cloudManager.hasItAEntitlementAndIsEnabled) {
			patch_summoning.PatchSummoningSkillTree();
		}
		patch_shop.PatchAutoswapFood();
		patch_combat.PatchHitpointsUntilDW(ctx);
		patch_dungeons.FixDungeonRewardsAdd(ctx) // Base game bugfix

		game.registerDataPackage(item_data)
		game.registerDataPackage(mini_max_cape_data)
		game.registerDataPackage(cartography_data)
		// game.registerDataPackage(shopData)
		console.log("Rebalance CO changes loaded")
	}
	BaseCOChanges = (gamemode) => {
		game.registerDataPackage(hidden_shop_category)
		patch_combat.PatchSpellCosts(ctx);
		patch_shop.RemoveNonCOTabs();
		patch_shop.RemoveNonCOItems(bannedShopItemIDs);
		patch_completion_log.PatchLog(IS_CO, rebalanceGamemodeCheck(gamemode), bannedShopItemIDs, ctx);
		patch_achievements.RemoveSteamAchievements();
		patch_shop.PatchTotalUpgradesForGolbinBug(ctx)
		patch_shop.PatchMilestoneHTMLForShopRemovalBug(ctx)

		if (!rebalanceGamemodeCheck(gamemode)) {
			console.log("Removing mark drops entirely from non-Rebalance")
			patch_summoning.RemoveMarkDrop(ctx)
		}
		console.log("Base CO changes loaded")
	}
}