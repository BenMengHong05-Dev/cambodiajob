"""
Uniform exception handler for DRF API responses.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "error": "Request failed",
            "details": response.data,
            "status_code": response.status_code,
        }
        if isinstance(response.data, dict) and "detail" in response.data:
            custom_data["error"] = str(response.data["detail"])
        elif isinstance(response.data, str):
            custom_data["error"] = response.data

        response.data = custom_data
        return response

    # Unhandled server errors
    logger.exception("Unhandled Server Error: %s", exc)
    return Response(
        {
            "success": False,
            "error": "An internal server error occurred.",
            "details": str(exc),
            "status_code": 500,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )

