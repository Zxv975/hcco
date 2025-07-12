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
		// const bannedItemIDs = [
		// 	"melvorD:Multi_Tree", "melvorD:Iron_Axe", "melvorD:Iron_Fishing_Rod", "melvorD:Iron_Pickaxe", "melvorD:Normal_Cooking_Fire",
		// 	"melvorF:Perpetual_Haste", "melvorF:Expanded_Knowledge", "melvorF:Master_of_Nature", "melvorF:Art_of_Control",
		// 	"melvorTotH:Slayer_Torch", "melvorTotH:Mystic_Lantern", "melvorTotH:SignOfTheStars", "melvorTotH:SummonersAltar",
		// 	"melvorAoD:CartographyUpgrade1", "melvorAoD:CartographyUpgrade2", "melvorAoD:Blessed_Bone_Offering", "melvorAoD:Superior_Cauldron", "melvorAoD:Superior_Cooking_Pot", "melvorAoD:MagicAnvil", "melvorAoD:Agility_Prosperity",
		// 	"melvorItA:Abyssium_Harvester", "melvorItA:Abyssium_Axe_Coating", "melvorItA:Abyssium_Fishing_Rod_Coating", "melvorItA:Abyssium_Pickaxe_Coating", "melvorItA:Abyssal_Compost", "melvorItA:Abyssal_Firemaking_Oil", "melvorItA:Twisted_Firemaking_Oil", "melvorItA:Gloom_Firemaking_Oil", "melvorItA:Shadow_Firemaking_Oil", "melvorItA:Obsidian_Firemaking_Oil", "melvorItA:Voidfire_Firemaking_Oil",
		// ]
		const excludedItemIDs = isRebalance ? ["melvorD:AutoSwapFood"] : []

		// const includedShopItems = game.shop.purchases.filter(item =>
		// 	item.purchaseRequirements.length === 0 // If no purchase requirements then include it
		// 	|| item?.purchaseRequirements.every(req =>
		// 		!bannedSkills.includes(req?.skill?.id)
		// 		&& req.type === "TownshipBuilding"
		// 		&& req.type === "TownshipTask"
		// 		&& req.type === "ArchaeologyItemsDonated"
		// 		&& req.type === "AllSkillLevels")
		// ).map(x => x.id)

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