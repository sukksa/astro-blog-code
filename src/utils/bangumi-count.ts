import { siteConfig } from "@/config";

/**
 * 构建期统计 Bangumi 动画收藏数量（"看过" + "在看"）。
 *
 * - 只发两个 limit=1 的请求，读响应里的 total，不拉全量数据
 * - 结果在单次构建内缓存（模块级 Promise），避免每个页面重复请求
 * - 任何失败（超时、网络不通、接口变更）都返回 0，让调用方直接隐藏这一行
 */
const REQUEST_TIMEOUT_MS = 4000;

/** Bangumi 收藏类型：2 = 看过，3 = 在看 */
const COLLECTION_TYPE_WATCHED = 2;
const COLLECTION_TYPE_WATCHING = 3;

let cached: Promise<number> | null = null;

async function fetchCollectionTotal(
	apiUrl: string,
	username: string,
	type: number,
): Promise<number> {
	const url = `${apiUrl}/v0/users/${encodeURIComponent(username)}/collections?subject_type=2&type=${type}&limit=1`;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Sukksa-Blog",
				Accept: "application/json",
			},
			signal: controller.signal,
		});
		if (!response.ok) return 0;
		const data = (await response.json()) as { total?: number };
		return typeof data.total === "number" ? data.total : 0;
	} catch (error) {
		console.warn(`[Bangumi] 获取收藏数量失败（type=${type}）：`, error);
		return 0;
	} finally {
		clearTimeout(timer);
	}
}

/** 返回"在看"与"看过"的动画条目总数；未配置用户或请求失败时为 0 */
export function getBangumiAnimeCount(): Promise<number> {
	if (cached) return cached;

	cached = (async () => {
		const config = siteConfig.bangumi;
		const username = config?.userId?.trim();
		if (!username) return 0;

		const apiUrl = (config?.apiUrl || "https://api.bgm.tv").replace(/\/+$/, "");
		const [watched, watching] = await Promise.all([
			fetchCollectionTotal(apiUrl, username, COLLECTION_TYPE_WATCHED),
			fetchCollectionTotal(apiUrl, username, COLLECTION_TYPE_WATCHING),
		]);
		return watched + watching;
	})();

	return cached;
}
