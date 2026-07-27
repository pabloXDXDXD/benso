'use client';

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface TestimonialItem {
  quote: string;
  author: string;
  position: string;
}

interface TestimonialsLoopProps {
  testimonials: TestimonialItem[];
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
}



export default function TestimonialsLoop({
  testimonials,
  speed = 50,
  direction = 'left',
  className = '',
}: TestimonialsLoopProps) {
  const formatName = (fullName: string) => {
    const parts = fullName.split(' ');
    return `${parts[0]} ${parts[1] || ''}`.trim();
  };

  const duplicatedTestimonials = [...testimonials, ...testimonials];

  // Nombre de clase según dirección
  const animationClass = direction === 'left' ? 'marquee-left' : 'marquee-right';

  return (
    <div className={`testimonials-loop-container ${className}`}>
      <style>{`
        .testimonials-loop-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 0.5rem 0;
        }

        .testimonials-loop-container::before,
        .testimonials-loop-container::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          z-index: 10;
          pointer-events: none;
        }
        
        .testimonials-loop-container::before {
          left: 0;
          background: linear-gradient(to right, white, transparent);
        }
        
        .testimonials-loop-container::after {
          right: 0;
          background: linear-gradient(to left, var(--bg-light, #f0f1f4), transparent);
        }

        .testimonials-loop-track {
          display: flex;
          width: max-content;
        }

        /* Animación hacia la izquierda */
        .marquee-left {
          animation: scroll-left ${speed}s linear infinite;
        }
        
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* Animación hacia la derecha */
        .marquee-right {
          animation: scroll-right ${speed}s linear infinite;
        }
        
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }

        .testimonials-loop-container:hover .marquee-left,
        .testimonials-loop-container:hover .marquee-right {
          animation-play-state: paused;
        }

        .testimonial-card-loop {
          flex-shrink: 0;
          width: 360px;
          padding: 1rem 1.5rem;
          background: white;
          border-radius: 10px;
          margin-right: 2rem;
          border: 1px solid #d0d0d0;
          box-shadow: 0 2px 8px rgba(0, 44, 106, 0.06);
          text-align: left;
        }

        .testimonial-author-row {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }

        .testimonial-avatar > span {
          background: #e8e8e8;
          color: #aaa;
        }

        .testimonial-avatar svg {
          display: block;
          width: 24px;
          height: 24px;
          stroke: #aaa;
        }

        .testimonial-author-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1;
        }

        .testimonial-card-loop .testimonial-name {
          color: #002c6a;
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.35;
        }

        .testimonial-card-loop .testimonial-sector {
          color: #555;
          font-size: 0.9rem;
          line-height: 1.35;
          display: block;
        }

        .testimonial-card-loop .testimonial-text {
          font-size: 0.95rem;
          line-height: 1.5;
          color: #6b6b6b;
          margin: 0;
        }

        /* Responsive: móvil */
        @media (max-width: 768px) {
          .testimonial-card-loop {
            width: 280px;
            padding: 1rem;
            margin-right: 1rem;
          }
          
          .testimonial-author-row {
            margin-bottom: 0.5rem;
            gap: 0.6rem;
          }

          .testimonial-avatar {
            width: 36px;
            height: 36px;
            font-size: 0.8rem;
          }

          .testimonial-card-loop .testimonial-name {
            font-size: 1rem;
          }
          
          .testimonial-card-loop .testimonial-text {
            font-size: 0.85rem;
            line-height: 1.4;
          }
        }

        @media (max-width: 480px) {
          .testimonial-card-loop {
            width: 240px;
            padding: 0.85rem;
            margin-right: 0.75rem;
          }
          
          .testimonial-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.75rem;
          }

          .testimonial-card-loop .testimonial-name {
            font-size: 0.95rem;
          }
          
          .testimonial-card-loop .testimonial-sector {
            font-size: 0.75rem;
          }
          
          .testimonial-card-loop .testimonial-text {
            font-size: 0.8rem;
          }
        }
      `}</style>
      
      <div className={`testimonials-loop-track ${animationClass}`}>
        {duplicatedTestimonials.map((testimonial, index) => (
          <div key={index} className="testimonial-card-loop">
            <div className="testimonial-author-row">
              <Avatar className="testimonial-avatar">
                <AvatarFallback>
                  <User size={26} />
                </AvatarFallback>
              </Avatar>
              <div className="testimonial-author-info">
                <strong className="testimonial-name">{formatName(testimonial.author)}</strong>
                <span className="testimonial-sector">{testimonial.position}</span>
              </div>
            </div>
            <p className="testimonial-text">{testimonial.quote}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
