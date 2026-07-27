'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Assign refs
  answerRefs.current = answerRefs.current.slice(0, items.length);

  useEffect(() => {
    answerRefs.current.forEach((el, i) => {
      if (!el) return;
      const content = el.querySelector('.faq3-answer-content') as HTMLElement;
      if (!content) return;
      if (openIndex === i || animatingIndex === i) {
        el.style.maxHeight = `${content.scrollHeight + 32}px`;
        el.style.opacity = '1';
      } else {
        el.style.maxHeight = '0';
        el.style.opacity = '0';
      }
    });
  }, [openIndex, animatingIndex, items]);

  const toggleItem = (clickedIndex: number) => {
    if (openIndex === clickedIndex) {
      setAnimatingIndex(null);
      setOpenIndex(null);
      return;
    }

    if (openIndex !== null) {
      setAnimatingIndex(null);
      setOpenIndex(null);

      setTimeout(() => {
        setOpenIndex(clickedIndex);
        setAnimatingIndex(clickedIndex);
      }, 200);
    } else {
      setOpenIndex(clickedIndex);
      setAnimatingIndex(clickedIndex);
    }
  };

  return (
    <div className="faq3-container">
      {items.map((item, index) => (
        <div key={index} className={`faq3-item${openIndex === index ? ' is-open' : ''}`}>
          <button
            className={`faq3-question${openIndex === index ? ' active' : ''}`}
            onClick={() => toggleItem(index)}
            aria-expanded={openIndex === index}
          >
            <span>{item.question}</span>
            <Plus
              size={20}
              className="faq3-icon"
              aria-hidden="true"
            />
          </button>
          <div
            ref={(el) => { answerRefs.current[index] = el; }}
            className="faq3-answer"
            aria-hidden={openIndex !== index}
          >
            <div className="faq3-answer-content">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
