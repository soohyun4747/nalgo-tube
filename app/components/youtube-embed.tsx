type YouTubeEmbedProps = {
  src: string;
  title: string;
};

export default function YouTubeEmbed({ src, title }: YouTubeEmbedProps) {
  const separator = src.includes('?') ? '&' : '?';
  const embedSrc = `${src}${separator}rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner">
      <iframe
        className="h-full w-full"
        src={embedSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      <div
        aria-hidden="true"
        className="pointer-events-auto absolute top-0 left-0 h-[22%] w-[60%] max-h-16 max-w-80 bg-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-auto absolute bottom-0 right-0 h-[30%] w-[70%] max-h-16 max-w-80 bg-transparent"
      />
    </div>
  );
}
