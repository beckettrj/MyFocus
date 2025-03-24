# app/routes.py
from flask import Blueprint, render_template, request, redirect, session, url_for, current_app, flash, jsonify
from datetime import datetime
import uuid

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    if not session.get('user_id'):
        return redirect(url_for('auth.login'))
    return redirect(url_for('main.dashboard'))

@main_bp.route('/dashboard')
def dashboard():
    if not session.get('user_id'):
        return redirect(url_for('auth.login'))

    user_id = session['user_id']
    tasks = current_app.supabase.table('tasks').select('*').eq('user_id', user_id).order('updated_at').execute().data

    daily = [t for t in tasks if t['list_type'] == 'daily' and not t['is_done']]
    weekly = [t for t in tasks if t['list_type'] == 'weekly' and not t['is_done']]

    subtasks = current_app.supabase.table('subtasks').select('*').execute().data
    return render_template('dashboard.html', daily=daily, weekly=weekly, subtasks=subtasks)

@main_bp.route('/task/add', methods=['POST'])
def add_task():
    user_id = session['user_id']
    title = request.form['title']
    list_type = request.form['list_type']
    comment = request.form.get('comment')

    current_app.supabase.table('tasks').insert({
        "user_id": user_id,
        "title": title,
        "list_type": list_type,
        "comment": comment
    }).execute()

    return redirect(url_for('main.dashboard'))

@main_bp.route('/task/attack/<task_id>', methods=['POST'])
def attack_task(task_id):
    current_app.supabase.table('tasks').update({
        "updated_at": datetime.utcnow(),
        "last_checked_at": datetime.utcnow()
    }).eq("id", task_id).execute()
    return redirect(url_for('main.dashboard'))

@main_bp.route('/task/done/<task_id>', methods=['POST'])
def complete_task(task_id):
    task = current_app.supabase.table('tasks').select("*").eq("id", task_id).execute().data[0]

    current_app.supabase.table('history').insert({
        "user_id": task['user_id'],
        "task_title": task['title'],
        "list_type": task['list_type'],
        "completed_at": datetime.utcnow()
    }).execute()

    current_app.supabase.table('tasks').delete().eq("id", task_id).execute()

    return jsonify({"celebrate": True, "title": task['title']})

@main_bp.route('/subtask/add', methods=['POST'])
def add_subtask():
    task_id = request.form['task_id']
    title = request.form['title']

    current_app.supabase.table('subtasks').insert({
        "task_id": task_id,
        "title": title
    }).execute()

    return redirect(url_for('main.dashboard'))

@main_bp.route('/subtask/done/<subtask_id>', methods=['POST'])
def complete_subtask(subtask_id):
    current_app.supabase.table('subtasks').update({
        "is_done": True
    }).eq("id", subtask_id).execute()
    return redirect(url_for('main.dashboard'))

