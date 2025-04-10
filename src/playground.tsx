import type { UIContext } from '@midscene/core';
import { overrideAIConfig } from '@midscene/core/env';
import {
  ContextPreview,
  EnvConfig,
  type PlaygroundResult,
  PlaygroundResultView,
  type ReplayScriptsInfo,
  useEnvConfig,
} from '@midscene/visualizer';
import { Button, Form, Progress, message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReadOutlined } from '@ant-design/icons';

import MagicButton from './components/MagicButton';
import { PromptInput } from './components/PromptInput';
import { usePage } from './hooks';

import './styles/global.css';

export interface PlaygroundProps {
  getAgent: (forceSameTabNavigation?: boolean) => any | null;
  showContextPreview?: boolean;
  dryMode?: boolean;
}

const ERROR_CODE_NOT_IMPLEMENTED_AS_DESIGNED = 'NOT_IMPLEMENTED_AS_DESIGNED';

const formatErrorMessage = (e: any): string => {
  const errorMessage = e?.message || '';
  if (errorMessage.includes('of different extension')) {
    return 'Conflicting extension detected. Please disable the suspicious plugins and refresh the page. Guide: https://midscenejs.com/quick-experience.html#faq';
  }
  if (!errorMessage?.includes(ERROR_CODE_NOT_IMPLEMENTED_AS_DESIGNED)) {
    return errorMessage;
  }
  return 'Unknown error';
};

// 添加语音播报函数
const speak = (text: string) => {
  if (!chrome.tts) {
    console.warn('Chrome TTS API is not available');
    return;
  }

  chrome.tts.speak(text, { rate: 1.5 });
};

// Blank result template
const blankResult = {
  result: null,
  dump: null,
  reportHTML: null,
  error: null,
};

