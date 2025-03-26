import React, { useState, useRef } from 'react';
import { ChevronRight, GripVertical } from 'lucide-react';
import { Task } from '../types';
import toast from 'react-hot-toast';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTasksReorder: (tasks: Task[]) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskComplete, onTasksReorder }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDragStartIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragStartIndex === null || dragOverIndex === null) {
      setIsDragging(false);
      return;
    }

    const newTasks = [...tasks];
    const taskToMove = newTasks[dragStartIndex];
    
    // Animate the reordering
    let currentIndex = dragStartIndex;
    const direction = dragStartIndex < dragOverIndex ? 1 : -1;
    
    const animateMove = () => {
      if (currentIndex === dragOverIndex) {
        setIsDragging(false);
        setDragStartIndex(null);
        setDragOverIndex(null);
        // Call onTasksReorder with the final order
        onTasksReorder(newTasks);
        return;
      }

      const nextIndex = currentIndex + direction;
      newTasks[currentIndex] = newTasks[nextIndex];
      newTasks[nextIndex] = taskToMove;
      
      // Force a re-render to show the animation
      tasks.splice(0, tasks.length, ...newTasks);
      
      currentIndex = nextIndex;
      
      // Schedule next animation frame
      animationTimeoutRef.current = setTimeout(animateMove, 150);
    };

    // Start the animation
    animateMove();
  };

  const handleDoubleClick = (taskId: string) => {
    onTaskComplete(taskId);
  };

  // Clean up any ongoing animation when component unmounts
  React.useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          draggable={!task.is_completed}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onDoubleClick={() => handleDoubleClick(task.id)}
          className={`${
            task.is_completed
              ? 'bg-gray-700/50'
              : 'bg-gray-700/30 hover:bg-gray-700/40'
          } rounded-lg p-3 transition-all border border-gray-700 hover:border-gray-600 ${
            isDragging && dragOverIndex === index ? 'border-indigo-500' : ''
          }`}
          style={{
            transform: isDragging && dragOverIndex === index ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.15s ease-in-out'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!task.is_completed && (
                <div
                  className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-300"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              <input
                type="checkbox"
                checked={task.is_completed}
                onChange={() => onTaskComplete(task.id)}
                className="w-4 h-4 text-indigo-600 rounded border-gray-600 bg-gray-700 focus:ring-indigo-500 focus:ring-offset-gray-800"
              />
              <div>
                <h3 className={`text-sm font-medium leading-tight ${
                  task.is_completed ? 'text-gray-400 line-through' : 'text-gray-100'
                }`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className={`text-xs leading-snug mt-0.5 ${
                    task.is_completed ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {task.subtasks?.length > 0 && (
            <div className="mt-2 ml-7 space-y-1">
              {task.subtasks.map(subtask => (
                <div
                  key={subtask.id}
                  className="flex items-center space-x-2 text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={subtask.is_completed}
                    onChange={() => onTaskComplete(subtask.id)}
                    className="w-3 h-3 text-indigo-600 rounded border-gray-600 bg-gray-700 focus:ring-indigo-500 focus:ring-offset-gray-800"
                  />
                  <span className={`text-xs ${
                    subtask.is_completed ? 'text-gray-500 line-through' : 'text-gray-300'
                  }`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">
          No tasks yet. Add some tasks to get started!
        </div>
      )}
    </div>
  );
};

export default TaskList;