import type { ProfileConfig } from "../types/profileConfig";

export const profileConfig: ProfileConfig = {
	// 头像
	// 图片路径支持三种格式：
	// 1. public 目录（以 "/" 开头，不优化）："/assets/images/avatar.jpg"
	// 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/avatar.jpg"
	// 3. 远程 URL："https://example.com/avatar.jpg"
	avatar: "assets/images/avatar.jpg",

	// 名字
	name: "Sukksa",

	// 个人签名
	bio: "I Love the World and Everything In It",

	// 链接配置
	// icon 支持两种写法：
	// 1. Iconify 图标名，如 "fa7-brands:github"（访问 https://icones.js.org/ 查代码，
	//    用到未安装的图标集时先 `pnpm add @iconify-json/<icon-set-name>`）
	// 2. src/icons 下的本地 SVG，用 "local:文件名"（不带 .svg），如 "local:bangumi"
	// showName: true 时显示图标和名称，false 时只显示图标
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/sukksa",
			showName: false,
		},
		{
			name: "Email",
			icon: "fa7-solid:envelope",
			url: "mailto:sukksa@qq.com",
			showName: false,
		},
		{
			name: "Bilibili",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/74396531",
			showName: false,
		},
		{
			name: "Bangumi",
			// 本地图标：src/icons/bangumi.svg（彩色 SVG，会保留品牌粉色）
			// icon: "local:bangumi",
			icon: "material-symbols:movie",
			url: "https://bangumi.tv/user/726667",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
		// {
		// 	name: "Atom",
		// 	icon: "fa7-solid:atom",
		// 	url: "/atom/",
		// 	showName: false,
		// },
	],
};
