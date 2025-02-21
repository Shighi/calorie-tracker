import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function FoodItem({ id, item }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-50 p-3 rounded-lg cursor-move hover:bg-gray-100"
    >
      <div className="flex justify-between items-center">
        <span className="font-medium">{item.name}</span>
        <span className="text-sm text-gray-500">{item.calories} kcal</span>
      </div>
      <div className="text-sm text-gray-400">{item.quantity}g</div>
    </div>
  );
}