# Routes
- /login → login page
- /logout → destroy session
- /admin → admin panel (add user)

# Functions
- verify_user(username, password)
- create_user(username, password, is_admin)

# Session structure:
session = {
    "user_id": UUID,
    "username": str,
    "is_admin": bool
}
