export class PatchSidebar {
	RemoveNonCombatCategories() {
		sidebar.category("Passive").remove();
		sidebar.category("Non-Combat").remove();
	}
	ReorderSkillInCombatCategory = (skillID, afterID) => {
		if (afterID)
			sidebar.category("Combat").item(skillID, { after: afterID });
		else
			sidebar.category("Combat").item(skillID);
	}
	AddModdedSkillToSidebar = (skillID, afterID) => {
		// Doesn't quite work, gotta move the skill around and shit 
		if (afterID)
			sidebar.category("Modded", { after: "Combat" }).item(skillID, { after: afterID });
		else
			sidebar.category("Modded", { after: "Combat" }).item(skillID);
	}
	AddHCCOSubCategory = (data) => {
		sidebar.category("Modding").item("HCCO Drops", {
			icon: `assets/media/bank/potato.png`,
			onClick: () => this.ToggleModal(data)
		});
	}
	ToggleModal(data) {
		SwalLocale.fire({
			title: `HCCO Drop Table Changes`,
			html: ``,
			imageUrl: cdnMedia(`assets/media/bank/potato.png`),
			imageWidth: 150,
			imageHeight: 150,
			width: "65em"
		})
		this.CreateVueTable(data)
	}

	CreateVueTable = (data) => {
		// const isDebug = false
		// const container = isDebug ? document.querySelector("#character-selection-page-0 > div.text-center.mb-3 > h1") : document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div")
		// const container = document.querySelector("#character-selection-page-0 > div.text-center.mb-3 > h1")
		const container = document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div")

		// #region Data
		// const testData2 = old_data, new_data
		// #region Components
		// console.log(data)
		function c_Table(props) {
			return {
				$template: "#table",
				entries: props
			}
		}
		ui.create(
			c_Table(data),
			container)
	}
	// CreateData(old_data, new_data) {
	// 	for()
	// 	new_data.map(x => [x.name, ])
	// }
	CreateTestData = () => {
		return {
			entries: [
				game.monsters.allObjects[4],
				game.monsters.allObjects[7],
				game.monsters.allObjects[10],
				game.monsters.allObjects[15],
				game.monsters.allObjects[50],
				game.monsters.allObjects[100],
				game.monsters.allObjects[30],
				game.monsters.allObjects[200],
				game.monsters.allObjects[210],
			]
		}
	}
}