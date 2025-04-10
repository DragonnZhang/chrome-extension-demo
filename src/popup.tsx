/// <reference types="chrome" />
import '@midscene/visualizer/index.css';
import {
  ChromeExtensionProxyPage,
  ChromeExtensionProxyPageAgent,
} from '@midscene/web/chrome-extension';
import BrowserExtensionPlayground from './playground';

// remember to destroy the agent when the tab is destroyed: agent.page.destroy()
const extensionAgentForTab = (forceSameTabNavigation = true) => {
  const page = new ChromeExtensionProxyPage(forceSameTabNavigation);
  return new ChromeExtensionProxyPageAgent(page);
};

export const PlaygroundPopup = () => (
  <BrowserExtensionPlayground
    getAgent={(forceSameTabNavigation?: boolean) => {
      return extensionAgentForTab(forceSameTabNavigation);
    }}
    showContextPreview={false}
  />
);
