export class PatchSidebar {
	RemoveNonCombatCategories() {
		sidebar.category('Passive').remove();
		sidebar.category('Non-Combat').remove();
	}
	ReorderSkillInCombatCategory = (skillID, afterID = "melvorD:Slayer") => {
		sidebar.category('Combat').item(skillID, { after: afterID });
	}
}