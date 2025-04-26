import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Props for the BaseCard component.
 */
export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique identifier for the draggable item. */
  id: string;
  /** Content to render in the card header, usually the title. */
  headerContent: React.ReactNode;
  /** Optional action elements (e.g., buttons) to display in the header. */
  headerActions?: React.ReactNode;
  /** Optional main content of the card. */
  cardContent?: React.ReactNode;
  /** Optional content to render in the card footer. */
  footerContent?: React.ReactNode;
  /** Additional class names for the outer wrapper div. */
  wrapperClassName?: string;
  /** Additional class names for the inner Card component. */
  cardClassName?: string;
  /** Indicates if the card is currently being dragged. */
  isDragging?: boolean;
  /** Indicates if a draggable item is currently over this card. */
  isOver?: boolean;
  /** Indicates if this card instance is being rendered as a drag overlay. */
  isDragOverlay?: boolean;
  /** Function to call when the card is clicked. */
  onClick?: (event: React.MouseEvent) => void;
  /** Allow overriding pointer down handling, e.g., for inline editing. */
  onPointerDown?: (event: React.PointerEvent) => void;
}

/**
 * BaseCard is a reusable, draggable card component that serves as the foundation for 
 * specialized card components like TicketCard and VisitorCard in the application.
 * 
 * This component:
 * 1. Integrates with @dnd-kit/sortable to enable drag-and-drop functionality
 * 2. Provides a consistent structure (header, content, footer) across different card types
 * 3. Manages drag states, transitions, and visual feedback
 * 4. Defines no margins by itself - spacing between cards is handled by parent components
 *    which should use either flex gap or space-y-{n} utility classes
 * 
 * Usage examples:
 * - TicketCard in ticketing/TicketCard.tsx (for ticket management)
 * - VisitorCard in ticketing/VisitorManagement.tsx (for visitor management)
 * 
 * Parent components responsible for layout and spacing:
 * - BoardLane in TicketManager.tsx uses space-y-3
 * - BoardColumn in VisitorManagement.tsx uses space-y-3
 * 
 * This architecture allows for consistent drag behavior and visual styling across
 * different card types while enabling specialized content and interactions.
 */
export const BaseCard: React.FC<BaseCardProps> = ({
  id,
  headerContent,
  headerActions,
  cardContent,
  footerContent,
  wrapperClassName,
  cardClassName,
  isDragging: externalIsDragging, // Rename to avoid conflict with useSortable's isDragging
  isOver: externalIsOver,         // Rename to avoid conflict with useSortable's isOver
  isDragOverlay = false,
  onClick,
  onPointerDown,
  ...rest // Pass remaining div props to the outer wrapper
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dndIsDragging, // isDragging from useSortable
    isOver: dndIsOver,         // isOver from useSortable
  } = useSortable({ id: id });

  // Use externally provided dragging/over state if available (e.g., for overlays), otherwise use dnd-kit's state
  const isActuallyDragging = externalIsDragging ?? dndIsDragging;
  const isActuallyOver = externalIsOver ?? dndIsOver;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isActuallyDragging ? 0.5 : 1,
    zIndex: isActuallyDragging ? 100 : 'auto',
  };

  // Prevent card click from firing when interacting with action buttons
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) {
      return; // Don't trigger card click if a button or link within was clicked
    }
    if (onClick) onClick(e);
  };

  // Combine listeners from dnd-kit with any custom onPointerDown
  const combinedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      if (onPointerDown) {
        onPointerDown(e); // Call custom handler first
      }
      // Call dnd-kit listener only if the custom handler didn't prevent default
      if (!e.isDefaultPrevented() && listeners.onPointerDown) {
        listeners.onPointerDown(e);
      }
    }
  };

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={isDragOverlay ? undefined : style}
      {...(!isDragOverlay ? attributes : {})}
      {...(!isDragOverlay ? combinedListeners : {})}
      className={cn(
        "relative group", // Added group for potential future styling needs
        isActuallyOver && !isDragOverlay && "mt-4 before:content-[''] before:absolute before:left-0 before:right-0 before:-top-2 before:h-1 before:bg-primary before:rounded-full", // Visual drop indicator
        wrapperClassName
      )}
      {...rest} // Spread other div props
    >
      <Card
        className={cn(
          // Base styles - NO MARGINS HERE
          "cursor-grab hover:shadow-md transition-shadow duration-200 border dark:border-gray-700",
          // Dragging states
          isActuallyDragging && "shadow-lg ring-2 ring-primary",
          isActuallyOver && !isDragOverlay && "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800",
          isDragOverlay && "shadow-xl rotate-3 cursor-grabbing",
          // Passed-in custom class names
          cardClassName
        )}
        onClick={handleCardClick}
        // Prevent default drag behavior which can interfere
        onDragStart={(e) => e.preventDefault()}
      >
        {(headerContent || headerActions) && (
          <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between gap-2">
            {/* Allow header content to grow */}
            <div className="flex-grow min-w-0">
              {headerContent}
            </div>
            {/* Keep actions from shrinking */}
            {headerActions && (
              <div className="flex items-center flex-shrink-0 space-x-1">
                 {/* Actions render here */}
                {headerActions}
              </div>
            )}
          </CardHeader>
        )}

        {cardContent && (
          <CardContent className="p-3 pt-0">
            {cardContent}
          </CardContent>
        )}

        {footerContent && (
          <CardFooter className="p-3 pt-1 flex justify-between items-center text-xs text-muted-foreground">
            {footerContent}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}; 