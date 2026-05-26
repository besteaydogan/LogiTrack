package com.logitrack.backendapi.exception;

import java.time.OffsetDateTime;

public record ApiErrorResponse(
    String error,
    String message,
    String path,
    OffsetDateTime timestamp
) {
}