// Browser Extension Playground Component
const BrowserExtensionPlayground: React.FC<PlaygroundProps> = ({
  getAgent,
  showContextPreview = true,
  dryMode = false,
}) => {
  // State management
  const [uiContextPreview, setUiContextPreview] = useState<
    UIContext | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingProgressText, setLoadingProgressText] = useState('');
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [verticalMode, setVerticalMode] = useState(false);
  const [replayScriptsInfo, setReplayScriptsInfo] =
    useState<ReplayScriptsInfo | null>(null);
  const [replayCounter] = useState(0);
  const [showNavigationButtons, setShowNavigationButtons] = useState(false);

  // Form and environment configuration
  const [form] = Form.useForm();
  const { config } = useEnvConfig();
  const forceSameTabNavigation = useEnvConfig(
    (state) => state.forceSameTabNavigation,
  );

  // References
  const runResultRef = useRef<HTMLHeadingElement>(null);
  const currentAgentRef = useRef<any>(null);
  const currentRunningIdRef = useRef<number | null>(0);
  const interruptedFlagRef = useRef<Record<number, boolean>>({});

  // Environment configuration check
  const configAlreadySet = Object.keys(config || {}).length >= 1;

  // Responsive layout settings
  useEffect(() => {
    const sizeThreshold = 750;
    setVerticalMode(window.innerWidth < sizeThreshold);

    const handleResize = () => {
      setVerticalMode(window.innerWidth < sizeThreshold);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Override AI configuration
  useEffect(() => {
    overrideAIConfig(config as any);
  }, [config]);

  // 监听标签页切换事件
  useEffect(() => {
    const handleTabChange = () => {
      // 重置导航按钮显示状态
      setShowNavigationButtons(false);
    };

    // 监听Chrome标签页激活事件
    if (chrome.tabs?.onActivated) {
      chrome.tabs.onActivated.addListener(handleTabChange);
    }

    // 监听URL变化事件 - 通过历史状态变化检测
    window.addEventListener('popstate', handleTabChange);

    // 组件卸载时清理监听器
    return () => {
      if (chrome.tabs?.onActivated) {
        chrome.tabs.onActivated.removeListener(handleTabChange);
      }
      window.removeEventListener('popstate', handleTabChange);
    };
  }, []);

  // Initialize context preview
  useEffect(() => {
    if (uiContextPreview) return;
    if (!showContextPreview) return;

    getAgent(forceSameTabNavigation)
      ?.getUIContext()
      .then((context: UIContext) => {
        setUiContextPreview(context);
      })
      .catch((e: any) => {
        message.error('Failed to get UI context');
        console.error(e);
      });
  }, [uiContextPreview, showContextPreview, getAgent, forceSameTabNavigation]);

  const resetResult = () => {
    setResult(null);
    setLoading(false);
    setReplayScriptsInfo(null);
  };

  // Handle form submission
  const handleRun = useCallback(async () => {
    const value = form.getFieldsValue();
    if (!value.prompt) {
      message.error('Prompt is required');
      return;
    }

    setLoading(true);
    setResult(null);
    const result: PlaygroundResult = { ...blankResult };

    const activeAgent = getAgent(forceSameTabNavigation);
    const thisRunningId = Date.now();
    try {
      if (!activeAgent) {
        throw new Error('No agent found');
      }
      currentAgentRef.current = activeAgent;

      currentRunningIdRef.current = thisRunningId;
      interruptedFlagRef.current[thisRunningId] = false;
      activeAgent.resetDump();
      activeAgent.onTaskStartTip = (tip: string) => {
        if (interruptedFlagRef.current[thisRunningId]) {
          return;
        }
        setLoadingProgressText(tip);
      };

      // Extension mode always uses in-browser actions
      if (value.type === 'aiAction') {
        result.result = await activeAgent?.aiAction(value.prompt);
      } else if (value.type === 'aiQuery') {
        result.result = await activeAgent?.aiQuery(value.prompt);
        speak(JSON.stringify(result.result));
      } else if (value.type === 'aiAssert') {
        result.result = await activeAgent?.aiAssert(value.prompt, undefined, {
          keepRawResponse: true,
        });
      }
    } catch (e: any) {
      result.error = formatErrorMessage(e);
      console.error(e);
    }

    if (interruptedFlagRef.current[thisRunningId]) {
      console.log('interrupted, result is', result);
      return;
    }

    try {
      console.log('destroy agent.page', activeAgent?.page);
      await activeAgent?.page?.destroy();
      console.log('destroy agent.page done', activeAgent?.page);
    } catch (e) {
      console.error(e);
    }

    currentAgentRef.current = null;
    setResult(result);
    setLoading(false);
  }, [form, getAgent, forceSameTabNavigation]);

  // Handle stop running - extension specific functionality
  const handleStop = async () => {
    const thisRunningId = currentRunningIdRef.current;
    if (thisRunningId) {
      await currentAgentRef.current?.destroy();
      interruptedFlagRef.current[thisRunningId] = true;
      resetResult();
      console.log('destroy agent done');
    }
  };

  // Validate if it can run
  const runButtonEnabled = !!getAgent && configAlreadySet;

  // Check if it can be stopped - extension specific
  const stoppable = !dryMode && loading;

  // Get the currently selected type
  const selectedType = Form.useWatch('type', form);

  const handleQuery = async (query: string) => {
    const activeAgent = getAgent(forceSameTabNavigation);
    setLoading(true);

    // 如果是总结网页，标记导航按钮可以显示
    if (query === '总结这个网页') {
      setShowNavigationButtons(false); // 先重置状态，防止重复点击
    }

    const res = await activeAgent?.aiQuery(query);
    setResult(Object.assign(blankResult, { result: res }));

    try {
      await activeAgent?.page?.destroy();
    } catch (e) {
      console.error(e);
    }

    // 如果是总结网页，导航完成后显示按钮
    if (query === '总结这个网页') {
      setShowNavigationButtons(true);
    }

    currentAgentRef.current = null;
    setLoading(false);
  };

  const handleAction = async (query: string) => {
    const activeAgent = getAgent(forceSameTabNavigation);
    setLoading(true);

    await activeAgent?.aiAction(query);
    setResult(Object.assign(blankResult, { result: '操作已成功执行' }));

    try {
      await activeAgent?.page?.destroy();
    } catch (e) {
      console.error(e);
    }

    currentAgentRef.current = null;
    setLoading(false);
  };

  const { currentPage, totalPages } = usePage();

  return (
    <div className="playground-container vertical-mode">
      <Form form={form} onFinish={handleRun}>
        <div className="playground-form-container">
          <div className="hidden">
            <EnvConfig />
          </div>

          <div className="mb-4 rounded-lg bg-sky-50 px-4 py-3 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-gray-600">
                <ReadOutlined className="mr-2" />
                视口信息
              </span>
              <span className="text-gray-800">
                当前第{' '}
                <span className="font-bold text-blue-600">{currentPage}</span>{' '}
                页， 共 <span className="font-bold">{totalPages}</span> 页
              </span>
            </div>
            <Progress
              percent={(currentPage / totalPages) * 100}
              showInfo={false}
              strokeColor="#4096ff"
              trailColor="#e6f4ff"
              size="small"
              strokeWidth={6}
            />
          </div>

          <Button
            className="relative mx-[5%] mt-2 mb-4 h-6 w-[90%]"
            onClick={() => handleQuery('总结这个网页')}
            type="primary"
            size="large"
            loading={loading && !showNavigationButtons}
          >
            网站智能导航
          </Button>

          <div
            className="navigation-buttons-container"
            style={{
              maxHeight: showNavigationButtons ? '200px' : '0px',
              opacity: showNavigationButtons ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.5s ease-in-out',
              transform: showNavigationButtons
                ? 'translateY(0)'
                : 'translateY(-10px)',
            }}
          >
            <div className="mt-1 mb-2 text-center text-gray-500">
              <small>👇 AI 为您预测的常用操作</small>
            </div>
            <MagicButton
              className="relative mx-[5%] my-2 h-4 w-[90%]"
              onClick={() => handleQuery('朗读这个网页内容')}
              type="primary"
              size="large"
            >
              朗读全文
            </MagicButton>
            <MagicButton
              className="relative mx-[5%] mt-2 mb-4 h-4 w-[90%]"
              onClick={() => handleAction('复制这篇文档的链接')}
              type="primary"
              size="large"
            >
              复制文档链接
            </MagicButton>
          </div>

          <ContextPreview
            uiContextPreview={uiContextPreview}
            setUiContextPreview={setUiContextPreview}
            showContextPreview={showContextPreview}
          />

          <PromptInput
            runButtonEnabled={runButtonEnabled}
            form={form}
            serviceMode={'In-Browser-Extension'}
            selectedType={selectedType}
            dryMode={dryMode}
            stoppable={stoppable}
            loading={loading}
            onRun={handleRun}
            onStop={handleStop}
          />
        </div>
      </Form>
      <div className="form-part">
        <PlaygroundResultView
          result={result}
          loading={loading}
          serviceMode={'In-Browser-Extension'}
          replayScriptsInfo={replayScriptsInfo}
          replayCounter={replayCounter}
          loadingProgressText={loadingProgressText}
          verticalMode={verticalMode}
        />
        <div ref={runResultRef} />
      </div>
    </div>
  );
};

export default BrowserExtensionPlayground;
