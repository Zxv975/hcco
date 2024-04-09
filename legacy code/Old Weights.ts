		// Eye-conic cave -> Mucky Cave
		addToDropTableWithEmptySpace("melvorAoD:BlindWarrior", patchFlag, { "id": "melvorAoD:City_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 0.03 })
		addToDropTableWithEmptySpace("melvorAoD:BlindArcher", patchFlag, { "id": "melvorAoD:City_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 0.03 })
		addToDropTableWithEmptySpace("melvorAoD:BlindMage", patchFlag, { "id": "melvorAoD:City_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 0.03 })
		addToDropTableWithEmptySpace("melvorAoD:BlindGhost", patchFlag, { "id": "melvorAoD:City_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 0.03 })

		// Mucky Cave -> Tree Overgrowth
		addToDropTableWithEmptySpace("melvorAoD:SlimeShooter", patchFlag, { "id": "melvorAoD:Old_Route_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 0.05 })

		// Tree Overgrowth -> Dark Quarry + Collapsed City
		patchDropTable('melvorAoD:AngryTeak', 'monster', patchFlag, [{ 'id': "melvorD:Teak_Logs", "weight": 20 }], [{ "id": "melvorAoD:Ancient_Stone_Tablet", "minQuantity": 1, "maxQuantity": 1, "weight": 20 }])
		patchDropTable('melvorAoD:RagingMaple', 'monster', patchFlag, [{ 'id': "melvorD:Maple_Logs", "weight": 20 }], [{ "id": "melvorAoD:Dusty_Book_of_Knowledge", "minQuantity": 1, "maxQuantity": 1, "weight": 20 }])

		// Dark Quarry -> Collapsed City
		patchDropTable('melvorAoD:MagicGolem', 'monster', patchFlag, [{ 'id': "melvorD:Adamantite_Bar", "weight": 20 }], [{ "id": "melvorAoD:Navigation_Chart", "minQuantity": 1, "maxQuantity": 1, "weight": 20 }])

		// Collapsed city -> Lost Temple
		addToDropTableWithEmptySpace("melvorAoD:PoisonBloater", patchFlag, { "id": "melvorAoD:Torn_Scrolls", "minQuantity": 1, "maxQuantity": 1, "weight": 0.02 })

		// Lost Temple -> Ritual Site
		addToDropTableWithEmptySpace("melvorAoD:PossessedBarrel", patchFlag, { "id": "melvorAoD:Lost_Cursed_Text", "minQuantity": 1, "maxQuantity": 1, "weight": 0.01 })

		// Ritual Site -> Shipwreck Cove
		addToDropTableWithEmptySpace("melvorAoD:CultMonster", patchFlag, { "id": "melvorAoD:Misty_Jewel", "minQuantity": 1, "maxQuantity": 1, "weight": 0.01 })

		// Shipwreck Cove -> Underwater Ruins
		addToDropTableWithEmptySpace("melvorAoD:ShipwreckBeast", patchFlag, { "id": "melvorAoD:Melantis_Clue_2", "minQuantity": 1, "maxQuantity": 1, "weight": 0.01 })
		addToDropTableWithEmptySpace("melvorAoD:CursedPirateCaptain", patchFlag, { "id": "melvorAoD:Melantis_Clue_3", "minQuantity": 1, "maxQuantity": 1, "weight": 0.01 })

		// Crystal Depths -> Underwater Ruins
		patchDropTable('melvorAoD:CrystalBehemoth', 'monster', patchFlag, [{ 'id': "melvorAoD:Pure_Crystal_Binding_Dust", "weight": 1 }], [{ "id": "melvorAoD:Melantis_Clue_4", "minQuantity": 1, "maxQuantity": 1, "weight": 1 }])

		// Cult Grounds -> Underwater Ruins
		patchDropTable('melvorAoD:Ritual_Chest', 'chest', patchFlag, [{ 'id': "melvorAoD:Cursed_Dust", "weight": 2 }], [{ "id": "melvorAoD:Melantis_Clue_1", "minQuantity": 1, "maxQuantity": 1, "weight": 2 }])