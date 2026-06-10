import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	//output: 'export',
	/* config options here */
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
