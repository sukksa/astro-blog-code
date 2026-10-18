<script lang="ts">
import ClientPagination from "@/components/common/ClientPagination.svelte";
import FilterControls from "@/components/common/FilterControls.svelte";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import type { UserSubjectCollection } from "@/types/bangumi";
import type { NsfwMode } from "@/types/nsfw";
import { filterBangumiItems } from "@/utils/bangumi-display-utils";
import Card from "./Card.svelte";

interface Props {
	sectionId: string;
	items: UserSubjectCollection[];
	isActive: boolean;
	itemsPerPage?: number;
	subjectBaseUrl?: string;
	nsfw?: NsfwMode; // NSFW 处理："off" | "blur" | "hide"
	// 列表展示方式："pagination" 分页 | "infinite" 瀑布流（滚动到底自动加载）
	displayMode?: "pagination" | "infinite";
	// 大屏每行卡片数量，移动端固定 2 列
	columns?: 3 | 4 | 5;
}

const {
	sectionId,
	items,
	isActive,
	itemsPerPage = 24,
	subjectBaseUrl,
	nsfw = "off",
	displayMode = "pagination",
	columns = 5,
}: Props = $props();

const STATUS_MAP: Record<number, string> = {
	1: "wish",
	2: "collect",
	3: "doing",
	4: "on_hold",
	5: "dropped",
};

const isGame = $derived(sectionId === "game");
const isBook = $derived(sectionId === "book");
const isMusic = $derived(sectionId === "music");

function getFilterLabel(type: "collect" | "doing" | "wish"): string {
	if (isGame) {
		switch (type) {
			case "collect":
				return i18n(I18nKey.bangumiFilterGamePlayed);
			case "doing":
				return i18n(I18nKey.bangumiFilterGamePlaying);
			case "wish":
				return i18n(I18nKey.bangumiFilterGameWish);
		}
	}
	if (isBook) {
		switch (type) {
			case "collect":
				return i18n(I18nKey.bangumiFilterBookRead);
			case "doing":
				return i18n(I18nKey.bangumiFilterBookReading);
			case "wish":
				return i18n(I18nKey.bangumiFilterBookWish);
		}
	}
	if (isMusic) {
		switch (type) {
			case "collect":
				return i18n(I18nKey.bangumiFilterMusicListened);
			case "doing":
				return i18n(I18nKey.bangumiFilterMusicListening);
			case "wish":
				return i18n(I18nKey.bangumiFilterMusicWish);
		}
	}
	switch (type) {
		case "collect":
			return i18n(I18nKey.bangumiFilterWatched);
		case "doing":
			return i18n(I18nKey.bangumiFilterWatching);
		case "wish":
			return i18n(I18nKey.bangumiFilterWish);
	}
}

// NSFW 拦截 + 去掉「抛弃」条目（该状态在页面上已隐藏）
const safeItems = $derived(filterBangumiItems(items, nsfw));

const statusCounts = $derived(() => {
	const counts: Record<string, number> = {};
	for (const item of safeItems) {
		const status =
			STATUS_MAP[item.type as keyof typeof STATUS_MAP] || "unknown";
		counts[status] = (counts[status] || 0) + 1;
	}
	return counts;
});

const filters = $derived(() => {
	const counts = statusCounts();
	return [
		{
			value: "all",
			label: i18n(I18nKey.bangumiFilterAll),
			count: safeItems.length,
		},
		{
			value: "collect",
			label: getFilterLabel("collect"),
			count: counts.collect || 0,
		},
		{
			value: "doing",
			label: getFilterLabel("doing"),
			count: counts.doing || 0,
		},
		{ value: "wish", label: getFilterLabel("wish"), count: counts.wish || 0 },
		{
			value: "on_hold",
			label: i18n(I18nKey.bangumiFilterOnHold),
			count: counts.on_hold || 0,
		},
		// 「抛弃」筛选已隐藏：条目仍会出现在「全部」里，需要恢复时把下面这段取消注释
		// {
		// 	value: "dropped",
		// 	label: i18n(I18nKey.bangumiFilterDropped),
		// 	count: counts.dropped || 0,
		// },
	].filter((f) => f.value === "all" || f.count > 0);
});

let activeFilter = $state("all");
let currentPage = $state(1);

const filteredItems = $derived(
	activeFilter === "all"
		? safeItems
		: safeItems.filter(
				(item) =>
					(STATUS_MAP[item.type as keyof typeof STATUS_MAP] || "unknown") ===
					activeFilter,
			),
);

const totalPages = $derived(
	Math.max(1, Math.ceil(filteredItems.length / itemsPerPage)),
);

const pagedItems = $derived(
	filteredItems.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	),
);

// ── 瀑布流（无限滚动）─────────────────────────────────
const isInfinite = $derived(displayMode === "infinite");

// 已加载条目数量，滚到底部时递增
let visibleCount = $state(itemsPerPage);

const visibleItems = $derived(
	isInfinite ? filteredItems.slice(0, visibleCount) : pagedItems,
);

const hasMore = $derived(isInfinite && visibleCount < filteredItems.length);

// 底部哨兵元素：进入视口就加载下一批
let sentinelEl = $state<HTMLDivElement | null>(null);

// 大屏列数 3 / 4 / 5，移动端固定 2 列
const gridClass = $derived.by(() => {
	const base = "grid grid-cols-2 sm:grid-cols-3 gap-3";
	if (columns === 3) return base;
	if (columns === 4) return `${base} lg:grid-cols-4`;
	return `${base} lg:grid-cols-4 xl:grid-cols-5`;
});

$effect(() => {
	if (!isInfinite || !sentinelEl) return;

	const observer = new IntersectionObserver(
		(entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			if (visibleCount < filteredItems.length) {
				visibleCount = Math.min(
					visibleCount + itemsPerPage,
					filteredItems.length,
				);
			}
		},
		// 提前一点触发，滚动体验更顺
		{ rootMargin: "320px 0px" },
	);

	observer.observe(sentinelEl);
	return () => observer.disconnect();
});

function handleFilterChange(filter: string) {
	activeFilter = filter;
	currentPage = 1;
	visibleCount = itemsPerPage;
}

function goToPage(page: number) {
	if (page >= 1 && page <= totalPages) {
		currentPage = page;
	}
}
</script>

<div class="media-section" class:hidden={!isActive} data-section={sectionId}>
  {#if safeItems.length > 0}
    <FilterControls
      filters={filters()}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
    />

    <div class={gridClass}>
      {#each visibleItems as item (item.subject_id)}
        <div
          class="media-item"
          data-item-section={sectionId}
          data-item-status={STATUS_MAP[item.type as keyof typeof STATUS_MAP] || "unknown"}
        >
          <Card item={item} loadImage={isActive} {subjectBaseUrl} {nsfw} />
        </div>
      {/each}
    </div>

    {#if isInfinite}
      {#if hasMore}
        <div
          bind:this={sentinelEl}
          class="h-10"
          aria-hidden="true"
          data-infinite-sentinel={sectionId}
        ></div>
      {/if}
    {:else}
      <ClientPagination
        totalItems={filteredItems.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={goToPage}
      />
    {/if}
  {:else}
    <div class="text-center py-12">
      <h3 class="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">{i18n(I18nKey.bangumiNoData)}</h3>
      <p class="text-gray-500 dark:text-gray-500">{i18n(I18nKey.bangumiNoDataDescription)}</p>
    </div>
  {/if}
</div>

