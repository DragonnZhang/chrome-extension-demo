import * as React from 'react';

export default function useChromeWindowScroll() {
  const [scrollY, setScrollY] = React.useState<number>(0);
  const intervalRef = React.useRef<number>();

  React.useEffect(() => {
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
            },
          );
        }
      });
    };

    getHostScrollY(setScrollY);

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
