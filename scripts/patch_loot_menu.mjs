export class PatchLootMenu {
	PatchMonsterLootMenu(ctx) {
		ctx.patch(CombatManager, "getMonsterDropsHTML").replace(function (o, monster, respectArea) {
			const simplify = (numerator, denominator) => {
				var gcd = function gcd(a, b) {
					return b ? gcd(b, a % b) : a;
				};
				gcd = gcd(numerator, denominator);
				return `${numerator / gcd}/${denominator / gcd}`;
			}

			let drops = '';
			const localeSettings = {
				minimumFractionDigits: 0,
				maximumFractionDigits: 2
			};
			if (monster.lootTable.size > 1 && !(respectArea && this.areaType === CombatAreaType.Dungeon)) { // Modified "lootTable.size > 0" to be "lootTable.size > 1" because I'm adding an empty drop to every drop table, and removed lootChance
				drops = monster.lootTable.sortedDropsArray.map((drop) => {
					let dropText = ``
					if (drop.minQuantity === drop.maxQuantity) dropText += `${numberWithCommas(drop.maxQuantity)}`
					else dropText += `(${numberWithCommas(drop.minQuantity)} – ${numberWithCommas(drop.maxQuantity)})`
					dropText += ` × <img class="skill-icon-xs mr-2" src="${drop.item.media}">${drop.item.name}`
					dropText += ` <b style='color: rgb(255, 204, 0)'>[${simplify(drop.weight, monster.lootTable.weight)} | ${(100 * drop.weight / monster.lootTable.weight).toLocaleString(undefined, localeSettings)}%]</b>`;
					return dropText;
				}
				).join('<br>');
			}
			let bones = '';
			const dropsBones = monster.bones !== undefined && !(respectArea && this.selectedArea instanceof Dungeon && !this.selectedArea.dropBones);
			const dropsBarrierDust = monster.hasBarrier;
			if (dropsBarrierDust || dropsBones) {
				bones = `${getLangString('MISC_STRING_7')}`;
				if (dropsBones && monster.bones !== undefined) {
					bones += `<br><img class="skill-icon-xs mr-2" src="${monster.bones.item.media}">${monster.bones.item.name}`;
				}
				if (dropsBarrierDust) {
					const barrierDustItem = this.game.items.getObjectByID("melvorAoD:Barrier_Dust");
					if (barrierDustItem !== undefined) {
						bones += `<br><img class="skill-icon-xs mr-2" src="${barrierDustItem.media}">${barrierDustItem.name}`;
					}
				}
				bones += `<br><br>`;
			} else {
				bones = getLangString('COMBAT_MISC_107') + '<br><br>';
			}
			let html = `<span class="text-dark">${bones}<br>`;
			if (drops !== '') {
				html += `${getLangString('MISC_STRING_8')}<br><small>${getLangString('MISC_STRING_9')}</small><br>${drops}`;
			}
			html += '</span>';
			return html;
		})
	}

	PatchChestRewardsMenu() {
		viewItemContents = function (item) {
			const dropsOrdered = item.dropTable.sortedDropsArray;
			const simplify = (numerator, denominator) => {
				var gcd = function gcd(a, b) {
					return b ? gcd(b, a % b) : a;
				};
				gcd = gcd(numerator, denominator);
				return `${numerator / gcd}/${denominator / gcd}`;
			}

			const localeSettings = {
				minimumFractionDigits: 0,
				maximumFractionDigits: 2
			};
			let drops
			drops = dropsOrdered.map((drop) => {
				let dropText = ``
				if (drop.minQuantity === drop.maxQuantity) dropText += `${numberWithCommas(drop.maxQuantity)}`
				else dropText += `(${numberWithCommas(drop.minQuantity)} – ${numberWithCommas(drop.maxQuantity)})`
				dropText += ` × <img class="skill-icon-xs mr-2" src="${drop.item.media}">${drop.item.name}`
				dropText += ` <b style='color: rgb(255, 204, 0)'>[${simplify(drop.weight, item.dropTable.weight)} | ${(100 * drop.weight / item.dropTable.weight).toLocaleString(undefined, localeSettings)}%]</b>`;
				return dropText;
			}).join('<br>');
			SwalLocale.fire({
				title: item.name,
				html: getLangString('BANK_STRING_39') + '<br><small>' + drops,
				imageUrl: item.media,
				imageWidth: 64,
				imageHeight: 64,
				imageAlt: item.name,
			})
		}
	}
}