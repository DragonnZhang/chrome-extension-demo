import * as React from "react";

export default function useChromeWindowScroll() {
	const [scrollY, setScrollY] = React.useState(0);
	// 修改这行代码：
	// const intervalRef = React.useRef<NodeJS.Timeout>();
	const intervalRef = React.useRef<number>(); // 浏览器环境使用 number 类型

	React.useEffect(() => {
		// 获取宿主页面的滚动位置
		const getHostScrollY = (callback: (y: number) => void) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tabId = tabs[0]?.id;
				if (tabId) {
					chrome.scripting.executeScript(
						{
							target: { tabId },
							func: () => window.scrollY,
						},
						(results) => {
							if (results?.[0]?.result !== undefined) {
								callback(results[0].result as number);
							}
						}
					);
				}
			});
		};

		// 初始获取
		getHostScrollY(setScrollY);

		// 设置轮询（200ms 间隔）
		intervalRef.current = setInterval(() => {
			getHostScrollY(setScrollY);
		}, 200);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return { y: scrollY };
}
