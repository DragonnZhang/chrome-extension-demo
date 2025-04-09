import * as React from "react";
import useChromeWindowScroll from "./useChromeWindowScroll";

const usePage = () => {
	const [currentPage, setCurrentPage] = React.useState<number>(1);
	const [totalPages, setTotalPages] = React.useState<number>(1);
	const { y: scrollY } = useChromeWindowScroll();

	React.useEffect(() => {
		const getMainViewportHeight = () =>
			chrome.extension.getViews({ type: "tab" })[0]?.innerHeight ||
			window.innerHeight;

		console.log(
			"🚀 ~ getMainViewportHeight ~ getMainViewportHeight:",
			getMainViewportHeight()
		);

		const viewportHeight = getMainViewportHeight();
		const scrollHeight = document.documentElement.scrollHeight;
		console.log("🚀 ~ React.useEffect ~ scrollHeight:", scrollHeight)

		const newPage = Math.floor(scrollY / viewportHeight) + 1;
		const newTotal = Math.ceil(scrollHeight / viewportHeight);

		setCurrentPage(newPage);
		setTotalPages(newTotal);
	}, [scrollY]);

	React.useEffect(() => {
		const handleResize = () => {
			const viewportHeight =
				chrome.extension.getViews({ type: "tab" })[0]?.innerHeight ||
				window.innerHeight;
			const scrollHeight = document.documentElement.scrollHeight;
			setTotalPages(Math.ceil(scrollHeight / viewportHeight));
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return {
		currentPage,
		totalPages,
	};
};

export default usePage;
