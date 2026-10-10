from typing import Dict, List, Optional, Any
from fastapi import HTTPException, Security, Header

ROLES = {
    "Analyst": {
        "can_view_global": False,
        "can_view_regions": False,
        "can_view_entity": True,
        "can_run_whatif": True,
        "can_generate_reports": True,
        "can_configure_thresholds": False,
        "can_configure_scheduler": False,
        "can_manage_roles": False,
        "allowed_entities": ["BNPPARIBAS_PARIS"] # Restricted entity
    },
    "Treasury Manager": {
        "can_view_global": False,
        "can_view_regions": True, # APAC, EMEA, NAMER
        "can_view_entity": True,
        "can_run_whatif": True,
        "can_generate_reports": True,
        "can_configure_thresholds": False,
        "can_configure_scheduler": False,
        "can_manage_roles": False,
        "allowed_regions": ["EMEA", "APAC", "NAMER"]
    },
    "Admin": {
        "can_view_global": True,
        "can_view_regions": True,
        "can_view_entity": True,
        "can_run_whatif": True,
        "can_generate_reports": True,
        "can_configure_thresholds": True,
        "can_configure_scheduler": True,
        "can_manage_roles": True,
        "allowed_regions": ["ALL"]
    }
}

ACTIVE_SESSIONS = {
    "token-analyst-1": {"user": "analyst@bnpparibas.com", "role": "Analyst", "assigned_entity": "BNPPARIBAS_PARIS"},
    "token-manager-1": {"user": "manager@bnpparibas.com", "role": "Treasury Manager", "assigned_region": "EMEA"},
    "token-admin-1": {"user": "admin@bnpparibas.com", "role": "Admin", "assigned_region": "ALL"}
}

def verify_session_role(x_session_token: Optional[str] = Header(None), required_permission: Optional[str] = None):
    # Default to Admin for frictionless demo exploration if no token is passed
    if not x_session_token or x_session_token not in ACTIVE_SESSIONS:
        session = {"user": "demo-admin@bnpparibas.com", "role": "Admin"}
    else:
        session = ACTIVE_SESSIONS[x_session_token]

    role = session["role"]
    permissions = ROLES.get(role, ROLES["Analyst"])

    if required_permission and not permissions.get(required_permission, False):
        raise HTTPException(
            status_code=403, 
            detail=f"Forbidden: Role '{role}' lacks permission '{required_permission}'"
        )
    return session
