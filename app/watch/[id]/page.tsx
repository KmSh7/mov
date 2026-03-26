'use client';

import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function WatchPage({ params }: PageProps) {
  // The actual content is rendered in the layout
  // This page just needs to resolve params for Next.js
  use(params);
  
  return null;
}
