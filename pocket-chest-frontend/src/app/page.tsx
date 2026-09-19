import Link from 'next/link';
import { HomeSiteInfo } from '@/components/HomeSiteInfo';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="text-8xl mb-6">📦</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">PocketChest</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            便捷的临时文件分享。上传文件或文字，生成取件码，随时随地分享。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link href="/share" className="group block">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-blue-200 transform hover:scale-105 h-full flex flex-col">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📤</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">分享文件</h2>
              <p className="text-gray-600 mb-6 leading-relaxed flex-1">
                上传文件或文字，生成专属取件码。设置有效期，即可分享给任何人。
              </p>
              <div className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold group-hover:bg-blue-600 transition-colors duration-300">
                开始分享
              </div>
            </div>
          </Link>

          <Link href="/retrieve" className="group block">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-green-200 transform hover:scale-105 h-full flex flex-col">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📥</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">提取文件</h2>
              <p className="text-gray-600 mb-6 leading-relaxed flex-1">
                已有取件码？在这里输入，即可查看文字内容并下载分享的文件。
              </p>
              <div className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold group-hover:bg-green-600 transition-colors duration-300">
                输入取件码
              </div>
            </div>
          </Link>
        </div>

        <HomeSiteInfo />

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            无需注册账号，文件到期后自动清理。
          </p>
        </div>
      </div>
    </main>
  );
}
