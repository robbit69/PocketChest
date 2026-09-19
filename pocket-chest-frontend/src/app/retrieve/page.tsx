'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RetrieveClient } from '@/components/RetrieveClient';

function RetrievePageContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  const [retrievalCode, setRetrievalCode] = useState(codeFromUrl || '');
  const [showFiles, setShowFiles] = useState(!!codeFromUrl);

  useEffect(() => {
    if (codeFromUrl) {
      setRetrievalCode(codeFromUrl);
      setShowFiles(true);
    }
  }, [codeFromUrl]);

  const handleRetrieve = () => {
    const code = retrievalCode.trim();
    if (!code) {
      alert('请输入取件码');
      return;
    }
    
    if (code.length !== 6) {
      alert('取件码必须为 6 位字符');
      return;
    }
    
    // Update URL and show files
    const newUrl = `/retrieve?code=${code}`;
    window.history.pushState({}, '', newUrl);
    setShowFiles(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRetrieve();
    }
  };

  const handleBack = () => {
    window.history.pushState({}, '', '/retrieve');
    setShowFiles(false);
    setRetrievalCode('');
  };

  if (showFiles && retrievalCode) {
    return <RetrieveClient code={retrievalCode} onBack={handleBack} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-green-600 hover:text-green-800 text-sm">
            ← 返回首页
          </Link>
          <div className="text-8xl mb-6 mt-4">📥</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">提取文件</h1>
          <p className="text-xl text-gray-600">
            输入 6 位取件码，查看并下载分享内容
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                取件码
              </label>
              <input
                type="text"
                value={retrievalCode}
                onChange={(e) => setRetrievalCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="A1B2C3"
                maxLength={6}
                className="w-full p-4 text-center text-2xl font-mono font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  输入由字母和数字组成的 6 位取件码
                </p>
                <p className={`text-xs ${
                  retrievalCode.length === 6 ? 'text-green-600' : 
                  retrievalCode.length > 6 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {retrievalCode.length}/6
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRetrieve}
              disabled={!retrievalCode.trim() || retrievalCode.trim().length !== 6}
              className="w-full py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
            >
              提取文件
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                还没有取件码？{' '}
                <Link href="/share" className="text-green-600 hover:text-green-800 font-medium">
                  去分享文件
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-2">使用方法：</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 输入收到的 6 位取件码</p>
              <p>• 查看文字并下载分享的文件</p>
              <p>• 文件将在设定的有效期后过期</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RetrievePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-xl">正在加载…</p>
        </div>
      </main>
    }>
      <RetrievePageContent />
    </Suspense>
  );
}