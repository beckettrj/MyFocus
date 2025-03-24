import React, { useState, useEffect } from 'react';
import { CheckCircle2, ListTodo, Calendar, Plus, CheckCircle, Trash2, Settings } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import TaskList from './components/TaskList';
import AddTaskModal from './components/AddTaskModal';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import { Task } from './types';
import { supabase, resetSupabaseClient, checkUserIsAdmin } from './lib/supabase';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [dailyTotalCompleted, setDailyTotalCompleted] = useState(0);
  const [weeklyTotalCompleted, setWeeklyTotalCompleted] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [session, setSession] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
      if (session) {
        checkAdminStatus(session.user.id);
        fetchTasks();
        fetchCompletedCount();
        fetchTotalCompleted();
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
      if (session) {
        checkAdminStatus(session.user.id);
        fetchTasks();
        fetchCompletedCount();
        fetchTotalCompleted();
      }
    });
  }, []);

  const handleSignOut = async () => {
    setIsReconnecting(true);
    await resetSupabaseClient();
    setIsReconnecting(false);
  };

  const checkAdminStatus = async (userId: string) => {
    const isUserAdmin = await checkUserIsAdmin(userId);
    setIsAdmin(isUserAdmin);
  };

  const fetchTotalCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: counters, error } = await supabase
        .from('completion_counter')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching counters:', error);
        return;
      }

      const dailyCounter = counters?.find(c => c.is_daily) || await createCounter(user.id, true);
      const weeklyCounter = counters?.find(c => !c.is_daily) || await createCounter(user.id, false);

      setDailyTotalCompleted(dailyCounter?.total_completed || 0);
      setWeeklyTotalCompleted(weeklyCounter?.total_completed || 0);
    } catch (error) {
      console.error('Error in fetchTotalCompleted:', error);
    }
  };

  const createCounter = async (userId: string, isDaily: boolean) => {
    const { data: counter, error } = await supabase
      .from('completion_counter')
      .insert([{ 
        user_id: userId,
        total_completed: 0,
        is_daily: isDaily
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating counter:', error);
      return null;
    }

    return counter;
  };

  const updateTotalCompleted = async (increment: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isDaily = activeTab === 'daily';
      const currentTotal = isDaily ? dailyTotalCompleted : weeklyTotalCompleted;

      const { error } = await supabase
        .from('completion_counter')
        .update({ 
          total_completed: currentTotal + increment,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_daily', isDaily);

      if (error) {
        console.error('Error updating counter:', error);
        return;
      }

      if (isDaily) {
        setDailyTotalCompleted(prev => prev + increment);
      } else {
        setWeeklyTotalCompleted(prev => prev + increment);
      }
    } catch (error) {
      console.error('Error in updateTotalCompleted:', error);
    }
  };

  const fetchCompletedCount = async () => {
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true)
      .eq('is_daily', activeTab === 'daily');

    if (!error && count !== null) {
      setCompletedCount(count);
    }
  };

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .is('parent_id', null)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to fetch tasks');
      return;
    }

    if (data) {
      setTasks(data.map(task => ({
        ...task,
        subtasks: []
      })));
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return;

      const task = tasks[taskIndex];
      const newCompletionStatus = !task.is_completed;

      const { error } = await supabase
        .from('tasks')
        .update({ 
          is_completed: newCompletionStatus,
          last_worked_on: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      await updateTotalCompleted(newCompletionStatus ? 1 : -1);

      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks];
        const taskToMove = { ...updatedTasks[taskIndex], is_completed: newCompletionStatus };
        updatedTasks.splice(taskIndex, 1);

        if (newCompletionStatus) {
          updatedTasks.push(taskToMove);
        } else {
          const firstCompletedIndex = updatedTasks.findIndex(t => t.is_completed);
          if (firstCompletedIndex === -1) {
            updatedTasks.push(taskToMove);
          } else {
            updatedTasks.splice(firstCompletedIndex, 0, taskToMove);
          }
        }
        
        return updatedTasks;
      });

      setCompletedCount(prev => newCompletionStatus ? prev + 1 : prev - 1);
      
      toast.success(newCompletionStatus ? 'Task completed! 🎉' : 'Task reopened');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleRemoveCompletedTasks = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('is_completed', true)
        .eq('is_daily', activeTab === 'daily');

      if (error) throw error;

      setTasks(prevTasks => prevTasks.filter(task => !(task.is_completed && task.is_daily === (activeTab === 'daily'))));
      setCompletedCount(0);
      toast.success('Completed tasks archived');
    } catch (error) {
      toast.error('Failed to remove completed tasks');
    }
  };

  if (!session) {
    return <LoginPage />;
  }

  if (showAdminPage) {
    return (
      <>
        <div className="bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setShowAdminPage(false)}
              className="text-sm text-gray-300 hover:text-white"
            >
              ← Back to Tasks
            </button>
          </div>
        </div>
        <AdminPage />
      </>
    );
  }

  const filteredTasks = tasks.filter(task => task.is_daily === (activeTab === 'daily'));
  const totalCompleted = activeTab === 'daily' ? dailyTotalCompleted : weeklyTotalCompleted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900">
      <div className="max-w-4xl mx-auto p-4">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ListTodo className="w-6 h-6 text-indigo-400" />
              <h1 className="text-2xl font-bold text-white">MyFocus</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('daily')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  activeTab === 'daily'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Daily Tasks
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  activeTab === 'weekly'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Weekly Tasks
              </button>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAdminPage(true)}
                className="text-xs text-gray-400 hover:text-gray-300 flex items-center"
              >
                <Settings className="w-3 h-3 mr-1" />
                Admin
              </button>
            )}
          </div>
          <button
            onClick={handleSignOut}
            disabled={isReconnecting}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white disabled:opacity-50"
          >
            {isReconnecting ? 'Reconnecting...' : 'Sign Out'}
          </button>
        </header>

        <div className="bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">{completedCount} completed</span>
              </div>
              <div className="text-sm text-gray-400">
                Total completed: {totalCompleted}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </button>
              <button
                onClick={handleRemoveCompletedTasks}
                className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Completed
              </button>
            </div>
          </div>

          <TaskList
            tasks={filteredTasks}
            onTaskComplete={handleTaskComplete}
            onTasksReorder={() => {}}
          />
        </div>
      </div>

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (task) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              toast.error('User not authenticated');
              return;
            }

            const { data, error } = await supabase
              .from('tasks')
              .insert({
                title: task.title,
                description: task.description,
                is_daily: task.isDaily,
                user_id: user.id,
              })
              .select()
              .single();

            if (error) {
              toast.error('Failed to create task');
              return;
            }

            if (data) {
              setTasks(prev => [...prev, { ...data, subtasks: [] }]);
              setShowAddModal(false);
              toast.success('Task created successfully');
            }
          }}
          isDaily={activeTab === 'daily'}
        />
      )}
      
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;