import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { XCircle } from 'lucide-react';
import FoodItem from '../contexts/FoodItem';

export default function MealSection({ id, title, items = [], removeFoodItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Create a list of IDs for the sortable context
  const itemIds = items.map(item => item.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-4 rounded-lg shadow-sm min-h-40 relative"
    >
      <div className="font-semibold text-lg mb-3" {...listeners}>
        {title}
        <span className="text-sm text-gray-500 ml-2">
          ({items.length} {items.length === 1 ? 'item' : 'items'})
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-400 text-sm p-3 text-center border border-dashed rounded-md">
          Drop food items here
        </div>
      ) : (
        <SortableContext items={itemIds}>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="relative group">
                <FoodItem id={item.id} item={item} />
                <button
                  onClick={() => removeFoodItem(id, item.id)}
                  className="absolute -top-1 -right-1 bg-white rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove item"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}