import { useEffect, useState } from 'react';

/**
 * 用于获取宿主环境的页面信息的 hook
 * @returns 当前页数和总页数
 */
const usePage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const updatePageInfo = async () => {
      try {
        // 获取当前活动的标签页
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab.id) return;

        // 在宿主页面中执行脚本获取页面信息
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // 使用多种方式获取文档高度
            const getDocumentHeight = () => {
              return Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight,
              );
            };

            // 获取文档高度
            const documentHeight = getDocumentHeight();

            // 获取视口高度
            const viewportHeight =
              window.innerHeight ||
              document.documentElement.clientHeight ||
              document.body.clientHeight;

            // 获取当前滚动位置
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

            // 计算总页数（向上取整，确保最后一页也被计算在内）
            const total = Math.max(
              1,
              Math.ceil(documentHeight / viewportHeight),
            );

            // 计算当前页数（基于滚动距离）
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
          console.log('获取到页面信息:', results[0].result);
          setCurrentPage(current);
          setTotalPages(Math.max(1, total)); // 确保至少有1页
        }
      } catch (error) {
        console.error('获取页面信息失败:', error);
        // 设置默认值以防出错
        setCurrentPage(1);
        setTotalPages(1);
      }
    };

    // 立即执行一次
    updatePageInfo();

    // 每500毫秒更新一次页面信息，以捕获滚动和页面大小变化
    const intervalId = setInterval(updatePageInfo, 500);

    // 清理函数
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { currentPage, totalPages };
};

export default usePage;
