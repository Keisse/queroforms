import { Children, ReactNode, useEffect, useRef, useState } from 'react';

type DragSide = 'left' | 'right' | null;

const MIN_LEFT = 190;
const MIN_RIGHT = 240;
const MIN_CENTER = 360;
const HANDLE = 10;

function readWidth(key: string, fallback: number) {
  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function ResizableBuilderGrid({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ side: DragSide; startX: number; left: number; right: number }>({ side: null, startX: 0, left: 260, right: 380 });
  const [leftWidth, setLeftWidth] = useState(() => readWidth('builder-left-width', 260));
  const [rightWidth, setRightWidth] = useState(() => readWidth('builder-right-width', 380));
  const [dragging, setDragging] = useState<DragSide>(null);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const gridWidth = gridRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      const delta = event.clientX - dragRef.current.startX;

      if (dragging === 'left') {
        const maxLeft = Math.max(MIN_LEFT, gridWidth - dragRef.current.right - MIN_CENTER - HANDLE * 2);
        setLeftWidth(Math.min(maxLeft, Math.max(MIN_LEFT, dragRef.current.left + delta)));
      } else {
        const maxRight = Math.max(MIN_RIGHT, gridWidth - dragRef.current.left - MIN_CENTER - HANDLE * 2);
        setRightWidth(Math.min(maxRight, Math.max(MIN_RIGHT, dragRef.current.right - delta)));
      }
    };

    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    document.body.classList.add('is-resizing-builder');

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.classList.remove('is-resizing-builder');
    };
  }, [dragging]);

  useEffect(() => {
    window.localStorage.setItem('builder-left-width', String(Math.round(leftWidth)));
  }, [leftWidth]);

  useEffect(() => {
    window.localStorage.setItem('builder-right-width', String(Math.round(rightWidth)));
  }, [rightWidth]);

  const startDrag = (side: Exclude<DragSide, null>, event: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(max-width: 980px)').matches) return;
    event.preventDefault();
    dragRef.current = { side, startX: event.clientX, left: leftWidth, right: rightWidth };
    setDragging(side);
  };

  return (
    <div
      ref={gridRef}
      className="builder-grid builder-grid-resizable"
      style={{ '--builder-left': `${leftWidth}px`, '--builder-right': `${rightWidth}px` } as React.CSSProperties}
    >
      {items[0]}
      <div
        className={`builder-resize-handle ${dragging === 'left' ? 'active' : ''}`}
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar painel de fluxo"
        title="Arraste para redimensionar"
        onPointerDown={event => startDrag('left', event)}
      ><span /></div>
      {items[1]}
      <div
        className={`builder-resize-handle ${dragging === 'right' ? 'active' : ''}`}
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar painel de propriedades"
        title="Arraste para redimensionar"
        onPointerDown={event => startDrag('right', event)}
      ><span /></div>
      {items[2]}
    </div>
  );
}
