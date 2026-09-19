/** Convert network and API errors into text suitable for the Chinese interface. */
export function errorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const messages: Record<string, string> = {
    'Failed to fetch': '网络连接失败，请检查网络后重试。',
    'Load failed': '网络连接失败，请检查网络后重试。',
    'NetworkError when attempting to fetch resource.': '网络连接失败，请检查网络后重试。',
    'TOTP token required': '请输入动态验证码。',
    'TOTP not configured on server': '服务尚未配置动态验证码，请联系管理员。',
    'Invalid TOTP token': '动态验证码不正确或已过期，请重试。',
  };
  return messages[message] || (/[\u4e00-\u9fff]/.test(message) ? message : fallback);
}
