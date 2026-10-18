import type { UserSubjectCollection } from "@/types/bangumi";
import type { NsfwMode } from "@/types/nsfw";
import { filterNsfw, isBangumiNsfw } from "./nsfw-utils";

/** Bangumi 收藏类型：5 = 抛弃 */
export const BANGUMI_DROPPED_TYPE = 5;

/**
 * 追番页统一的条目过滤：
 * 1. 按 NSFW 配置过滤（off / blur / hide）
 * 2. 去掉「抛弃」条目 —— 该状态在页面上已隐藏，连「全部」也不展示
 *
 * 列表渲染和标签页计数都走这一个函数，保证「全部」的数量与列表一致。
 */
export function filterBangumiItems(
	items: UserSubjectCollection[],
	nsfw: NsfwMode,
): UserSubjectCollection[] {
	return filterNsfw(items, nsfw, isBangumiNsfw).filter(
		(item) => item.type !== BANGUMI_DROPPED_TYPE,
	);
}
