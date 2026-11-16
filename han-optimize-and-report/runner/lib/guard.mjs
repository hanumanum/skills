export const productionHostBlocked = (hostname, hosts = []) => {
  const host = String(hostname || '').toLowerCase();
  return hosts.some((item) => {
    const value = String(item)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0];
    return value !== '' && value === host;
  });
};
