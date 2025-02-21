import React from 'react';
import { DndContext as DndKitContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';

export function DndProvider({ children, items, setItems }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!active || !over) return;
    
    // Find the containers
    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId;
    
    if (activeContainer !== overContainer) {
      // Moving between containers
      setItems(prev => {
        const activeItems = [...prev[activeContainer]];
        const overItems = [...prev[overContainer]];
        
        // Find the item
        const activeIndex = activeItems.findIndex(item => item.id === active.id);
        
        // Remove from original container
        const [item] = activeItems.splice(activeIndex, 1);
        
        // Add to new container
        overItems.push(item);
        
        return {
          ...prev,
          [activeContainer]: activeItems,
          [overContainer]: overItems,
        };
      });
    } else {
      // Moving within the same container
      setItems(prev => {
        const containerItems = [...prev[activeContainer]];
        const oldIndex = containerItems.findIndex(item => item.id === active.id);
        const newIndex = containerItems.findIndex(item => item.id === over.id);
        
        return {
          ...prev,
          [activeContainer]: arrayMove(containerItems, oldIndex, newIndex),
        };
      });
    }
  };

  return (
    <DndKitContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {children}
    </DndKitContext>
  );
}

export default DndProvider;