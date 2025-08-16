export class PatchNonCombatSkills {
	MakeModdedSkillCombatOnly = (skillID, IS_CO_FLAG) => {
		const newSkill = game.skills.getObjectByID(skillID)
		if (!newSkill) {
			console.error(`Skill not found: ${skillID}`)
			return
		}
		Object.defineProperty(newSkill, 'hasMinibar', { get() { return false } });
		Object.defineProperty(newSkill, 'hasMastery', { get() { return false } });
		Object.defineProperty(newSkill, 'isCombat', { get() { return true } });
		Object.defineProperty(newSkill, 'isUnlocked', { get() { return newSkill[IS_CO_FLAG] == true } });
		if (!newSkill[IS_CO_FLAG]) // Skill was originally not a CO skill, so move it
			game.pages.getObjectByID(skillID).skillSidebarCategoryID = "Combat";

		// const temp = game.playerNormalCombatLevel
		// const temp2 = game.playerAbyssalCombatLevel
		// game.playerNormalCombatLevel = function () {
		// 	return temp + Math.floor(newSkill.level / 2);
		// }
		// game.playerAbyssalCombatLevel = function () {
		// 	return temp2 + Math.floor((newSkill.level + newSkill.abyssalLevel) / 2);
		// }

		// Object.defineProperty(game, 'playerNormalCombatLevel', {
		// 	get() {
		// 		return o + Math.floor(newSkill.level / 2);
		// 	}
		// });
		// Object.defineProperty(game, 'playerAbyssalCombatLevel', {
		// 	get() {
		// 		return o + Math.floor((newSkill.level + newSkill.abyssalLevel) / 2);
		// 	}
		// });

	}
}