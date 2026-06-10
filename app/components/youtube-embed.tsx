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
        className="pointer-events-auto absolute right-0 top-0 h-16 w-44 bg-gradient-to-l from-black via-black/95 to-black/0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-auto absolute bottom-0 right-0 h-12 w-40 bg-gradient-to-l from-black via-black/95 to-black/0"
      />
    </div>
  );
}
