import { type CSSProperties, type FC, useEffect, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { TutorialStep } from '../../model/types';
import styles from './styles.module.scss';

interface TutorialOverlayProps {
  open: boolean;
  step: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
  progressText?: string;
  canGoNext: boolean;
  nextLabel?: string;
  isFinish: boolean;
  onNext: () => void;
  onClose: () => void;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TutorialOverlay: FC<TutorialOverlayProps> = ({
  open,
  step,
  stepIndex,
  totalSteps,
  progressText,
  canGoNext,
  nextLabel = 'Далее',
  isFinish,
  onNext,
  onClose,
}) => {
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const tooltipWidth = 420;
  const viewportPadding = 12;

  useEffect(() => {
    if (!open || !step?.selector || isFinish) {
      setRect(null);
      return;
    }

    const update = () => {
      const selector = step.selector;
      if (!selector) {
        setRect(null);
        return;
      }
      const element = document.querySelector(selector);
      if (!element) {
        setRect(null);
        return;
      }
      const box = element.getBoundingClientRect();
      setRect({
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, step?.selector, isFinish]);

  const tooltipStyle = useMemo<CSSProperties>(() => {
    if (isFinish || rect == null) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }
    const preferredTop = rect.top + rect.height + 12;
    const fitsBelow = preferredTop + 180 <= window.innerHeight;
    const top = fitsBelow
      ? preferredTop
      : Math.max(viewportPadding, rect.top - 180 - 12);
    const maxLeft = window.innerWidth - tooltipWidth - viewportPadding;
    const left = Math.max(
      viewportPadding,
      Math.min(rect.left, Math.max(viewportPadding, maxLeft))
    );

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  }, [rect, isFinish]);

  if (!open || step == null) {
    return null;
  }

  const isInfoStep = step.id.startsWith('toolbar-');

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} />
      {!isFinish && rect != null && (
        <div
          className={styles.highlight}
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      <div className={styles.tooltip} style={tooltipStyle}>
        {isFinish ? (
          <>
            <h3 className={styles.finishTitle}>Ты создал свой первый проект</h3>
            <p className={styles.finishText}>
              Отлично! Теперь можешь перейти к реальному проектированию.
            </p>
            <div className={styles.actions}>
              <Button onClick={onClose}>Продолжить</Button>
            </div>
          </>
        ) : (
          <>
            {isInfoStep ? (
              <div className={styles.infoHeader}>
                <Info className={styles.infoIcon} />
                <span className={styles.infoLabel}>Информация</span>
              </div>
            ) : (
              <p className={styles.step}>
                {progressText ?? `Шаг ${stepIndex + 1} из ${totalSteps}`}
              </p>
            )}
            <h3 className={styles.title}>{step.title}</h3>
            <p className={styles.description}>{step.description}</p>
            <div className={styles.actions}>
              <Button variant="secondary" size="default" onClick={onClose}>
                Начать заново
              </Button>
              <Button onClick={onNext} disabled={!canGoNext}>
                {nextLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
