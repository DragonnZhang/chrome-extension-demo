/// <reference types="chrome" />
import { globalThemeConfig } from '@midscene/visualizer';
import '@midscene/visualizer/index.css';
import { ConfigProvider } from 'antd';
import { BrowserExtensionPlayground } from './playground';
import {
  ChromeExtensionProxyPage,
  ChromeExtensionProxyPageAgent,
} from '@midscene/web/chrome-extension';

// remember to destroy the agent when the tab is destroyed: agent.page.destroy()
const extensionAgentForTab = (forceSameTabNavigation = true) => {
  const page = new ChromeExtensionProxyPage(forceSameTabNavigation);
  return new ChromeExtensionProxyPageAgent(page);
};

export function PlaygroundPopup() {
  return (
    <ConfigProvider theme={globalThemeConfig()}>
      <BrowserExtensionPlayground
        getAgent={(forceSameTabNavigation?: boolean) => {
          return extensionAgentForTab(forceSameTabNavigation);
        }}
        showContextPreview={false}
      />
    </ConfigProvider>
  );
}
