'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
    >
      ← 뒤로 가기
    </button>
  );
}
