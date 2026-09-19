'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PocketChestAPI } from '@/lib/api';

const SITE_URL = 'https://p.justfr.org/';
const api = new PocketChestAPI();

function formatGigabytes(bytes: number) {
  return (bytes / (1024 ** 3)).toFixed(2);
}

export function HomeSiteInfo() {
  const [usedBytes, setUsedBytes] = useState<number | null>(null);
  const [capacityBytes, setCapacityBytes] = useState(10 * 1024 ** 3);

  useEffect(() => {
    api.getConfig()
      .then((config) => {
        setUsedBytes(config.storageUsedBytes);
        setCapacityBytes(config.storageCapacityBytes);
      })
      .catch(() => setUsedBytes(null));
  }, []);

  return (
    <div className="mt-10 bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        <a href={SITE_URL} aria-label="打开 PocketChest" className="shrink-0">
          <QRCodeSVG value={SITE_URL} size={132} level="M" marginSize={2} title="扫码打开 p.justfr.org" />
        </a>
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">手机扫码打开本站</h2>
          <a href={SITE_URL} className="text-blue-600 hover:text-blue-800 break-all">p.justfr.org</a>
          <p className="mt-4 text-gray-700 font-medium" aria-live="polite">
            本站存储状态：{usedBytes === null ? '正在读取…' : `${formatGigabytes(usedBytes)} G / ${formatGigabytes(capacityBytes).replace('.00', '')} G`}
          </p>
        </div>
      </div>
    </div>
  );
}
