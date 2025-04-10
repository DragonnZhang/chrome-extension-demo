import * as React from 'react';

/**
 * 用于获取宿主环境的页面信息的 hook
 * @returns 当前页数和总页数
 */
const usePage = () => {
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);

  React.useEffect(() => {
    const updatePageInfo = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab.id) return;

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const getDocumentHeight = () => {
              return Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight,
              );
            };

            const documentHeight = getDocumentHeight();

            const viewportHeight =
              window.innerHeight ||
              document.documentElement.clientHeight ||
              document.body.clientHeight;

            const scrollTop =
              window.pageYOffset ||
              document.documentElement.scrollTop ||
              document.body.scrollTop ||
              0;

            console.log('页面信息:', {
              documentHeight,
              viewportHeight,
              scrollTop,
              windowInnerHeight: window.innerHeight,
              bodyScrollHeight: document.body.scrollHeight,
              htmlScrollHeight: document.documentElement.scrollHeight,
            });

            const total = Math.max(
              1,
              Math.ceil(documentHeight / viewportHeight),
            );

            const current = Math.min(
              Math.max(1, Math.floor(scrollTop / viewportHeight) + 1),
              total,
            );

            return {
              current,
              total,
              documentHeight,
              viewportHeight,
              scrollTop,
            };
          },
        });

        if (results?.[0]?.result) {
          const { current, total } = results[0].result;
          setCurrentPage(current);
          setTotalPages(Math.max(1, total));
        }
      } catch (error) {
        setCurrentPage(1);
        setTotalPages(1);
      }
    };

    updatePageInfo();

    const intervalId = setInterval(updatePageInfo, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { currentPage, totalPages };
};

export default usePage;
