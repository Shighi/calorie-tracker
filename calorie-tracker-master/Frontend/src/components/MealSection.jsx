import React from 'react';
import PropTypes from 'prop-types';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import FoodItem from '../contexts/FoodItem';

export default function MealSection({ 
  id, 
  title, 
  items = [], 
  removeFoodItem 
}) {
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

  // Ensure each item has a unique key
  const enhancedItems = items.map(item => ({
    ...item,
    // Add a unique identifier if not already present
    uniqueId: item.id || uuidv4()
  }));

  // Create a list of unique IDs for the sortable context
  const itemIds = enhancedItems.map(item => item.uniqueId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-4 rounded-lg shadow-sm min-h-40 relative"
    >
      <div 
        className="font-semibold text-lg mb-3 cursor-move" 
        {...listeners}
      >
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
            {enhancedItems.map(item => (
              <div 
                key={item.uniqueId} 
                className="relative group"
              >
                <FoodItem 
                  id={item.uniqueId} 
                  item={item} 
                />
                <button
                  onClick={() => removeFoodItem(id, item.uniqueId)}
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

// PropTypes for type checking
MealSection.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string
  })),
  removeFoodItem: PropTypes.func.isRequired
};