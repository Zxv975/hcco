export class PatchSidebar {
	RemoveNonCombatCategories() {
		sidebar.category('Passive').remove();
		sidebar.category('Non-Combat').remove();
	}
	ReorderSkillInCombatCategory = (skillID, afterID = "melvorD:Slayer") => {
		sidebar.category('Combat').item(skillID, { after: afterID });
	}
	AddHCCOSubCategory = (drops) => {
		sidebar.category('Modding').item('HCCO Drops', {
			icon: `assets/media/bank/potato.png`,
			onClick: () => this.ToggleModal(drops)
		});
	}
	ToggleModal(drops) {
		SwalLocale.fire({
			title: `HCCO Drop Table Changes`,
			html: ``,
			imageUrl: cdnMedia(`assets/media/bank/potato.png`),
			imageWidth: 150,
			imageHeight: 150,
			width: '65em'
		})
		this.CreateVueTable(drops)
	}

	CreateVueTable = (data) => {
		const container = document.querySelector("#character-selection-page-0 > div.text-center.mb-3 > h1")
		// const container = document.querySelector("body > div.swal2-container.swal2-center.swal-infront.swal2-backdrop-show > div")

		// #region Data
		// const testData2 = old_data, new_data
		// #region Components
		function c_Table(props) {
			console.log(props.old.lootTable.map(x => x.item.name))
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