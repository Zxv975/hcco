export class PatchShop {
	PatchTotalUpgradesForGolbinBug = (ctx) => {
		ctx.patch(Shop, "getTotalUpgradesPurchased").replace(function (o, golbinRaid) {
			let totalCount = 0;
			this.upgradesPurchased.forEach((count, purchase) => {
				if (purchase.category?.isGolbinRaid === golbinRaid) // Only changed line. For some reason category gets deleted from this item, so nullity check is necessary
					totalCount += count;
			});
			return totalCount;
		})
		ctx.patch(Shop, "computeProvidedStats").replace(function (o, updatePlayers = true) {
			this.providedStats.reset();
			this.raidStats.reset();
			this.upgradesPurchased.forEach((count, purchase) => {
				if (purchase.contains.stats !== undefined) {
					if (purchase.category?.isGolbinRaid) { // Only changed line. For some reason category gets deleted from this item, so nullity check is necessary
						this.raidStats.addStatObject(purchase, purchase.contains.stats, count, count);
					}
					else {
						this.providedStats.addStatObject(purchase, purchase.contains.stats, count, count);
					}
				}
			});
			if (updatePlayers) {
				this.game.combat.computeAllStats();
				this.game.golbinRaid.computeAllStats();
			}
		})

	}
	RemoveNonCOTabs() {
		const bannedTabIDs = ["melvorD:SkillUpgrades", "melvorF:Township", "melvorD:Gloves", "hcco:Hidden"] // These only have skilling items
		bannedTabIDs.forEach(id => {
			game.shop.categories.registeredObjects.delete(id);
		})
		game.shop.categoryDisplayOrder = game.shop.categoryDisplayOrder.filter(category => !bannedTabIDs.includes(category.id));
	}

	PatchAutoswapFood = () => {
		game.shop.purchases.getObjectByID("melvorD:AutoSwapFood")._defaultPurchaseRequirements = [];
		game.shop.purchases.getObjectByID("melvorD:AutoSwapFood")._purchaseRequirements = new Map();
	}

	RemoveNonCOItems(bannedShopItemIDs) {
		const bannedSkills = game.skills.filter(x => !x.isCombat).map(x => x.id)
		const excludedItemIDs = [];

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

		game.shop.purchases.allObjects.forEach(x => {
			if (bannedShopItems.includes(x.id))
				x.category = game.shop.categories.getObjectByID("hcco:Hidden") // Moves all problematic items to a hidden category
		});
		game.shop.purchases.allObjects.forEach(x => {
			if (bannedShopItems.includes(x.id))
				x.category = game.shop.categories.getObjectByID("hcco:Hidden") // Moves all problematic items to a hidden category
		});

		// game.shop.purchaseDisplayOrder.registery.registeredObjects = new Map(filteredPurchaseOrder.map(x => [x.id, x]))

		// const filteredPurchases = game.shop.purchases.allObjects.filter(x => !bannedShopItems.includes(x.id));
		// const filteredPurchaseOrder = game.shop.purchaseDisplayOrder.registery.allObjects.filter(x => !bannedShopItems.includes(x.id));

		// game.shop.purchases.registeredObjects = new Map(filteredPurchases.map(x => [x.id, x]))
		// game.shop.purchases.namespaceMaps = this.GenerateNamespaceMap(filteredPurchases);
		// game.shop.purchaseDisplayOrder.registery.registeredObjects = new Map(filteredPurchaseOrder.map(x => [x.id, x]))
		// game.shop.purchaseDisplayOrder = new NamespacedArray(game.shop.purchaseDisplayOrder.registery, ...game.shop.purchaseDisplayOrder.registery.allObjects)

		// const purchaseOrderNamespaceMap = this.GenerateNamespaceMap(filteredPurchaseOrder);
		// game.shop.purchaseDisplayOrder.registery.namespaceMaps = purchaseOrderNamespaceMap

		// shopItems = shopItems.filter(x => !bannedItemIDs.includes(x))
		// shopMenu.tabs.forEach(x => x.menu.items.forEach(y => { if (!shopItems.includes(y.item.purchase.id)) y.container.classList.add('d-none') }))
	}

	RemoveItems(itemsToDelete) {
		itemsToDelete.forEach(x => {
			console.log("Trying to delete: ", x)
			game.shop.purchases.registeredObjects.delete(x)
			game.shop.purchaseDisplayOrder.registery.registeredObjects.delete(x)
		})
		game.shop.purchaseDisplayOrder = new NamespacedArray(game.shop.purchaseDisplayOrder.registery, ...game.shop.purchaseDisplayOrder.registery.allObjects)
	}

	GenerateNamespaceMap(registryArray) {
		new Map(Object.entries(Object.groupBy(registryArray, ({ namespace }) => namespace)).map(x => [x[0], new Map(x[1].map(y => [y.id, y]))])) // don't ask how i figured this out...
	}

}