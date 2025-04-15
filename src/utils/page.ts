const pageUp = async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab.id) return;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 检查是否为 Lark Office Wiki 页面
        const isLarkWiki = window.location.href.includes(
          'https://bytedance.larkoffice.com/wiki',
        );

        if (isLarkWiki) {
          // 在 Lark Wiki 页面中滚动
          const container = document.querySelector('.bear-web-x-container');
          if (container) {
            const viewportHeight = container.clientHeight;
            container.scrollBy({
              top: -viewportHeight,
              behavior: 'smooth',
            });
          }
        } else {
          // 在普通页面中滚动
          const viewportHeight = window.innerHeight;
          window.scrollBy({
            top: -viewportHeight,
            behavior: 'smooth',
          });
        }
      },
    });
  } catch (error) {
    console.error('页面向上滚动失败:', error);
  }
};

const pageDown = async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab.id) return;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 检查是否为 Lark Office Wiki 页面
        const isLarkWiki = window.location.href.includes(
          'https://bytedance.larkoffice.com/wiki',
        );

        if (isLarkWiki) {
          // 在 Lark Wiki 页面中滚动
          const container = document.querySelector('.bear-web-x-container');
          if (container) {
            const viewportHeight = container.clientHeight;
            container.scrollBy({
              top: viewportHeight,
              behavior: 'smooth',
            });
          }
        } else {
          // 在普通页面中滚动
          const viewportHeight = window.innerHeight;
          window.scrollBy({
            top: viewportHeight,
            behavior: 'smooth',
          });
        }
      },
    });
  } catch (error) {
    console.error('页面向下滚动失败:', error);
  }
};

export { pageDown, pageUp };
