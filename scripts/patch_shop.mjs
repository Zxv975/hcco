export class PatchShop {
	RemoveNonCOTabs() {
		const bannedTabIDs = ["melvorD:SkillUpgrades", "melvorF:Township"] // These only have skilling items
		bannedTabIDs.forEach(id => {
			game.shop.categories.registeredObjects.delete(id);
		})
		game.shop.categoryDisplayOrder = game.shop.categoryDisplayOrder.filter(category => !bannedTabIDs.includes(category.id));
	}

	// PatchAutoswapFood = () => {
	// 	game.shop.purchases.getObjectByID("melvorD:AutoSwapFood")._purchaseRequirements = new Map();
	// }

	RemoveNonCOItems(isRebalance, bannedShopItemIDs) {
		const bannedSkills = game.skills.filter(x => !x.isCombat).map(x => x.id)
		const excludedItemIDs = isRebalance ? ["melvorD:AutoSwapFood"] : []

		const bannedShopItems = [...game.shop.purchases.filter(item =>
			item?.purchaseRequirements.length > 0 // If no purchase requirements then don't ban it
			&& !excludedItemIDs.includes(item.id)
			&& item?.purchaseRequirements.some(req =>
				bannedSkills.includes(req?.skill?.id)
				|| req.type === "TownshipBuilding"
				|| req.type === "TownshipTask"
				|| req.type === "ArchaeologyItemsDonated"
				|| req.type === "AllSkillLevels")
		).map(x => x.id)
			, ...bannedShopItemIDs]

		const filteredPurchases = game.shop.purchases.allObjects.filter(x => !bannedShopItems.includes(x.id));
		const filteredPurchaseOrder = game.shop.purchaseDisplayOrder.registery.allObjects.filter(x => !bannedShopItems.includes(x.id));
		game.shop.purchases.registeredObjects = new Map(filteredPurchases.map(x => [x.id, x]))
		game.shop.purchaseDisplayOrder.registery.registeredObjects = new Map(filteredPurchaseOrder.map(x => [x.id, x]))

		game.shop.purchases.namespaceMaps = this.GenerateNamespaceMap(filteredPurchases);
		// const purchaseOrderNamespaceMap = this.GenerateNamespaceMap(filteredPurchaseOrder);
		// game.shop.purchaseDisplayOrder.registery.namespaceMaps = purchaseOrderNamespaceMap
		game.shop.purchaseDisplayOrder = new NamespacedArray(game.shop.purchaseDisplayOrder.registery, ...game.shop.purchaseDisplayOrder.registery.allObjects)

		// shopItems = shopItems.filter(x => !bannedItemIDs.includes(x))
		// shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (!shopItems.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
	}

	GenerateNamespaceMap(registryArray) {
		new Map(Object.entries(Object.groupBy(registryArray, ({ namespace }) => namespace)).map(x => [x[0], new Map(x[1].map(y => [y.id, y]))])) // don't ask how i figured this out...
	}

}