export class PatchItems {
	PatchDescription(item_id, modified_description) {
		game.items.getObjectByID(item_id)._modifiedDescription = modified_description
	}
}