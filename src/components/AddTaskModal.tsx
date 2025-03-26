import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Task } from '../types';

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (task: Task) => void;
  isDaily: boolean;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onAdd, isDaily }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the title input when the modal opens
    titleInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      is_completed: false,
      is_daily: isDaily,
      user_id: '',
      subtasks: []
    };
    onAdd(newTask);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-4 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-white">Add New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-300 mb-1">
                Task Title
              </label>
              <input
                id="taskTitle"
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="taskDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-sm text-gray-400 hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;