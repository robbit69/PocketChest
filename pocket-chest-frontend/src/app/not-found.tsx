import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">页面不存在</h1>
        <p className="text-gray-600 mb-6">链接可能有误，请返回首页分享或提取文件。</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800">返回首页</Link>
      </div>
    </main>
  );
}
