export class PatchItems {
	PatchDescription(item_id, modified_description) {
		game.items.getObjectByID(item_id)._modifiedDescription = modified_description
	}

	PatchGetDescription(ctx) {
		ctx.patch(Item, 'modifiedDescription').get(function (o) {
			return o() * 2;
		});

		ctx.patch(BankSelectedItemMenuElement, "setItem").after((returnValue, bankItem, bank) => {
			refreshItemUseList();
		});

		function refreshItemUseList(bankItem) {
			// WIP yoinking code from Item Uses component
			if (bankItem === undefined) {
				bankItem = game.bank.selectedBankItem;
				if (bankItem === undefined) {
					return;
				}
			}

			if ($('#item-uses-container') !== undefined) {
				$('#item-uses-container').remove();
			}

			ui.create({ '$template': '#item-uses-component' },
				document.querySelector('#bank-selected-tab bank-selected-item-menu .row')
			);
		}
	}
}