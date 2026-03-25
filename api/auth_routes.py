from fastapi import APIRouter, Depends
from api.auth import login

router = APIRouter()

# POST /api/auth/login — accepts OAuth2 form data (username + password)
router.add_api_route("/login", login, methods=["POST"])
