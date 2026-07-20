from rest_framework import status
from rest_framework.response import Response


def success_response(
    data=None,
    message="Success.",
    status_code=status.HTTP_200_OK,
):
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )


def error_response(
    message="An error occurred.",
    errors=None,
    status_code=status.HTTP_400_BAD_REQUEST,
):
    payload = {
        "success": False,
        "message": message,
    }

    if errors is not None:
        payload["errors"] = errors

    return Response(payload, status=status_code)
