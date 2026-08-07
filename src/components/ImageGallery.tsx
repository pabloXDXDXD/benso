'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Story {
  id: string;
  title: string;
  images: string[];
}

const photoUrl = (photoId: string, w: number, q: number) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&q=${q}`;

const thumbUrl = (photoId: string) => photoUrl(photoId, 480, 70);
const fullUrl = (photoId: string) => photoUrl(photoId, 1000, 75);

const stories: Story[] = [
  {
    id: 'inicios',
    title: 'Los inicios',
    images: [
      'photo-1454165804606-c3d57bc86b40',
      'photo-1556761175-b413da4baf72',
      'photo-1552664730-d307ca884978',
    ],
  },
  {
    id: 'talleres-cursos',
    title: 'Los talleres y cursos',
    images: [
      'photo-1501504905252-473c47e087f8',
      'photo-1475721027785-f74eccf877e2',
      'photo-1522202176988-66273c2fd55f',
      'photo-1540575467063-178a50c2df87',
    ],
  },
  {
    id: 'equipo-accion',
    title: 'El equipo en acción',
    images: [
      'photo-1522071820081-009f0129c71c',
      'photo-1519389950473-47ba0277781c',
      'photo-1517245386807-bb43f82c33c4',
    ],
  },
  {
    id: 'clientes-alianzas',
    title: 'Los clientes y alianzas',
    images: [
      'photo-1497366216548-37526070297c',
      'photo-1521737604893-d14cc237f11d',
      'photo-1531482615713-2afd69097998',
    ],
  },
  {
    id: 'resultados',
    title: 'Los resultados',
    images: [
      'photo-1460925895917-afdab827c52f',
      'photo-1556761175-b413da4baf72',
      'photo-1531058020387-3be344556be6',
    ],
  },
];

export function ImageGallery() {
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const stateRef = useRef({ story: activeStory, image: activeImage });
  useEffect(() => {
    stateRef.current = { story: activeStory, image: activeImage };
  });

  const openStory = (index: number) => {
    setActiveStory(index);
    setActiveImage(0);
  };

  const closeViewer = useCallback(() => {
    setActiveStory(null);
    setActiveImage(0);
  }, []);

  const goNext = useCallback(() => {
    const { story, image } = stateRef.current;
    if (story === null) return;
    if (image < stories[story].images.length - 1) {
      setActiveImage(image + 1);
    } else if (story < stories.length - 1) {
      setActiveStory(story + 1);
      setActiveImage(0);
    }
  }, []);

  const goPrev = useCallback(() => {
    const { story, image } = stateRef.current;
    if (story === null) return;
    if (image > 0) {
      setActiveImage(image - 1);
    } else if (story > 0) {
      setActiveStory(story - 1);
      setActiveImage(stories[story - 1].images.length - 1);
    }
  }, []);

  useEffect(() => {
    if (activeStory === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeStory, closeViewer, goNext, goPrev]);

  useEffect(() => {
    if (activeStory === null) return;
    const preload = (photoId: string) => {
      const img = new Image();
      img.src = fullUrl(photoId);
    };
    // Preload the whole active story plus the first image of the next one,
    // so swiping between slides (and stories) is instant.
    stories[activeStory].images.forEach(preload);
    const nextStory = stories[activeStory + 1];
    if (nextStory) preload(nextStory.images[0]);
  }, [activeStory]);

  useEffect(() => {
    if (activeStory === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeStory]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeViewer();
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) goPrev();
    else goNext();
  };

  const isOpen = activeStory !== null;
  const story = activeStory !== null ? stories[activeStory] : null;

  return (
    <>
      <div className="story-gallery">
        {stories.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className="story-card"
            aria-label={`Ver ${item.title}`}
            onClick={() => openStory(index)}
          >
            <img
              className="story-card-cover"
              src={thumbUrl(item.images[0])}
              alt={item.title}
              loading="lazy"
              decoding="async"
            />
            <div className="story-card-overlay">
              <span>{item.title}</span>
            </div>
          </button>
        ))}
      </div>

      {isOpen && story && (
        <div
          className="story-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={story.title}
          onClick={handleBackdropClick}
        >
          <div className="story-viewer-progress" aria-hidden="true">
            {story.images.map((_, i) => (
              <span
                key={i}
                className={`story-viewer-segment${i <= activeImage ? ' is-active' : ''}`}
              />
            ))}
          </div>

          <div className="story-viewer-header">
            <p className="story-viewer-title">{story.title}</p>
            <button
              type="button"
              className="story-viewer-close"
              aria-label="Cerrar"
              onClick={closeViewer}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <img
            className="story-viewer-image"
            src={fullUrl(story.images[activeImage])}
            alt={`${story.title} — imagen ${activeImage + 1} de ${story.images.length}`}
            onClick={handleImageClick}
          />

          <button
            type="button"
            className="story-viewer-nav story-viewer-prev"
            aria-label="Anterior"
            onClick={goPrev}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            className="story-viewer-nav story-viewer-next"
            aria-label="Siguiente"
            onClick={goNext}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
