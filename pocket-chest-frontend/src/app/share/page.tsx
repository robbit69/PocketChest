'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileUpload } from '@/components/FileUpload';
import { TextInput } from '@/components/TextInput';
import { ExpirySelector } from '@/components/ExpirySelector';
import { TOTPModal } from '@/components/TOTPModal';
import { UploadProgress } from '@/components/UploadProgress';
import { usePocketChest } from '@/hooks/usePocketChest';
import { errorMessage } from '@/lib/error-message';
import { PocketChestAPI } from '@/lib/api';
import { isValidRetrievalCode, retrievalCodeHint } from '@/lib/retrieval-code';
import { TextItem, ValidityDays } from '@/lib/types';

export default function SharePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [validityDays, setValidityDays] = useState<ValidityDays>(7);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [customRetrievalCode, setCustomRetrievalCode] = useState('');
  const invalidCustomCode = customRetrievalCode.trim() !== '' && !isValidRetrievalCode(customRetrievalCode);
  const [copied, setCopied] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showTOTPModal, setShowTOTPModal] = useState(false);
  const [totpError, setTotpError] = useState<string>('');
  const [sessionData, setSessionData] = useState<{sessionId: string, uploadToken: string} | null>(null);
  
  // Config state
  const [configLoaded, setConfigLoaded] = useState(false);
  const [requireTOTP, setRequireTOTP] = useState(false);
  
  const { 
    uploadWithSession, 
    retryUpload, 
    cancelUpload, 
    isUploading,
    hasUploadedContent,
    uploadProgress, 
    uploadStatus, 
    fileProgress,
    error, 
    clearError 
  } = usePocketChest();
  const api = new PocketChestAPI();

  // Fetch config and initialize session
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First, fetch server configuration
        const config = await api.getConfig();
        setRequireTOTP(config.requireTOTP);
        setConfigLoaded(true);
        
        // Then initialize session based on config
        if (config.requireTOTP) {
          setShowTOTPModal(true);
        } else {
          // No TOTP required, create session immediately
          setIsAuthenticating(true);
          const session = await api.createChest();
          setSessionData({ sessionId: session.sessionId, uploadToken: session.uploadToken });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Show error state or fallback
      } finally {
        setIsAuthenticating(false);
      }
    };

    initializeApp();
  }, []);

  const handleTOTPSubmit = async (totpToken: string) => {
    setTotpError('');
    setIsAuthenticating(true);
    
    try {
      const session = await api.createChest(totpToken);
      setSessionData({ sessionId: session.sessionId, uploadToken: session.uploadToken });
      setIsAuthenticated(true);
      setShowTOTPModal(false);
    } catch (error) {
      const message = errorMessage(error, '身份验证失败');
      setTotpError(message);
      throw error; // Re-throw to let modal handle UI state
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleTOTPClose = () => {
    // Don't allow closing if TOTP is required - they need to authenticate
    if (requireTOTP && !isAuthenticated) {
      return;
    }
    setShowTOTPModal(false);
    setTotpError('');
  };

  const handleUpload = async () => {
    if (invalidCustomCode) return;
    if (files.length === 0 && textItems.length === 0) {
      alert('请先添加要分享的文件或文字');
      return;
    }

    if (!sessionData) {
      alert('上传尚未准备好，请稍后重试。');
      return;
    }
    
    // Scroll to top to show upload progress
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Fallback for older browsers
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 100);
    
    try {
      const result = await uploadWithSession(
        sessionData.sessionId,
        sessionData.uploadToken,
        files,
        textItems,
        validityDays,
        customRetrievalCode.trim().toUpperCase()
      );
      setUploadResult(result.retrievalCode);
      setFiles([]);
      setTextItems([]);
    } catch (error) {
      console.error('Upload failed:', error);
      // Error is handled by the uploadProgress component
    }
  };

  const handleRetry = async () => {
    if (invalidCustomCode) return;
    if (!sessionData) return;
    
    try {
      const result = await retryUpload(
        sessionData.sessionId,
        sessionData.uploadToken,
        files,
        textItems,
        validityDays,
        customRetrievalCode.trim().toUpperCase()
      );
      setUploadResult(result.retrievalCode);
      setFiles([]);
      setTextItems([]);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const handleCancel = () => {
    cancelUpload();
    // Reset local page state
    setUploadResult(null);
    setCopied(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show loading state until config is loaded and authentication is complete
  if (!configLoaded || (requireTOTP && !isAuthenticated) || isAuthenticating) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← 返回首页
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-2">📤 分享文件与文字</h1>
            <p className="text-xl text-gray-600">上传文件或文字，生成取件码即可分享</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="text-8xl mb-6">
                {!configLoaded ? '🎯' : (requireTOTP ? '🔐' : '⏳')}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {!configLoaded ? '正在加载…' : (requireTOTP ? '需要身份验证' : '正在准备上传')}
              </h2>
              <p className="text-gray-600 mb-6">
                {!configLoaded
                  ? '正在连接分享服务，请稍候…'
                  : (requireTOTP 
                    ? '请输入身份验证器中的动态验证码以继续'
                    : '正在准备上传，请稍候…'
                  )
                }
              </p>
              {isAuthenticating && (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin text-xl">⏳</div>
                  <span>正在验证…</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* TOTP Modal */}
        <TOTPModal
          isOpen={showTOTPModal}
          onClose={handleTOTPClose}
          onSubmit={handleTOTPSubmit}
          error={totpError}
          allowCancel={false}
        />
      </main>
    );
  }

  if (uploadResult) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← 返回首页
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-2">上传成功！</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="text-8xl mb-6">✅</div>
              <h2 className="text-3xl font-bold text-green-700 mb-4">分享成功</h2>
              <p className="text-gray-600 mb-8 text-lg">文件已上传，将取件码分享给对方即可。</p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <p className="text-sm text-gray-600 mb-3 font-medium">分享此取件码：</p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <code className="text-3xl break-all font-mono font-bold text-blue-600 bg-white px-6 py-3 rounded-lg border-2 border-blue-200">
                    {uploadResult}
                  </code>
                  <button
                    onClick={() => copyToClipboard(uploadResult)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      copied
                        ? 'text-green-600 bg-green-50 border-green-200'
                        : 'text-blue-600 hover:bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    title="复制取件码"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  对方可在此地址输入取件码： {window.location.origin}/retrieve
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
                >
                  继续分享
                </button>
                <Link 
                  href="/"
                  className="block w-full py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold text-center"
                >
                  返回首页
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← 返回首页
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-2">📤 分享文件与文字</h1>
          <p className="text-xl text-gray-600">上传文件或文字，生成取件码即可分享</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-red-700">{error}</p>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        <UploadProgress
          files={files}
          textItems={textItems}
          isUploading={isUploading}
          progress={uploadProgress}
          fileProgress={fileProgress}
          uploadStatus={uploadStatus}
          error={error || undefined}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-8">
            <fieldset disabled={isUploading || hasUploadedContent} className="space-y-8 disabled:opacity-60">
            {/* Text Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 文字内容</h2>
              <TextInput textItems={textItems} onTextItemsChange={setTextItems} />
            </div>
            
            {/* Files Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📁 文件</h2>
              <FileUpload files={files} onFilesChange={setFiles} />
            </div>
            
            </fieldset>
            {hasUploadedContent && <p className="text-sm text-blue-700">文件已上传。可修改取件码或有效期后重试，无需重新上传。</p>}
            <ExpirySelector value={validityDays} onChange={setValidityDays} />
            
            <div>
              <label htmlFor="custom-retrieval-code" className="block text-sm font-medium text-gray-700 mb-2">自定义取件码（可选）</label>
              <input
                id="custom-retrieval-code"
                value={customRetrievalCode}
                onChange={(event) => setCustomRetrievalCode(event.target.value.toUpperCase())}
                disabled={isUploading}
                maxLength={32}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={invalidCustomCode}
                aria-describedby="custom-code-hint"
                placeholder="例如 MY-FILES_2026，留空自动生成"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p id="custom-code-hint" className={`text-sm mt-2 ${invalidCustomCode ? 'text-red-600' : 'text-gray-500'}`}>
                {retrievalCodeHint}。留空自动生成；取件码不可重复。
              </p>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading || invalidCustomCode || (files.length === 0 && textItems.length === 0)}
              className="w-full py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin text-xl">⏳</div>
                  正在上传…
                </span>
              ) : (
                '上传并生成取件码'
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}