export class DataLoader {
	async FetchData() {
		const constructUrl = (url) => Util.hasOfflineCapability() ? `${url}.v${DATA_VERSION}.json` : `${url}.json?${DATA_VERSION}`;
		let data = {}
		data['melvorD'] = await this.FetchDataPackage('Demo', constructUrl('/assets/data/melvorDemo'));
		if (cloudManager.hasFullVersionEntitlement) { data['melvorF'] = await this.FetchDataPackage('Full', constructUrl('/assets/data/melvorFull')); }
		// if (cloudManager.isAprilFoolsEvent2024Active()) { data['AprilFools2024'] = await this.FetchDataPackage('AprilFools2024', constructUrl('/assets/data/melvorAprilFools2024')); }
		if (cloudManager.hasTotHEntitlementAndIsEnabled) { data['melvorTotH'] = await this.FetchDataPackage('TotH', constructUrl('/assets/data/melvorTotH')); }
		if (cloudManager.hasAoDEntitlementAndIsEnabled) { data['melvorAoD'] = await this.FetchDataPackage('AoD', constructUrl('/assets/data/melvorExpansion2')); }
		if (cloudManager.hasItAEntitlementAndIsEnabled) { data['melvorItA'] = await this.FetchDataPackage('ItA', constructUrl('/assets/data/melvorItA')); }
		return data;
	}
	async FetchDataPackage(id, url) {
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		const href = Util.getOrigin();
		const response = await fetch(`${href}${url}`, { method: 'GET', headers });
		if (!response.ok) { throw new Error(`Could not fetch data package with URL: ${href}${url}`); }
		// this.dataPackage[id] = await response.json();
		return await response.json();
	}
}

class Util {
	static hasOfflineCapability() {
		return typeof offline !== 'undefined';
	}
	static getOrigin() {
		const expected = ['/assets/css/oneui.css', '/assets/css/game.css', '/assets/css/fireworks.css'];
		const mainCss = Array.from(document.head.querySelectorAll('#css-main'))
			.map(css => {
				let origin = css.href;
				for (const url of expected) {
					origin = origin.replace(url, '').replace(this.fileVersion(), '');
				}
				return origin;
			})
			.filter(url => !!url);
		const origin = mainCss[0];
		if (!origin) {
			throw new Error(
				`Failed to locate game origin: ${Array.from(document.head.querySelectorAll('#css-main'))
					.map(link => link.href)
					.join(', ')}`
			);
		}
		return origin;
	}
	static fileVersion() {
		if (typeof gameFileVersion !== 'undefined') {
			return gameFileVersion;
		}

		if (typeof SCRIPT_VERSION !== 'undefined') {
			return SCRIPT_VERSION.toString();
		}

		return '(no version)';
	}
}