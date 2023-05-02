document.querySelector("#horizontal-navigation-summoning > ul > li:nth-child(2)").remove()

game.slayerAreas.getObjectByID("melvorTotH:ForsakenTundra").entryRequirements
game.dungeons.getObjectByID("melvorF:Impending_Darkness")

game.slayerAreas.getObjectByID("melvorTotH:LavaLake").entryRequirements[1].dungeon = 
game.dungeons.getObjectByID("melvorF:Impending_Darkness")
game.slayerAreas.getObjectByID("melvorTotH:ForsakenTundra").entryRequirements[1].dungeon = 
game.dungeons.getObjectByID("melvorF:Impending_Darkness")