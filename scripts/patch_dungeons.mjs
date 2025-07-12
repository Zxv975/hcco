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
}