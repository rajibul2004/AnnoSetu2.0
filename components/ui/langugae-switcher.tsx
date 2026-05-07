"use client";

import { useRouter, usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const changeLang = (lang: string) => {
    router.push(`/${lang}${pathname}`);
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => changeLang("en")}>EN</button>
      <button onClick={() => changeLang("hi")}>HI</button>
      <button onClick={() => changeLang("bn")}>BN</button>
    </div>
  );
}