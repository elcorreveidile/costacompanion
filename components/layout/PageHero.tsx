import Image from 'next/image';

interface PageHeroProps {
  imageSrc: string;
  imageAlt: string;
  tag?: string;
  title: string;
  subtitle?: string;
  priority?: boolean;
}

export function PageHero({ imageSrc, imageAlt, tag, title, subtitle, priority = false }: PageHeroProps) {
  return (
    <section
      className="relative py-20 px-6 text-center overflow-hidden"
      style={{ background: 'var(--green)', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority={priority}
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(28,50,38,0.72)' }}
      />
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-3">
        {tag && (
          <p
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: 'rgba(247,244,239,0.6)' }}
          >
            {tag}
          </p>
        )}
        <h1
          className="font-display text-4xl sm:text-5xl font-semibold leading-tight"
          style={{ color: 'var(--bone)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-base sm:text-lg max-w-2xl leading-relaxed mt-1"
            style={{ color: 'rgba(247,244,239,0.82)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
