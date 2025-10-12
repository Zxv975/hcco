export class PatchDungeons {
	PatchDungeonVisibility(ctx) {
		ctx.patch(Game, "checkRequirement").replace(function (o, requirement, notifyOnFailure = false, slayerLevelReq = 0) {
			switch (requirement.type) {
				case 'DungeonCompletion':
					return true;
				default:
					return o(requirement, notifyOnFailure, slayerLevelReq);
			}
		})
	}
	FixDungeonRewardsAdd(ctx) {
		ctx.patch(Dungeon, "applyDataModification").after(function (returnVal, modData, game) {
			if (modData.rewardItemIDs?.add !== undefined) {
				modData.rewardItemIDs.add.forEach((itemID) => {
					const item = game.items.getObjectByID(itemID);
					if (item === undefined)
						throw new Error(`Error modifying Dungeon: ${this.id}. Reward item with id: ${itemID} is not registered.`);
					this._rewards.push(item);
				});
			}
			return returnVal;
		})
	}
	RemoveDungeonUnlockRequirements() {
		const dungeon_list = [
			"melvorAoD:Unholy_Forest",
			"melvorAoD:Trickery_Temple",
			"melvorAoD:Cult_Grounds",
			"melvorAoD:Underwater_City",
		]
		dungeon_list.forEach(dungeon_id => {
			game.dungeons.getObjectByID(dungeon_id).unlockRequirement = [];
		})
	}
}