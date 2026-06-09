import Image from 'next/image'

export default function Loading() {
  return (
    <div className="tera-page flex min-h-screen items-center justify-center px-4">
      <div className="rounded-[30px] border border-tera-border bg-tera-panel/82 px-10 py-8 shadow-soft-lg backdrop-blur-2xl">
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-[67px] w-[200px]">
            <Image src="/images/TERA_LOGO_ONLY1.png" alt="Tera" fill className="object-contain block dark:hidden" priority />
            <Image src="/images/TERA_LOGO_ONLY.png" alt="Tera" fill className="hidden object-contain dark:block" priority />
          </div>
          <div className="flex gap-2">
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-tera-neon [animation-delay:-0.3s]" />
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-tera-neon [animation-delay:-0.15s]" />
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-tera-neon" />
          </div>
        </div>
      </div>
    </div>
  )
}
